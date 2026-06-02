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

const mapCargoStatusToDb = (clientStatus) => {
  switch (clientStatus) {
    case 'PENDING': return 'pending';
    case 'SHIPPING': return 'in_transit';
    case 'DELIVERED': return 'delivered';
    case 'FAILED': return 'failed';
    default: return 'pending';
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

    const trips = tripsResult.recordset.map(row => ({
      id: row.maChuyenXe,
      from: row.diemDi,
      to: row.diemDen,
      departureTime: formatTime(row.thoiGianDi),
      arrivalTime: formatTime(row.thoiGianDen),
      licensePlate: row.bienSoXe,
      busType: row.loaiXe === '16-seater' ? 'Xe ghế ngồi 16 chỗ' : 'Xe giường nằm 35 chỗ',
      passengerCount: row.soLuongGheDat || 0,
      maxPassengers: row.tongSoGhe,
      status: mapStatusToClient(row.trangThaiChuyen),
      incidentDetails: row.ghiChu && row.ghiChu.startsWith('{') ? JSON.parse(row.ghiChu) : null
    }));

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
  const { status, incidentType, incidentDesc, incidentLoc } = req.body;

  try {
    const pool = await sql.connect();
    const dbStatus = mapStatusToDb(status === 'INCIDENT' ? 'DEPARTED' : status);
    
    let note = null;
    if (status === 'INCIDENT') {
      note = JSON.stringify({ type: incidentType, desc: incidentDesc, location: incidentLoc });
    }

    await pool.request()
      .input('tripId', sql.Int, tripId)
      .input('status', sql.NVarChar, dbStatus)
      .input('note', sql.NVarChar, note)
      .query(`
        UPDATE ChuyenXe
        SET trangThaiChuyen = @status,
            ghiChu = ISNULL(@note, ghiChu)
        WHERE maChuyenXe = @tripId
      `);

    res.json({ message: 'Cập nhật trạng thái chuyến xe thành công' });
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

// @desc    Lấy danh sách kiện hàng ký gửi theo chuyến xe (Tự động seeding nếu trống)
// @route   GET /api/driver/trips/:tripId/cargo
// @access  Private (Driver only)
const getTripCargo = async (req, res) => {
  const { tripId } = req.params;

  try {
    const pool = await sql.connect();

    // 1. Truy vấn kiện hàng
    const cargoResult = await pool.request()
      .input('tripId', sql.Int, tripId)
      .query(`
        SELECT h.*, v.maChuyenXe
        FROM HangHoa h
        INNER JOIN VeDienTu v ON h.maVe = v.maVe
        WHERE v.maChuyenXe = @tripId
      `);

    const cargoList = cargoResult.recordset.map(row => ({
      id: `BG-${row.maHangHoa}`,
      dbId: row.maHangHoa,
      tripId: row.maChuyenXe,
      type: row.loaiHangHoa,
      sender: row.tenNguoiGui,
      receiver: row.tenNguoiNhan,
      phone: row.soDienThoaiNguoiNhan,
      status: mapCargoStatusToClient(row.trangThaiVanChuyen)
    }));

    res.json(cargoList);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách hàng hóa:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// @desc    Cập nhật trạng thái kiện hàng
// @route   PUT /api/driver/cargo/:cargoId/status
// @access  Private (Driver only)
const updateCargoStatus = async (req, res) => {
  const { cargoId } = req.params;
  const { status } = req.body;

  try {
    const pool = await sql.connect();
    const dbStatus = mapCargoStatusToDb(status);

    await pool.request()
      .input('cargoId', sql.Int, cargoId)
      .input('status', sql.NVarChar, dbStatus)
      .query(`
        UPDATE HangHoa
        SET trangThaiVanChuyen = @status
        WHERE maHangHoa = @cargoId
      `);

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
  updateCargoStatus
};
