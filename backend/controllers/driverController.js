const { sql } = require('../config/db');

// Helper function to format Time to HH:mm
const formatTime = (dateObj) => {
  if (!dateObj) return '';
  const d = new Date(dateObj);
  let hours = '' + d.getUTCHours();
  let minutes = '' + d.getUTCMinutes();
  if (hours.length < 2) hours = '0' + hours;
  if (minutes.length < 2) minutes = '0' + minutes;
  return [hours, minutes].join(':');
};

// Status mappings: Client <-> Database
const mapStatusToClient = (dbStatus) => {
  switch (dbStatus) {
    case 'da_len_lich': return 'SCHEDULED';
    case 'dang_khoi_hanh': return 'DEPARTED';
    case 'da_hoan_thanh': return 'COMPLETED';
    case 'da_huy': return 'CANCELLED';
    default: return 'SCHEDULED';
  }
};

const mapStatusToDb = (clientStatus) => {
  switch (clientStatus) {
    case 'SCHEDULED': return 'da_len_lich';
    case 'DEPARTED': return 'dang_khoi_hanh';
    case 'COMPLETED': return 'da_hoan_thanh';
    case 'CANCELLED': return 'da_huy';
    default: return 'da_len_lich';
  }
};

const mapTicketStatusToClient = (dbStatus) => {
  switch (dbStatus) {
    case 'da_thanh_toan': return 'PAID';
    case 'da_su_dung': return 'USED';
    case 'da_huy': return 'CANCELLED';
    default: return 'PAID';
  }
};

const mapCargoStatusToClient = (dbStatus) => {
  switch (dbStatus?.toLowerCase()) {
    case 'pending': return 'PENDING';
    case 'in_transit': return 'SHIPPING';
    case 'delivered': return 'DELIVERED';
    case 'failed': return 'FAILED';
    default: return 'PENDING';
  }
};

const mapKyGuiStatusToClient = (dbStatus) => {
  switch (dbStatus) {
    case 'dang_cho_xac_nhan': return 'PENDING';
    case 'da_xac_nhan': return 'APPROVED';
    case 'in_transit': return 'SHIPPING';
    case 'delivered': return 'DELIVERED';
    case 'da_huy': return 'CANCELLED';
    default: return 'PENDING';
  }
};

const mapCargoStatusToDb = (clientStatus) => {
  switch (clientStatus) {
    case 'PENDING': return 'pending';
    case 'SHIPPING': return 'in_transit';
    case 'DELIVERED': return 'delivered';
    case 'FAILED': return 'failed';
    default: return 'pending';
  }
};

const mapKyGuiStatusToDb = (clientStatus) => {
  switch (clientStatus) {
    case 'PENDING': return 'dang_cho_xac_nhan';
    case 'APPROVED': return 'da_xac_nhan';
    case 'SHIPPING': return 'in_transit';
    case 'DELIVERED': return 'delivered';
    case 'CANCELLED': return 'da_huy';
    default: return 'dang_cho_xac_nhan';
  }
};

// @desc    Lấy danh sách chuyến xe của tài xế hiện tại
// @route   GET /api/driver/my-trips
// @access  Private (Driver only)
const getDriverTrips = async (req, res) => {
  const driverId = req.user.id;

  try {
    const pool = await sql.connect();

    // Lấy toàn bộ chuyến xe được gán cho tài xế này
    const tripsResult = await pool.request()
      .input('driverId', sql.Int, driverId)
      .query(`
        SELECT cx.*, td.diemDi, td.diemDen, pt.bienSoXe, pt.loaiXe, pt.tongSoGhe
        FROM ChuyenXe cx
        INNER JOIN TuyenDuong td ON cx.maTuyenDuong = td.maTuyenDuong
        INNER JOIN PhuongTien pt ON cx.maPhuongTien = pt.maPhuongTien
        WHERE cx.maNhanVien = @driverId
        ORDER BY cx.thoiGianDi ASC
      `);

    // Lấy toàn bộ nhật ký hành trình của các chuyến xe thuộc tài xế này
    const logsResult = await pool.request()
      .input('driverId', sql.Int, driverId)
      .query(`
        SELECT * FROM NhatKyHanhTrinh
        WHERE maChuyenXe IN (SELECT maChuyenXe FROM ChuyenXe WHERE maNhanVien = @driverId)
        ORDER BY thoiGian ASC
      `);

    // Nhóm nhật ký hành trình theo maChuyenXe
    const logsByTrip = {};
    logsResult.recordset.forEach(log => {
      const tripId = log.maChuyenXe;
      if (!logsByTrip[tripId]) {
        logsByTrip[tripId] = [];
      }
      logsByTrip[tripId].push({
        id: log.maNhatKy,
        type: log.kieuCapNhat,
        time: log.thoiGian,
        location: log.viTri,
        km: log.soKm,
        vehicleStatus: log.tinhTrangXe,
        proofImage: log.anhMinhChung,
        vehiclePhoto: log.anhXeSauChuyen || null,
        notes: log.ghiChu
      });
    });

    const trips = tripsResult.recordset.map(row => {
      const tripLogs = logsByTrip[row.maChuyenXe] || [];
      // Tạo incidentDetails động từ NhatKyHanhTrinh cho FE hiển thị
      const latestIncident = [...tripLogs].reverse().find(log => log.type === 'INCIDENT');
      let incidentDetails = null;
      if (latestIncident && latestIncident.notes && latestIncident.notes.startsWith('{')) {
        try {
          incidentDetails = JSON.parse(latestIncident.notes);
        } catch (e) {}
      }

      return {
        id: row.maChuyenXe,
        date: new Date(row.thoiGianDi).toLocaleDateString('vi-VN'),
        from: row.diemDi,
        to: row.diemDen,
        departureTime: formatTime(row.thoiGianDi),
        arrivalTime: formatTime(row.thoiGianDen),
        licensePlate: row.bienSoXe,
        busType: row.loaiXe === '16-seater' ? 'Xe ghế ngồi 16 chỗ' : 'Xe giường nằm 35 chỗ',
        passengerCount: row.soLuongGheDat || 0,
        maxPassengers: row.tongSoGhe,
        status: mapStatusToClient(row.trangThaiChuyen),
        incidentDetails: incidentDetails,
        journeyLogs: tripLogs
      };
    });

    res.json(trips);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách chuyến xe tài xế:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// @desc    Cập nhật trạng thái chuyến xe
// @route   PUT /api/driver/trips/:tripId/status
// @access  Private (Driver only)
const updateTripStatus = async (req, res) => {
  const { tripId } = req.params;
  const { 
    status, 
    updateType,
    incidentType, 
    incidentDesc, 
    incidentLoc, 
    startLocation, 
    startKm, 
    vehicleStatus, 
    proofImage, 
    notes,
    viTri,
    soKm,
    tinhTrangXe,
    anhMinhChung,
    anhXeSauChuyen,
    ghiChu
  } = req.body;

  try {
    const pool = await sql.connect();

    // Xác định kiểu cập nhật nhật ký hành trình
    let kieuCapNhat = updateType;
    if (!kieuCapNhat) {
      if (status === 'DEPARTED') kieuCapNhat = 'START';
      else if (status === 'COMPLETED') kieuCapNhat = 'END';
      else if (status === 'INCIDENT') kieuCapNhat = 'INCIDENT';
      else kieuCapNhat = 'CHECKPOINT';
    }

    // Xử lý các giá trị đầu vào có dự phòng (fallbacks)
    const finalViTri = viTri || startLocation || incidentLoc || 'Chưa xác định';
    const finalSoKm = Number(soKm !== undefined ? soKm : (startKm !== undefined ? startKm : 0));
    const finalTinhTrang = tinhTrangXe || vehicleStatus || 'Bình thường';
    const finalAnh = anhMinhChung || proofImage || '';
    
    let finalGhiChu = ghiChu || notes || '';
    if (kieuCapNhat === 'INCIDENT' && incidentType) {
      finalGhiChu = JSON.stringify({ type: incidentType, desc: incidentDesc || finalGhiChu, location: incidentLoc || finalViTri });
    }

    // 1. Thêm dòng nhật ký mới vào bảng NhatKyHanhTrinh
    const finalAnhXe = anhXeSauChuyen || '';
    await pool.request()
      .input('tripId', sql.Int, parseInt(tripId, 10))
      .input('kieuCapNhat', sql.NVarChar, kieuCapNhat)
      .input('viTri', sql.NVarChar, finalViTri)
      .input('soKm', sql.Int, finalSoKm)
      .input('tinhTrangXe', sql.NVarChar, finalTinhTrang)
      .input('anhMinhChung', sql.NVarChar, finalAnh)
      .input('anhXeSauChuyen', sql.NVarChar, finalAnhXe)
      .input('ghiChu', sql.NVarChar, finalGhiChu)
      .query(`
        INSERT INTO NhatKyHanhTrinh (maChuyenXe, kieuCapNhat, viTri, soKm, tinhTrangXe, anhMinhChung, anhXeSauChuyen, ghiChu, thoiGian)
        VALUES (@tripId, @kieuCapNhat, @viTri, @soKm, @tinhTrangXe, @anhMinhChung, @anhXeSauChuyen, @ghiChu, GETDATE())
      `);

    // 2. Xác định trạng thái của chuyến xe tương ứng
    let dbStatus;
    if (kieuCapNhat === 'START') {
      dbStatus = 'dang_khoi_hanh'; // DEPARTED
    } else if (kieuCapNhat === 'END') {
      dbStatus = 'da_hoan_thanh'; // COMPLETED
    } else {
      dbStatus = 'dang_khoi_hanh'; // CHECKPOINT và INCIDENT vẫn giữ dang_khoi_hanh
    }

    // 3. Cập nhật trạng thái mới nhất trên bảng ChuyenXe (Không cập nhật cột ghiChu vì không tồn tại trong DB của bạn!)
    await pool.request()
      .input('tripId', sql.Int, parseInt(tripId, 10))
      .input('status', sql.NVarChar, dbStatus)
      .query(`
        UPDATE ChuyenXe
        SET trangThaiChuyen = @status
        WHERE maChuyenXe = @tripId
      `);

    res.json({ message: 'Cập nhật hành trình chuyến xe thành công' });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái chuyến xe:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// @desc    Lấy danh sách hành khách theo chuyến xe (Tự động seeding nếu trống)
// @route   GET /api/driver/trips/:tripId/passengers
// @access  Private (Driver only)
const getTripPassengers = async (req, res) => {
  const { tripId } = req.params;

  try {
    const pool = await sql.connect();

    // 1. Truy vấn danh sách hành khách đi xe
    const passengersResult = await pool.request()
      .input('tripId', sql.Int, tripId)
      .query(`
        SELECT v.*, g.soGhe
        FROM VeDienTu v
        INNER JOIN GheNgoi g ON v.maGhe = g.maGhe
        WHERE v.maChuyenXe = @tripId
      `);

    const passengersList = passengersResult.recordset.map(row => ({
      id: row.maVe,
      tripId: row.maChuyenXe,
      seat: row.soGhe,
      name: row.hoTenHanhKhach,
      phone: row.soDienThoaiHanhKhach,
      pickup: row.diemDon,
      dropoff: row.diemTra,
      status: mapTicketStatusToClient(row.trangThaiVe)
    }));

    res.json(passengersList);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách hành khách:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// @desc    Soát vé / Check-in hành khách lên xe
// @route   PUT /api/driver/passengers/:ticketId/check-in
// @access  Private (Driver only)
const checkInPassenger = async (req, res) => {
  const { ticketId } = req.params;

  try {
    const pool = await sql.connect();
    await pool.request()
      .input('ticketId', sql.Int, ticketId)
      .query(`
        UPDATE VeDienTu
        SET trangThaiVe = 'da_su_dung', ngayCapNhat = GETDATE()
        WHERE maVe = @ticketId
      `);

    res.json({ message: 'Soát vé hành khách thành công' });
  } catch (error) {
    console.error('Lỗi khi soát vé hành khách:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// @desc    Lấy danh sách kiện hàng ký gửi theo chuyến xe (bao gồm Hành lý xách tay + Hàng gửi kèm)
// @route   GET /api/driver/trips/:tripId/cargo
// @access  Private (Driver only)
const getTripCargo = async (req, res) => {
  const { tripId } = req.params;

  try {
    const pool = await sql.connect();

    // 1. Truy vấn hành lý xách tay (HangHoa)
    const carryOnResult = await pool.request()
      .input('tripId', sql.Int, tripId)
      .query(`
        SELECT h.*, v.maChuyenXe
        FROM HangHoa h
        INNER JOIN VeDienTu v ON h.maVe = v.maVe
        WHERE v.maChuyenXe = @tripId
      `);

    const carryOnList = carryOnResult.recordset.map(row => ({
      id: `HH-${row.maHangHoa}`,
      dbId: row.maHangHoa,
      tripId: row.maChuyenXe,
      type: row.loaiHangHoa,
      sender: row.tenNguoiGui,
      receiver: row.tenNguoiNhan,
      phone: row.soDienThoaiNguoiNhan,
      status: mapCargoStatusToClient(row.trangThaiVanChuyen),
      isConsignment: false,
      quantity: 1,
      weight: row.trongLuong,
      totalPrice: row.giaHangHoa,
      senderPhone: row.soDienThoaiNguoiGui,
      senderAddress: null,
      receiverAddress: null,
      images: []
    }));

    // 2. Truy vấn đơn ký gửi độc lập (KyGuiHang - Gửi Kèm Xe Khách)
    const consignmentResult = await pool.request()
      .input('tripId', sql.Int, tripId)
      .query(`
        SELECT *
        FROM KyGuiHang
        WHERE maChuyenXe = @tripId AND loaiDichVu = 'gui_kem'
      `);

    const consignmentList = consignmentResult.recordset.map(row => ({
      id: `CSM-${row.consignmentId}`,
      dbId: row.consignmentId,
      tripId: row.maChuyenXe,
      type: row.loaiHangHoa,
      sender: row.tenNguoiGui,
      receiver: row.tenNguoiNhan,
      phone: row.soDienThoaiNguoiNhan,
      status: mapKyGuiStatusToClient(row.trangThaiKyGui),
      isConsignment: true,
      paymentStatus: row.trangThaiThanhToan,
      quantity: row.soLuong,
      weight: row.trongLuong,
      totalPrice: row.tongTien,
      senderPhone: row.soDienThoaiNguoiGui,
      senderAddress: row.diaChiGuiChiTiet || row.diemGui,
      receiverAddress: row.diaChiNhanChiTiet || row.diemNhan,
      images: row.hinhAnh ? row.hinhAnh.split(',') : []
    }));

    // Trả về danh sách gộp
    res.json([...carryOnList, ...consignmentList]);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách hàng hóa:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// @desc    Lấy danh sách hàng hóa nguyên chuyến (Dành riêng cho Truck Driver)
// @route   GET /api/driver/truck-cargo
// @access  Private (Driver only)
const getTruckCargo = async (req, res) => {
  const driverId = req.user.id; // maNhanVien

  try {
    const pool = await sql.connect();
    
    // Chỉ lấy đơn hàng thuộc loại dịch vụ 'van_tai' được gán cho tài xế này
    const result = await pool.request()
      .input('driverId', sql.Int, driverId)
      .query(`
        SELECT *
        FROM KyGuiHang
        WHERE maTaiXe = @driverId AND loaiDichVu = 'van_tai'
      `);

    const cargoList = result.recordset.map(row => ({
      id: `CSM-${row.consignmentId}`,
      dbId: row.consignmentId,
      tripId: null, // Không gắn với chuyến xe cố định
      type: row.loaiHangHoa,
      sender: row.tenNguoiGui,
      receiver: row.tenNguoiNhan,
      phone: row.soDienThoaiNguoiNhan,
      status: mapKyGuiStatusToClient(row.trangThaiKyGui),
      isConsignment: true,
      paymentStatus: row.trangThaiThanhToan,
      from: row.diemGui,
      to: row.diemNhan,
      pickupLocation: row.diaChiGuiChiTiet,
      deliveryLocation: row.diaChiNhanChiTiet,
      date: row.ngayGui,
      quantity: row.soLuong,
      weight: row.trongLuong,
      totalPrice: row.tongTien,
      senderPhone: row.soDienThoaiNguoiGui,
      senderAddress: row.diaChiGuiChiTiet || row.diemGui,
      receiverAddress: row.diaChiNhanChiTiet || row.diemNhan,
      images: row.hinhAnh ? row.hinhAnh.split(',') : []
    }));

    res.json(cargoList);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách vận tải nguyên chuyến:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// @desc    Cập nhật trạng thái kiện hàng
// @route   PUT /api/driver/cargo/:cargoId/status
// @access  Private (Driver only)
const updateCargoStatus = async (req, res) => {
  const { cargoId } = req.params;
  const { status } = req.body; // PENDING, APPROVED, SHIPPING, DELIVERED, CANCELLED, FAILED

  try {
    const pool = await sql.connect();

    if (cargoId.startsWith('CSM-')) {
      const dbId = cargoId.replace('CSM-', '');
      const dbStatus = mapKyGuiStatusToDb(status);
      
      let hinhAnhStr = undefined;
      
      // If imageUrl is provided, we fetch the current images, append, and save
      if (req.body.imageUrl) {
        const checkRes = await pool.request()
          .input('consignmentId', sql.VarChar, dbId)
          .query('SELECT hinhAnh FROM KyGuiHang WHERE consignmentId = @consignmentId');
          
        if (checkRes.recordset.length > 0) {
          let hinhAnhArr = [];
          try {
            hinhAnhArr = JSON.parse(checkRes.recordset[0].hinhAnh || '[]');
          } catch (e) {
            hinhAnhArr = [];
          }
          hinhAnhArr.push(req.body.imageUrl);
          hinhAnhStr = JSON.stringify(hinhAnhArr);
        }
      }

      if (hinhAnhStr !== undefined) {
        await pool.request()
          .input('consignmentId', sql.VarChar, dbId)
          .input('status', sql.NVarChar, dbStatus)
          .input('hinhAnh', sql.NVarChar, hinhAnhStr)
          .query(`
            UPDATE KyGuiHang
            SET trangThaiKyGui = @status,
                hinhAnh = @hinhAnh,
                ngayCapNhat = GETDATE()
            WHERE consignmentId = @consignmentId
          `);
      } else {
        await pool.request()
          .input('consignmentId', sql.VarChar, dbId)
          .input('status', sql.NVarChar, dbStatus)
          .query(`
            UPDATE KyGuiHang
            SET trangThaiKyGui = @status,
                ngayCapNhat = GETDATE()
            WHERE consignmentId = @consignmentId
          `);
      }
    } else if (cargoId.startsWith('HH-')) {
      const dbId = parseInt(cargoId.replace('HH-', ''), 10);
      const dbStatus = mapCargoStatusToDb(status);
      await pool.request()
        .input('cargoId', sql.Int, dbId)
        .input('status', sql.NVarChar, dbStatus)
        .query(`
          UPDATE HangHoa
          SET trangThaiVanChuyen = @status
          WHERE maHangHoa = @cargoId
        `);
    } else {
      // Fallback cho logic cũ nếu lỡ lưu số id
      const dbId = parseInt(cargoId, 10);
      const dbStatus = mapCargoStatusToDb(status);
      await pool.request()
        .input('cargoId', sql.Int, dbId)
        .input('status', sql.NVarChar, dbStatus)
        .query(`
          UPDATE HangHoa
          SET trangThaiVanChuyen = @status
          WHERE maHangHoa = @cargoId
        `);
    }

    res.json({ message: 'Cập nhật trạng thái kiện hàng thành công' });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái kiện hàng:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

module.exports = {
  getDriverTrips,
  updateTripStatus,
  getTripPassengers,
  checkInPassenger,
  getTripCargo,
  getTruckCargo,
  updateCargoStatus
};
