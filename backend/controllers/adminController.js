const { sql } = require('../config/db');
const bcrypt = require('bcryptjs');

// @desc    Lấy danh sách tất cả người dùng
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const pool = await sql.connect();
    // Lấy thông tin cơ bản người dùng (không lấy mật khẩu) kèm theo role
    const result = await pool.request().query(`
      SELECT 
        nd.maNguoiDung, nd.tenNguoiDung, nd.email, nd.soDienThoai, 
        nd.daXacThucEmail, nd.trangThaiTaiKhoan, nd.ngayTaoTaiKhoan, nd.ngayCapNhatCuoi,
        CASE
          WHEN a.maAdmin IS NOT NULL THEN 'ADMIN'
          WHEN nv.maNhanVien IS NOT NULL THEN nv.vaiTro
          ELSE 'CUSTOMER'
        END as role
      FROM NguoiDung nd
      LEFT JOIN Admin a ON nd.maNguoiDung = a.maAdmin
      LEFT JOIN NhanVien nv ON nd.maNguoiDung = nv.maNhanVien
      ORDER BY nd.ngayTaoTaiKhoan DESC
    `);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách người dùng:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách người dùng' });
  }
};

// @desc    Cập nhật trạng thái người dùng (Khóa/Mở khóa)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { trangThaiTaiKhoan } = req.body; // 'active', 'locked'

  if (!trangThaiTaiKhoan || !['active', 'locked'].includes(trangThaiTaiKhoan)) {
    return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
  }

  try {
    const pool = await sql.connect();
    
    // Không cho phép tự khóa tài khoản của chính mình
    if (parseInt(id) === req.user.id) {
       return res.status(400).json({ message: 'Không thể tự thay đổi trạng thái của chính mình' });
    }

    const result = await pool.request()
      .input('maNguoiDung', sql.Int, id)
      .input('trangThaiTaiKhoan', sql.VarChar, trangThaiTaiKhoan)
      .query(`
        UPDATE NguoiDung 
        SET trangThaiTaiKhoan = @trangThaiTaiKhoan,
            ngayCapNhatCuoi = GETDATE()
        WHERE maNguoiDung = @maNguoiDung
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    res.json({ message: 'Cập nhật trạng thái người dùng thành công' });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái người dùng:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái' });
  }
};

// @desc    Tạo tài khoản nhân sự (Driver, Ticket-Staff, Support-Staff)
// @route   POST /api/admin/staff
// @access  Private/Admin
const createStaff = async (req, res) => {
  const { fullName, email, phone, password, role, schedule } = req.body;

  if (!fullName || !email || !phone || !password || !role) {
    return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin' });
  }

  const validRoles = ['DRIVER', 'TICKET_STAFF', 'SUPPORT_STAFF'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Vai trò không hợp lệ' });
  }

  try {
    const pool = await sql.connect();

    // Check if email or phone exists
    const userExists = await pool.request()
      .input('email', sql.VarChar, email)
      .input('phone', sql.VarChar, phone)
      .query('SELECT * FROM NguoiDung WHERE email = @email OR soDienThoai = @phone');

    if (userExists.recordset.length > 0) {
      return res.status(400).json({ message: 'Email hoặc Số điện thoại đã tồn tại' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Insert NguoiDung
      const insertUserResult = await transaction.request()
        .input('tenNguoiDung', sql.NVarChar, fullName)
        .input('email', sql.VarChar, email)
        .input('soDienThoai', sql.VarChar, phone)
        .input('matKhau', sql.VarChar, hashedPassword)
        .query(`
          INSERT INTO NguoiDung (tenNguoiDung, email, soDienThoai, matKhau, daXacThucEmail, trangThaiTaiKhoan)
          OUTPUT INSERTED.maNguoiDung
          VALUES (@tenNguoiDung, @email, @soDienThoai, @matKhau, 1, 'active')
        `);

      const userId = insertUserResult.recordset[0].maNguoiDung;

      // 2. Insert NhanVien
      await transaction.request()
        .input('maNhanVien', sql.Int, userId)
        .input('vaiTro', sql.NVarChar, role)
        .input('lichLamViec', sql.NVarChar, schedule || 'Hành chính')
        .query(`
          INSERT INTO NhanVien (maNhanVien, vaiTro, lichLamViec)
          VALUES (@maNhanVien, @vaiTro, @lichLamViec)
        `);

      await transaction.commit();

      res.status(201).json({
        message: 'Tạo tài khoản nhân sự thành công',
        staff: {
          id: userId,
          name: fullName,
          email,
          phone,
          role,
          schedule: schedule || 'Hành chính'
        }
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Lỗi khi tạo nhân sự:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo nhân sự' });
  }
};

// @desc    Lấy danh sách tất cả sự cố
// @route   GET /api/admin/incidents
// @access  Private/Admin
const getIncidents = async (req, res) => {
  try {
    const pool = await sql.connect();
    const result = await pool.request().query(`
      SELECT 
        sc.*,
        nd.tenNguoiDung as tenTaiXe,
        nd.soDienThoai as soDienThoaiTaiXe,
        td.diemDi,
        td.diemDen,
        pt.bienSoXe,
        pt.loaiXe
      FROM SuCo sc
      INNER JOIN ChuyenXe cx ON sc.maChuyenXe = cx.maChuyenXe
      INNER JOIN TuyenDuong td ON cx.maTuyenDuong = td.maTuyenDuong
      INNER JOIN PhuongTien pt ON cx.maPhuongTien = pt.maPhuongTien
      INNER JOIN NguoiDung nd ON sc.maNhanVien = nd.maNguoiDung
      ORDER BY sc.thoiGianTao DESC
    `);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách sự cố:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách sự cố' });
  }
};

// @desc    Xử lý sự cố và cập nhật trạng thái chuyến đi nếu cần
// @route   PUT /api/admin/incidents/:id/resolve
// @access  Private/Admin
const resolveIncident = async (req, res) => {
  const { id } = req.params;
  const { trangThaiSuCo, ghiChuGiaiQuyet, tripStatus } = req.body;

  if (!trangThaiSuCo || !['cho_xu_ly', 'dang_xu_ly', 'da_xu_ly'].includes(trangThaiSuCo)) {
    return res.status(400).json({ message: 'Trạng thái sự cố không hợp lệ' });
  }

  try {
    const pool = await sql.connect();

    // 1. Cập nhật trạng thái trong bảng SuCo
    const incidentResult = await pool.request()
      .input('maSuCo', sql.Int, id)
      .input('trangThaiSuCo', sql.VarChar, trangThaiSuCo)
      .input('ghiChu', sql.NVarChar, ghiChuGiaiQuyet || '')
      .query(`
        UPDATE SuCo
        SET trangThaiSuCo = @trangThaiSuCo,
            ghiChu = @ghiChu,
            thoiGianCapNhat = GETDATE()
        OUTPUT INSERTED.maChuyenXe
        WHERE maSuCo = @maSuCo
      `);

    if (incidentResult.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sự cố' });
    }

    const tripId = incidentResult.recordset[0].maChuyenXe;

    // 2. Cập nhật trạng thái chuyến xe
    // Nếu sự cố đã xử lý (da_xu_ly) mà không có tripStatus rõ ràng → mặc định reset về dang_khoi_hanh
    const effectiveTripStatus = tripStatus || (trangThaiSuCo === 'da_xu_ly' ? 'DEPARTED' : null);
    if (effectiveTripStatus) {
      let dbStatus = 'dang_khoi_hanh';
      if (effectiveTripStatus === 'DEPARTED') dbStatus = 'dang_khoi_hanh';
      else if (effectiveTripStatus === 'COMPLETED') dbStatus = 'da_hoan_thanh';
      else if (effectiveTripStatus === 'SCHEDULED') dbStatus = 'da_len_lich';
      else if (effectiveTripStatus === 'CANCELLED') dbStatus = 'da_huy';
      else if (effectiveTripStatus === 'INCIDENT') dbStatus = 'co_su_co';

      await pool.request()
        .input('tripId', sql.Int, tripId)
        .input('status', sql.NVarChar, dbStatus)
        .query(`
          UPDATE ChuyenXe
          SET trangThaiChuyen = @status
          WHERE maChuyenXe = @tripId
        `);

      // Ghi nhật ký hành trình về việc admin xử lý
      await pool.request()
        .input('tripId', sql.Int, tripId)
        .input('kieuCapNhat', sql.NVarChar, 'CHECKPOINT')
        .input('viTri', sql.NVarChar, 'Trung tâm điều hành (Admin)')
        .input('soKm', sql.Int, 0)
        .input('tinhTrangXe', sql.NVarChar, 'Đã xử lý sự cố')
        .input('anhMinhChung', sql.NVarChar, '')
        .input('anhXeSauChuyen', sql.NVarChar, '')
        .input('ghiChu', sql.NVarChar, `Admin xử lý sự cố: ${ghiChuGiaiQuyet || 'Đã giải quyết'}`)
        .query(`
          INSERT INTO NhatKyHanhTrinh (maChuyenXe, kieuCapNhat, viTri, soKm, tinhTrangXe, anhMinhChung, anhXeSauChuyen, ghiChu, thoiGian)
          VALUES (@tripId, @kieuCapNhat, @viTri, @soKm, @tinhTrangXe, @anhMinhChung, @anhXeSauChuyen, @ghiChu, GETDATE())
        `);
    }

    // 3. Gửi thông báo đến Tài xế & Hành khách
    try {
      const tripInfoResult = await pool.request()
        .input('tripId', sql.Int, tripId)
        .query(`
          SELECT cx.maNhanVien, td.diemDi, td.diemDen, cx.thoiGianDi
          FROM ChuyenXe cx
          INNER JOIN TuyenDuong td ON cx.maTuyenDuong = td.maTuyenDuong
          WHERE cx.maChuyenXe = @tripId
        `);
      const tripInfo = tripInfoResult.recordset[0];

      if (tripInfo) {
        const driverId = tripInfo.maNhanVien;
        const routeStr = `${tripInfo.diemDi} → ${tripInfo.diemDen}`;
        const timeStr = new Date(tripInfo.thoiGianDi).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const resolutionText = ghiChuGiaiQuyet || 'Đã ghi nhận và giải quyết.';

        // Gửi thông báo cho tài xế (DRIVER)
        if (driverId) {
          let driverMsg = `Sự cố trên chuyến xe của bạn đã được Ban quản lý xử lý: ${resolutionText}`;
          if (effectiveTripStatus === 'CANCELLED') {
            driverMsg = `Chuyến xe ${routeStr} của bạn đã bị HỦY bởi Ban quản lý. Lý do: ${resolutionText}`;
          } else if (effectiveTripStatus === 'DEPARTED') {
            driverMsg = `Sự cố trên chuyến xe ${routeStr} đã được giải quyết. Vui lòng tiếp tục di chuyển. Ghi chú: ${resolutionText}`;
          } else if (effectiveTripStatus === 'COMPLETED') {
            driverMsg = `Ban quản lý đã xác nhận HOÀN THÀNH chuyến xe ${routeStr}. Ghi chú: ${resolutionText}`;
          }

          await pool.request()
            .input('driverId', sql.Int, driverId)
            .input('tieuDe', sql.NVarChar, 'Cập nhật xử lý sự cố')
            .input('noiDung', sql.NVarChar, driverMsg)
            .input('maSuCo', sql.Int, id)
            .query(`
              INSERT INTO ThongBao (maNguoiDung, doiTuong, tieuDe, noiDung, loaiThongBao, maLienKet)
              VALUES (@driverId, 'DRIVER', @tieuDe, @noiDung, 'incident_resolution', @maSuCo)
            `);
        }

        // Gửi thông báo cho toàn bộ hành khách trên chuyến xe (CUSTOMER)
        let passengerMsg = `Thông báo hành trình chuyến ${routeStr} (${timeStr}): ${resolutionText}`;
        if (effectiveTripStatus === 'CANCELLED') {
          passengerMsg = `Thông báo khẩn: Chuyến xe ${routeStr} khởi hành lúc ${timeStr} đã bị HỦY. Lý do: ${resolutionText}. Vui lòng liên hệ quầy vé hoặc hotline BusGo để được hỗ trợ hoàn tiền hoặc chuyển đổi vé/hành lý ký gửi. Xin lỗi quý khách vì sự bất tiện này.`;
        } else if (effectiveTripStatus === 'DEPARTED') {
          passengerMsg = `Thông báo hành trình chuyến ${routeStr} (${timeStr}): Sự cố vận hành đã được khắc phục, chuyến xe tiếp tục di chuyển. Chi tiết: ${resolutionText}`;
        }

        const passengersResult = await pool.request()
          .input('tripId', sql.Int, tripId)
          .query(`
            SELECT DISTINCT maKhachHang 
            FROM VeDienTu 
            WHERE maChuyenXe = @tripId 
            AND trangThaiVe IN ('PAID', 'USED', 'da_thanh_toan', 'da_su_dung')
          `);
        const passengers = passengersResult.recordset;

        for (const passenger of passengers) {
          await pool.request()
            .input('passengerId', sql.Int, passenger.maKhachHang)
            .input('tieuDe', sql.NVarChar, 'Cập nhật hành trình')
            .input('noiDung', sql.NVarChar, passengerMsg)
            .input('tripId', sql.Int, tripId)
            .query(`
              INSERT INTO ThongBao (maNguoiDung, doiTuong, tieuDe, noiDung, loaiThongBao, maLienKet)
              VALUES (@passengerId, 'CUSTOMER', @tieuDe, @noiDung, 'trip_alert', @tripId)
            `);
        }
      }
    } catch (err) {
      console.error('Lỗi khi gửi thông báo xử lý sự cố:', err);
    }

    res.json({ message: 'Xử lý sự cố thành công' });
  } catch (error) {
    console.error('Lỗi khi xử lý sự cố:', error);
    res.status(500).json({ message: 'Lỗi server khi xử lý sự cố' });
  }
};

// @desc    Lấy danh sách thông báo của Admin
// @route   GET /api/admin/notifications
// @access  Private/Admin
const getAdminNotifications = async (req, res) => {
  try {
    const pool = await sql.connect();
    const result = await pool.request().query(`
      SELECT * FROM ThongBao
      WHERE doiTuong = 'ADMIN'
      ORDER BY thoiGianTao DESC
    `);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Lỗi khi lấy thông báo Admin:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy thông báo' });
  }
};

// @desc    Đánh dấu tất cả thông báo của Admin là đã đọc
// @route   PUT /api/admin/notifications/mark-read
// @access  Private/Admin
const markAdminNotificationsAsRead = async (req, res) => {
  try {
    const pool = await sql.connect();
    await pool.request().query(`
      UPDATE ThongBao
      SET daDoc = 1
      WHERE doiTuong = 'ADMIN' AND daDoc = 0
    `);
    
    res.json({ message: 'Đã đánh dấu đọc tất cả thông báo' });
  } catch (error) {
    console.error('Lỗi khi cập nhật thông báo Admin:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật thông báo' });
  }
};

module.exports = {
  getAllUsers,
  updateUserStatus,
  createStaff,
  getIncidents,
  resolveIncident,
  getAdminNotifications,
  markAdminNotificationsAsRead
};
