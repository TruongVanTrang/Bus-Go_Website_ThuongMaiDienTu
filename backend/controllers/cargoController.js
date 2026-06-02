const { sql } = require('../config/db');
const { sendCargoContractEmail } = require('../utils/emailService');

// @desc    Tạo mới yêu cầu ký gửi hàng hóa
// @route   POST /api/cargo/consignment
// @access  Private
const createConsignment = async (req, res) => {
  const {
    loaiDichVu, diemGui, diemNhan, ngayGui,
    diaChiGuiChiTiet, diaChiNhanChiTiet, tenNguoiGui, soDienThoaiNguoiGui, soCCCD, emailNguoiGui,
    tenNguoiNhan, soDienThoaiNguoiNhan, soLuong, trongLuong, loaiHangHoa,
    maChuyenXe, loaiXeVanTai, chieKySo, hinhAnh
  } = req.body;

  const userId = req.user.id;

  // Validate required inputs
  if (!soCCCD) {
    return res.status(400).json({ message: 'Vui lòng cung cấp số CCCD để xác minh danh tính' });
  }
  if (!tenNguoiGui || !soDienThoaiNguoiGui || !chieKySo) {
    return res.status(400).json({ message: 'Thiếu thông tin người gửi hoặc chữ ký điện tử' });
  }
  if (!diemGui || !diemNhan || !ngayGui || !diaChiGuiChiTiet || !diaChiNhanChiTiet) {
    return res.status(400).json({ message: 'Thiếu thông tin lộ trình và địa điểm nhận/giao' });
  }

  try {
    const pool = await sql.connect();

    // Verify customer exists
    const customerCheck = await pool.request()
      .input('maKhachHang', sql.Int, userId)
      .query('SELECT maKhachHang FROM KhachHang WHERE maKhachHang = @maKhachHang');

    if (customerCheck.recordset.length === 0) {
      // Auto seed client into KhachHang if not there (for fallback support)
      await pool.request()
        .input('maKhachHang', sql.Int, userId)
        .query('INSERT INTO KhachHang (maKhachHang, diemTichLuy, capDoThanhVien) VALUES (@maKhachHang, 0, \'bronze\')');
    }

    // Generate unique consignment ID
    const consignmentId = 'CSM' + Date.now();

    // Dynamic calculations similar to frontend
    let basePrice = 0;
    
    const PROVINCE_KM = {
      'Thanh Hóa': 0, 'Nghệ An': 140, 'Hà Tĩnh': 190, 'Quảng Bình': 340,
      'Quảng Trị': 440, 'Huế': 510, 'Đà Nẵng': 610, 'Quảng Nam': 680, 'Quảng Ngãi': 780
    };
    
    let distance = 50;
    if (diemGui && diemNhan) {
      const kmFrom = PROVINCE_KM[diemGui] ?? 0;
      const kmTo = PROVINCE_KM[diemNhan] ?? 0;
      if ((kmFrom !== 0 || diemGui === 'Thanh Hóa') && (kmTo !== 0 || diemNhan === 'Thanh Hóa')) {
         let d = Math.abs(kmFrom - kmTo);
         distance = d < 50 ? 50 : d;
      }
    }

    if (loaiDichVu === 'gui_kem') {
      const prices = { documents: 40000, fragile: 80000, bulky: 150000, motorcycle: 300000 };
      const base = prices[loaiHangHoa] || 0;
      const weightFloat = parseFloat(trongLuong) || 1;
      const qty = parseInt(soLuong) || 1;
      if (loaiHangHoa === 'motorcycle') {
        basePrice = base * qty;
      } else {
        const calculatedPrice = weightFloat * 10000;
        const pricePerItem = Math.max(30000, calculatedPrice);
        basePrice = pricePerItem * qty;
      }
    } else {
      const truckPricesPerKm = { truck_10t: 15000, truck_20t: 25000, truck_30t: 35000 };
      basePrice = (truckPricesPerKm[loaiXeVanTai] || 15000) * distance;
    }

    const declaredVal = parseFloat(req.body.giaTrucDeclare) || 0;
    const insurancePrice = Math.ceil(declaredVal * 0.02);
    const totalPrice = basePrice + insurancePrice;

    const initialStatus = loaiDichVu === 'gui_kem' ? 'dang_cho_xac_nhan' : 'dang_tim_xe_trong';
    const initialLocation = loaiDichVu === 'gui_kem' ? 'Chờ xác nhận từ tài xế tuyến' : 'Chờ phân phối xe tải từ trạm điều hành';

    // Insert into database
    await pool.request()
      .input('maKhachHang', sql.Int, userId)
      .input('consignmentId', sql.VarChar, consignmentId)
      .input('loaiDichVu', sql.NVarChar, loaiDichVu)
      .input('diemGui', sql.NVarChar, diemGui)
      .input('diemNhan', sql.NVarChar, diemNhan)
      .input('ngayGui', sql.Date, new Date(ngayGui))
      .input('diaChiGuiChiTiet', sql.NVarChar, diaChiGuiChiTiet)
      .input('diaChiNhanChiTiet', sql.NVarChar, diaChiNhanChiTiet)
      .input('tenNguoiGui', sql.NVarChar, tenNguoiGui)
      .input('soDienThoaiNguoiGui', sql.VarChar, soDienThoaiNguoiGui)
      .input('soCCCD', sql.VarChar, soCCCD)
      .input('emailNguoiGui', sql.VarChar, emailNguoiGui)
      .input('tenNguoiNhan', sql.NVarChar, tenNguoiNhan)
      .input('soDienThoaiNguoiNhan', sql.VarChar, soDienThoaiNguoiNhan)
      .input('trangThaiKyGui', sql.NVarChar, initialStatus)
      .input('trangThaiThanhToan', sql.NVarChar, 'cho_thanh_toan')
      .input('soLuong', sql.Int, parseInt(soLuong) || 1)
      .input('trongLuong', sql.Float, parseFloat(trongLuong) || 1)
      .input('loaiHangHoa', sql.NVarChar, loaiHangHoa)
      .input('maChuyenXe', sql.Int, maChuyenXe || null)
      .input('loaiXeVanTai', sql.VarChar, loaiXeVanTai || null)
      .input('giaCuoc', sql.Decimal(18, 2), basePrice)
      .input('giaTrucDeclare', sql.Decimal(18, 2), declaredVal)
      .input('giaBAO_HIEM', sql.Decimal(18, 2), insurancePrice)
      .input('tongTien', sql.Decimal(18, 2), totalPrice)
      .input('chieKySo', sql.NVarChar, chieKySo)
      .input('trangThaiKySo', sql.Bit, 1)
      .input('viTriHienTai', sql.NVarChar, initialLocation)
      .input('hinhAnh', sql.NVarChar, hinhAnh ? JSON.stringify(hinhAnh) : '[]')
      .query(`
        INSERT INTO KyGuiHang (
          maKhachHang, consignmentId, loaiDichVu, diemGui, diemNhan, ngayGui,
          diaChiGuiChiTiet, diaChiNhanChiTiet, tenNguoiGui, soDienThoaiNguoiGui, soCCCD, emailNguoiGui,
          tenNguoiNhan, soDienThoaiNguoiNhan, trangThaiKyGui, trangThaiThanhToan, soLuong, trongLuong,
          loaiHangHoa, maChuyenXe, loaiXeVanTai, giaCuoc, giaTrucDeclare, giaBAO_HIEM,
          tongTien, chieKySo, trangThaiKySo, viTriHienTai, hinhAnh
        )
        VALUES (
          @maKhachHang, @consignmentId, @loaiDichVu, @diemGui, @diemNhan, @ngayGui,
          @diaChiGuiChiTiet, @diaChiNhanChiTiet, @tenNguoiGui, @soDienThoaiNguoiGui, @soCCCD, @emailNguoiGui,
          @tenNguoiNhan, @soDienThoaiNguoiNhan, @trangThaiKyGui, @trangThaiThanhToan, @soLuong, @trongLuong,
          @loaiHangHoa, @maChuyenXe, @loaiXeVanTai, @giaCuoc, @giaTrucDeclare, @giaBAO_HIEM,
          @tongTien, @chieKySo, @trangThaiKySo, @viTriHienTai, @hinhAnh
        )
      `);

    res.status(201).json({
      message: 'Tạo yêu cầu ký gửi thành công, đang chờ phê duyệt!',
      consignmentId
    });

  } catch (error) {
    console.error('Lỗi khi tạo consignment:', error);
    res.status(500).json({ message: 'Lỗi server khi lưu thông tin gửi hàng: ' + error.message });
  }
};

// @desc    Lấy danh sách vận đơn ký gửi của người dùng đang đăng nhập
// @route   GET /api/cargo/my-consignments
// @access  Private
const getCustomerConsignments = async (req, res) => {
  const userId = req.user.id;
  try {
    const pool = await sql.connect();
    const result = await pool.request()
      .input('maKhachHang', sql.Int, userId)
      .execute('sp_TimKyGuiHang');

    // Parse image JSON strings
    const records = result.recordset.map(r => {
      try {
        r.hinhAnh = JSON.parse(r.hinhAnh || '[]');
      } catch (e) {
        r.hinhAnh = [];
      }
      return r;
    });

    res.json(records);
  } catch (error) {
    console.error('Lỗi lấy danh sách ký gửi:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Lấy chi tiết vận đơn theo ID
// @route   GET /api/cargo/consignment/:id
// @access  Public
const getConsignmentById = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await sql.connect();
    const result = await pool.request()
      .input('consignmentId', sql.VarChar, id)
      .query('SELECT * FROM KyGuiHang WHERE consignmentId = @consignmentId');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy vận đơn' });
    }

    const consignment = result.recordset[0];
    try {
      consignment.hinhAnh = JSON.parse(consignment.hinhAnh || '[]');
    } catch (e) {
      consignment.hinhAnh = [];
    }

    res.json(consignment);
  } catch (error) {
    console.error('Lỗi lấy chi tiết vận đơn:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Cập nhật trạng thái vận đơn (duyệt/từ chối/di chuyển)
// @route   PUT /api/cargo/consignment/:id/status
// @access  Public (Tài xế / Nhân viên điều phối gọi)
const updateConsignmentStatus = async (req, res) => {
  const { id } = req.params;
  const { trangThaiKyGui, maTaiXe, driverInfo, viTriHienTai } = req.body;

  try {
    const pool = await sql.connect();
    const checkResult = await pool.request()
      .input('consignmentId', sql.VarChar, id)
      .query('SELECT maKyGui FROM KyGuiHang WHERE consignmentId = @consignmentId');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy vận đơn để cập nhật' });
    }

    await pool.request()
      .input('consignmentId', sql.VarChar, id)
      .input('trangThaiKyGui', sql.NVarChar, trangThaiKyGui)
      .input('maTaiXe', sql.Int, maTaiXe || null)
      .input('driverInfo', sql.NVarChar, driverInfo || null)
      .input('viTriHienTai', sql.NVarChar, viTriHienTai || null)
      .query(`
        UPDATE KyGuiHang
        SET trangThaiKyGui = @trangThaiKyGui,
            maTaiXe = ISNULL(@maTaiXe, maTaiXe),
            driverInfo = ISNULL(@driverInfo, driverInfo),
            viTriHienTai = ISNULL(@viTriHienTai, viTriHienTai),
            ngayCapNhat = GETDATE()
        WHERE consignmentId = @consignmentId
      `);

    res.json({ message: 'Cập nhật trạng thái vận chuyển thành công!' });
  } catch (error) {
    console.error('Lỗi cập nhật trạng thái:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Xử lý thanh toán cho vận đơn và gửi Email Hợp đồng
// @route   POST /api/cargo/consignment/:id/pay
// @access  Public
const processConsignmentPayment = async (req, res) => {
  const { id } = req.params;
  const { paymentMethod } = req.body; // momo or visa

  try {
    const pool = await sql.connect();
    const checkResult = await pool.request()
      .input('consignmentId', sql.VarChar, id)
      .query('SELECT * FROM KyGuiHang WHERE consignmentId = @consignmentId');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy vận đơn thanh toán' });
    }

    const consignment = checkResult.recordset[0];

    // Update payment status
    await pool.request()
      .input('consignmentId', sql.VarChar, id)
      .query(`
        UPDATE KyGuiHang
        SET trangThaiThanhToan = 'paid',
            ngayCapNhat = GETDATE()
        WHERE consignmentId = @consignmentId
      `);

    // Fetch updated model to send accurate email
    const updatedResult = await pool.request()
      .input('consignmentId', sql.VarChar, id)
      .query('SELECT * FROM KyGuiHang WHERE consignmentId = @consignmentId');
    
    const updatedConsignment = updatedResult.recordset[0];

    // Trigger email send
    await sendCargoContractEmail(updatedConsignment);

    res.json({
      message: 'Thanh toán thành công & Hợp đồng đã được gửi qua email!',
      consignment: updatedConsignment
    });

  } catch (error) {
    console.error('Lỗi xử lý thanh toán cargo:', error);
    res.status(500).json({ message: 'Lỗi server khi thanh toán đơn' });
  }
};

// @desc    Lấy danh sách vận đơn ký gửi của tài xế đang đăng nhập
// @route   GET /api/cargo/driver/consignments
// @access  Private (Driver)
const getDriverConsignments = async (req, res) => {
  const driverId = req.user.id;
  try {
    const pool = await sql.connect();
    // Query cargo items assigned to this driver (by maTaiXe OR maChuyenXe matching trip's driver)
    const result = await pool.request()
      .input('driverId', sql.Int, driverId)
      .query(`
        SELECT 
          kg.*,
          nd.tenNguoiDung AS tenKhachHang,
          cx.thoiGianDi,
          td.diemDi,
          td.diemDen
        FROM KyGuiHang kg
        LEFT JOIN ChuyenXe cx ON kg.maChuyenXe = cx.maChuyenXe
        LEFT JOIN TuyenDuong td ON cx.maTuyenDuong = td.maTuyenDuong
        LEFT JOIN NguoiDung nd ON kg.maKhachHang = nd.maNguoiDung
        WHERE kg.maTaiXe = @driverId
           OR (kg.maChuyenXe IS NOT NULL AND kg.maChuyenXe IN (SELECT maChuyenXe FROM ChuyenXe WHERE maNhanVien = @driverId))
        ORDER BY kg.ngayCapNhat DESC
      `);
    
    const records = result.recordset.map(r => {
      try {
        r.hinhAnh = JSON.parse(r.hinhAnh || '[]');
      } catch (e) {
        r.hinhAnh = [];
      }
      return r;
    });

    res.json(records);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách vận đơn của tài xế:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách của tài xế' });
  }
};

// @desc    Lấy tất cả danh sách vận đơn ký gửi (dành cho Support Staff / Điều hành)
// @route   GET /api/cargo/staff/consignments
// @access  Private (Staff)
const getStaffConsignments = async (req, res) => {
  try {
    const pool = await sql.connect();
    const result = await pool.request()
      .query(`
        SELECT 
          kg.*,
          nd.tenNguoiDung AS tenKhachHang
        FROM KyGuiHang kg
        LEFT JOIN NguoiDung nd ON kg.maKhachHang = nd.maNguoiDung
        ORDER BY kg.ngayCapNhat DESC
      `);

    const records = result.recordset.map(r => {
      try {
        r.hinhAnh = JSON.parse(r.hinhAnh || '[]');
      } catch (e) {
        r.hinhAnh = [];
      }
      return r;
    });

    res.json(records);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách vận đơn toàn hệ thống:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách toàn hệ thống' });
  }
};

// @desc    Lấy danh sách các tài xế để gán xe tải (dành cho Support Staff / Điều hành)
// @route   GET /api/cargo/staff/drivers
// @access  Private (Staff)
const getStaffDrivers = async (req, res) => {
  try {
    const pool = await sql.connect();
    const result = await pool.request()
      .query(`
        SELECT 
          nd.maNguoiDung,
          nd.tenNguoiDung,
          nd.soDienThoai,
          nd.email,
          nv.vaiTro,
          nv.lichLamViec,
          pt.maPhuongTien,
          pt.bienSoXe,
          pt.loaiXe,
          pt.phanLoaiXe,
          pt.trangThaiXe
        FROM NguoiDung nd
        INNER JOIN NhanVien nv ON nd.maNguoiDung = nv.maNhanVien
        LEFT JOIN PhuongTien pt ON pt.maTaiXeChinh = nv.maNhanVien
        WHERE UPPER(nv.vaiTro) = 'DRIVER'
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách tài xế:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách tài xế' });
  }
};

// @desc    Lấy danh sách xe tải còn trống (dành cho Support Staff chọn gán)
// @route   GET /api/cargo/staff/vehicles
// @access  Private (Staff)
const getAvailableVehicles = async (req, res) => {
  try {
    const pool = await sql.connect();
    const result = await pool.request()
      .query(`
        SELECT 
          pt.maPhuongTien,
          pt.bienSoXe,
          pt.nhanHieu,
          pt.loaiXe,
          pt.phanLoaiXe,
          pt.trangThaiXe,
          pt.tongSoGhe,
          nd.tenNguoiDung AS tenTaiXe,
          nd.soDienThoai AS sdtTaiXe
        FROM PhuongTien pt
        LEFT JOIN NguoiDung nd ON pt.maTaiXeChinh = nd.maNguoiDung
        WHERE pt.phanLoaiXe = 'xe_tai'
          AND pt.trangThaiXe = 'san_sang'
        ORDER BY pt.loaiXe
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách xe tải:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách xe tải' });
  }
};

// @desc    Khách hàng hủy đơn ký gửi
// @route   PUT /api/cargo/consignment/:id/cancel
// @access  Private (Customer)
const cancelConsignment = async (req, res) => {
  const { id } = req.params;
  const { lyDoHuy } = req.body;
  const userId = req.user.id;

  try {
    const pool = await sql.connect();
    const check = await pool.request()
      .input('consignmentId', sql.VarChar, id)
      .input('maKhachHang', sql.Int, userId)
      .query('SELECT * FROM KyGuiHang WHERE consignmentId = @consignmentId AND maKhachHang = @maKhachHang');

    if (check.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đơn ký gửi hoặc không có quyền hủy' });
    }

    const order = check.recordset[0];
    const isPaid = order.trangThaiThanhToan === 'paid';

    if (isPaid) {
      // Đã thanh toán → tạo yêu cầu hủy, chờ NV duyệt
      await pool.request()
        .input('consignmentId', sql.VarChar, id)
        .input('lyDoHuy', sql.NVarChar, lyDoHuy || 'Khách hàng yêu cầu hủy')
        .query(`
          UPDATE KyGuiHang
          SET yeuCauHuy = 'pending',
              lyDoHuy = @lyDoHuy,
              ngayCapNhat = GETDATE()
          WHERE consignmentId = @consignmentId
        `);

      res.json({
        message: 'Đã gửi yêu cầu hủy. Vui lòng chờ nhân viên hỗ trợ xem xét và xác nhận.',
        requireApproval: true
      });
    } else {
      // Chưa thanh toán → hủy ngay lập tức
      await pool.request()
        .input('consignmentId', sql.VarChar, id)
        .input('lyDoHuy', sql.NVarChar, lyDoHuy || 'Khách hàng hủy')
        .query(`
          UPDATE KyGuiHang
          SET trangThaiKyGui = 'failed',
              lyDoHuy = @lyDoHuy,
              ngayCapNhat = GETDATE()
          WHERE consignmentId = @consignmentId
        `);

      res.json({
        message: 'Đã hủy đơn ký gửi thành công.',
        requireApproval: false
      });
    }
  } catch (error) {
    console.error('Lỗi hủy đơn ký gửi:', error);
    res.status(500).json({ message: 'Lỗi server khi hủy đơn' });
  }
};

// @desc    Nhân viên hỗ trợ duyệt/từ chối yêu cầu hủy sau thanh toán
// @route   PUT /api/cargo/consignment/:id/approve-cancel
// @access  Private (Staff)
const approveCancel = async (req, res) => {
  const { id } = req.params;
  const { approved, ghiChu } = req.body;

  try {
    const pool = await sql.connect();
    const check = await pool.request()
      .input('consignmentId', sql.VarChar, id)
      .query(`SELECT * FROM KyGuiHang WHERE consignmentId = @consignmentId AND yeuCauHuy = 'pending'`);

    if (check.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu hủy đang chờ duyệt' });
    }

    if (approved) {
      // Duyệt hủy
      await pool.request()
        .input('consignmentId', sql.VarChar, id)
        .query(`
          UPDATE KyGuiHang
          SET trangThaiKyGui = 'failed',
              yeuCauHuy = 'approved',
              ngayCapNhat = GETDATE()
          WHERE consignmentId = @consignmentId
        `);
      res.json({ message: 'Đã duyệt hủy đơn. Tài xế sẽ được thông báo.' });
    } else {
      // Từ chối hủy
      await pool.request()
        .input('consignmentId', sql.VarChar, id)
        .query(`
          UPDATE KyGuiHang
          SET yeuCauHuy = 'rejected',
              ngayCapNhat = GETDATE()
          WHERE consignmentId = @consignmentId
        `);
      res.json({ message: 'Đã từ chối yêu cầu hủy đơn.' });
    }
  } catch (error) {
    console.error('Lỗi duyệt hủy đơn:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = {
  createConsignment,
  getCustomerConsignments,
  getConsignmentById,
  updateConsignmentStatus,
  processConsignmentPayment,
  getDriverConsignments,
  getStaffConsignments,
  getStaffDrivers,
  getAvailableVehicles,
  cancelConsignment,
  approveCancel
};
