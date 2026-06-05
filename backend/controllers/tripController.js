const { sql, getPool } = require('../config/db');

// Helper function to format duration
const calculateDuration = (startTime, endTime) => {
  const diffMs = new Date(endTime) - new Date(startTime);
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

// Helper function to format Date to YYYY-MM-DD (dùng UTC tránh lệch múi giờ)
const formatDate = (dateObj) => {
  const d = new Date(dateObj);
  let month = '' + (d.getUTCMonth() + 1);
  let day = '' + d.getUTCDate();
  const year = d.getUTCFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
};

// Helper function to format Time to HH:mm (dùng UTC tránh lệch múi giờ)
const formatTime = (dateObj) => {
  const d = new Date(dateObj);
  let hours = '' + d.getUTCHours();
  let minutes = '' + d.getUTCMinutes();

  if (hours.length < 2) hours = '0' + hours;
  if (minutes.length < 2) minutes = '0' + minutes;

  return [hours, minutes].join(':');
};

// Helper function to dynamically generate ChuyenXe for a given route and date if none exists
const ensureTripsExist = async (pool, diemDi, diemDen, dateStr) => {
  try {
    // Check if there are already trips for this route and date
    const countResult = await pool.request()
      .input('diemDi', sql.NVarChar, diemDi)
      .input('diemDen', sql.NVarChar, diemDen)
      .input('date', sql.Date, dateStr)
      .query(`
        SELECT COUNT(*) as count 
        FROM ChuyenXe cx
        INNER JOIN TuyenDuong td ON cx.maTuyenDuong = td.maTuyenDuong
        WHERE td.diemDi = @diemDi AND td.diemDen = @diemDen AND CAST(cx.thoiGianDi AS DATE) = @date
      `);
    
    if (countResult.recordset[0].count > 0) {
      return; // Trips already exist
    }

    // Find TuyenDuong
    const routeResult = await pool.request()
      .input('diemDi', sql.NVarChar, diemDi)
      .input('diemDen', sql.NVarChar, diemDen)
      .query('SELECT * FROM TuyenDuong WHERE diemDi = @diemDi AND diemDen = @diemDen');
    
    const route = routeResult.recordset[0];
    if (!route) {
      return; // Route doesn't exist, cannot create trips
    }

    // Find suitable PhuongTien
    const vehicleResult = await pool.request()
      .input('loaiDichVu', sql.NVarChar, route.loaiDichVu)
      .query(`
        SELECT TOP 1 maPhuongTien, tongSoGhe, loaiXe
        FROM PhuongTien 
        WHERE (loaiXe = '16-seater' AND @loaiDichVu = 'city')
           OR (loaiXe = '35-seater' AND @loaiDichVu = 'interCity')
        ORDER BY maPhuongTien ASC
      `);
    
    const vehicle = vehicleResult.recordset[0] || { maPhuongTien: 1, tongSoGhe: 16, loaiXe: '16-seater' };

    // Generate 2 trips: 08:00 and 14:00
    const tripTimes = [
      { dep: '08:00:00', arr: route.loaiDichVu === 'city' ? '08:45:00' : '17:30:00', price: route.loaiDichVu === 'city' ? 50000 : 250000 },
      { dep: '14:00:00', arr: route.loaiDichVu === 'city' ? '14:45:00' : '23:30:00', price: route.loaiDichVu === 'city' ? 60000 : 280000 }
    ];

    for (const time of tripTimes) {
      const thoiGianDi = `${dateStr} ${time.dep}`;
      const thoiGianDen = `${dateStr} ${time.arr}`;
      await pool.request()
        .input('maTuyenDuong', sql.Int, route.maTuyenDuong)
        .input('maPhuongTien', sql.Int, vehicle.maPhuongTien)
        .input('thoiGianDi', sql.DateTime, thoiGianDi)
        .input('thoiGianDen', sql.DateTime, thoiGianDen)
        .input('giaCoBan', sql.Decimal(18, 2), time.price)
        .input('soGheConTrong', sql.Int, vehicle.tongSoGhe)
        .query(`
          INSERT INTO ChuyenXe (maTuyenDuong, maPhuongTien, thoiGianDi, thoiGianDen, giaCoBan, soGheConTrong, soLuongGheDat, trangThaiChuyen, tienIchChiTiet)
          VALUES (@maTuyenDuong, @maPhuongTien, @thoiGianDi, @thoiGianDen, @giaCoBan, @soGheConTrong, 0, 'da_len_lich', '["AC", "Wifi"]')
        `);
    }
  } catch (err) {
    console.error('Error generating dynamic trips:', err);
  }
};

// Helper function to release expired seats (held > 5 mins)
const releaseExpiredSeats = async (pool) => {
  try {
    await pool.request().query(`
      DECLARE @ExpiredTickets TABLE (maVe INT, maGhe INT);

      INSERT INTO @ExpiredTickets (maVe, maGhe)
      SELECT maVe, maGhe FROM VeDienTu 
      WHERE trangThaiVe = 'da_dat' AND DATEDIFF(minute, ngayDatVe, GETDATE()) >= 5;

      IF EXISTS (SELECT 1 FROM @ExpiredTickets)
      BEGIN
        UPDATE VeDienTu 
        SET trangThaiVe = 'da_huy' 
        WHERE maVe IN (SELECT maVe FROM @ExpiredTickets);

        UPDATE GheNgoi 
        SET trangThaiGhe = 'trong' 
        WHERE maGhe IN (SELECT maGhe FROM @ExpiredTickets WHERE maGhe IS NOT NULL);
      END
    `);
  } catch (err) {
    console.error('Error releasing expired seats:', err);
  }
};

// @desc    Tìm kiếm chuyến xe
// @route   GET /api/trips/search
// @access  Public
const searchTrips = async (req, res) => {
  const { diemDi, diemDen, date, category, busType } = req.query;

  try {
    const pool = getPool();
    
    // Tự động dọn dẹp các vé đã quá hạn giữ chỗ (5 phút) - Đã chuyển sang chạy ngầm trong Scheduler
    // await releaseExpiredSeats(pool);

    // Create default trips for testing if none exist
    if (diemDi && diemDen && date) {
      await ensureTripsExist(pool, diemDi, diemDen, date);
    }

    let queryStr = `
      SELECT TOP 200 cx.*, td.danhSachTramDung, pt.tienIch as vehicleAmenities, pt.bienSoXe, nd.tenNguoiDung AS tenNhanVien
      FROM vw_ChuyenXeChiTiet cx WITH (NOLOCK)
      LEFT JOIN ChuyenXe realCx WITH (NOLOCK) ON cx.maChuyenXe = realCx.maChuyenXe
      LEFT JOIN TuyenDuong td WITH (NOLOCK) ON realCx.maTuyenDuong = td.maTuyenDuong
      LEFT JOIN PhuongTien pt WITH (NOLOCK) ON realCx.maPhuongTien = pt.maPhuongTien
      LEFT JOIN NguoiDung nd WITH (NOLOCK) ON realCx.maNhanVien = nd.maNguoiDung
    `;

    const request = pool.request();
    const conditions = [];

    // Luôn luôn chỉ hiển thị các chuyến xe chưa khởi hành
    // Đổi lại thành GETDATE() của SQL Server vì Node.js new Date() sinh ra giờ UTC gây sai lệch múi giờ
    conditions.push("cx.thoiGianDi > GETDATE()");

    if (diemDi) {
      request.input('from', sql.NVarChar, diemDi);
      conditions.push('cx.diemDi = @from');
    }
    if (diemDen) {
      request.input('to', sql.NVarChar, diemDen);
      conditions.push('cx.diemDen = @to');
    }
    if (date) {
      request.input('date', sql.Date, date);
      conditions.push('CAST(cx.thoiGianDi AS DATE) = @date');
    }
    if (category) {
      request.input('category', sql.NVarChar, category);
      conditions.push('cx.loaiDichVu = @category');
    }
    if (busType) {
      request.input('busType', sql.NVarChar, busType);
      conditions.push('cx.loaiXe = @busType');
    }

    if (conditions.length > 0) {
      queryStr += ' WHERE ' + conditions.join(' AND ');
    }

    queryStr += ' ORDER BY cx.thoiGianDi ASC';

    // We run the built query
    const queryResult = await request.query(queryStr);
    const trips = [];
    
    // Tối ưu hóa N+1: Lấy tất cả ghế đã đặt của các chuyến xe trong kết quả một lần duy nhất
    const tripIds = queryResult.recordset.map(r => r.maChuyenXe);
    let allOccupiedSeats = [];
    
    if (tripIds.length > 0) {
      // Vì tripIds có thể dài, ta có thể dùng bảng tạm hoặc IN clause nếu số lượng vừa phải. 
      // Ở đây dùng chuỗi join cho IN clause là an toàn nhất nếu số lượng < 2000
      const idsString = tripIds.join(',');
      const bulkSeatResult = await pool.request().query(`
        SELECT maChuyenXe, soGhe 
        FROM GheNgoi WITH (NOLOCK)
        WHERE maChuyenXe IN (${idsString}) AND trangThaiGhe != 'trong'
      `);
      allOccupiedSeats = bulkSeatResult.recordset;
    }

    for (const row of queryResult.recordset) {
      // Lấy danh sách ghế đã đặt cho chuyến xe này từ kết quả bulk
      const occupiedSeats = allOccupiedSeats
        .filter(s => s.maChuyenXe === row.maChuyenXe)
        .map(s => {
          const num = parseInt(s.soGhe);
          return isNaN(num) ? s.soGhe : num;
        });

      // Parse tiện ích
      let amenities = ['AC', 'Wifi'];
      try {
        if (row.vehicleAmenities) {
          amenities = JSON.parse(row.vehicleAmenities);
        }
      } catch (e) {
        // Fallback
      }

      // Parse stops
      let stops = [
        { name: row.diemDi, time: formatTime(row.thoiGianDi), type: 'start' },
        { name: row.diemDen, time: formatTime(row.thoiGianDen), type: 'end' }
      ];
      try {
        if (row.danhSachTramDung) {
          stops = JSON.parse(row.danhSachTramDung);
        }
      } catch (e) {
        // Keep default
      }

      trips.push({
        id: row.maChuyenXe,
        from: row.diemDi,
        to: row.diemDen,
        date: formatDate(row.thoiGianDi),
        category: row.loaiDichVu,
        departureTime: formatTime(row.thoiGianDi),
        arrivalTime: formatTime(row.thoiGianDen),
        duration: calculateDuration(row.thoiGianDi, row.thoiGianDen),
        busType: row.loaiXe,
        seatsAvailable: row.tongSoGhe - occupiedSeats.length,
        totalSeats: row.tongSoGhe,
        seats: row.tongSoGhe,
        price: row.giaCoBan,
        operator: 'BusGo',
        amenities,
        rating: row.diemDanhGia || 4.5,
        reviewCount: row.soLuotDanhGia || 0,
        description: `Chuyến xe tuyến đường ${row.diemDi} - ${row.diemDen} với dịch vụ chất lượng cao.`,
        driver: row.tenNhanVien || 'Đang phân bổ',
        licensePlate: row.bienSoXe || 'Đang cập nhật',
        occupiedSeats,
        stops
      });
    }

    res.json(trips);
  } catch (error) {
    console.error('Lỗi khi tìm chuyến xe:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// @desc    Lấy chi tiết chuyến xe
// @route   GET /api/trips/:id
// @access  Public
const getTripById = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = getPool();
    
    // Tự động dọn dẹp các vé đã quá hạn giữ chỗ (5 phút) - Đã chuyển sang chạy ngầm
    // await releaseExpiredSeats(pool);

    const result = await pool.request()
      .input('maChuyenXe', sql.Int, id)
      .query(`
        SELECT cx.*, pt.tienIch as vehicleAmenities, pt.bienSoXe, nd.tenNguoiDung AS tenNhanVien, td.danhSachTramDung
        FROM vw_ChuyenXeChiTiet cx
        LEFT JOIN ChuyenXe realCx ON cx.maChuyenXe = realCx.maChuyenXe
        LEFT JOIN TuyenDuong td ON realCx.maTuyenDuong = td.maTuyenDuong
        LEFT JOIN PhuongTien pt ON realCx.maPhuongTien = pt.maPhuongTien
        LEFT JOIN NguoiDung nd ON realCx.maNhanVien = nd.maNguoiDung
        WHERE cx.maChuyenXe = @maChuyenXe
      `);

    const row = result.recordset[0];

    if (!row) {
      return res.status(404).json({ message: 'Không tìm thấy chuyến xe' });
    }

    // Lấy ghế đã đặt
    const seatResult = await pool.request()
      .input('maChuyenXe', sql.Int, id)
      .query("SELECT soGhe FROM GheNgoi WHERE maChuyenXe = @maChuyenXe AND trangThaiGhe != 'trong'");
    
    const occupiedSeats = seatResult.recordset.map(s => {
      const num = parseInt(s.soGhe);
      return isNaN(num) ? s.soGhe : num;
    });

    // Parse tiện ích
    let amenities = ['AC', 'Wifi'];
    try {
      if (row.vehicleAmenities) {
        amenities = JSON.parse(row.vehicleAmenities);
      }
    } catch (e) {
      // Fallback
    }

    // Parse stops
    let stops = [
      { name: row.diemDi, time: formatTime(row.thoiGianDi), type: 'start' },
      { name: row.diemDen, time: formatTime(row.thoiGianDen), type: 'end' }
    ];
    try {
      if (row.danhSachTramDung) {
        stops = JSON.parse(row.danhSachTramDung);
      }
    } catch (e) {
      // Keep default
    }

    const trip = {
      id: row.maChuyenXe,
      from: row.diemDi,
      to: row.diemDen,
      date: formatDate(row.thoiGianDi),
      category: row.loaiDichVu,
      departureTime: formatTime(row.thoiGianDi),
      arrivalTime: formatTime(row.thoiGianDen),
      duration: calculateDuration(row.thoiGianDi, row.thoiGianDen),
      busType: row.loaiXe,
      seatsAvailable: row.tongSoGhe - occupiedSeats.length,
      totalSeats: row.tongSoGhe,
      seats: row.tongSoGhe,
      price: row.giaCoBan,
      operator: 'BusGo',
      amenities,
      rating: row.diemDanhGia || 4.5,
      reviewCount: row.soLuotDanhGia || 0,
      description: `Chuyến xe tuyến đường ${row.diemDi} - ${row.diemDen} với dịch vụ chất lượng cao.`,
      driver: row.tenNhanVien || 'Đang phân bổ',
      licensePlate: row.bienSoXe || 'Đang cập nhật',
      occupiedSeats,
      stops
    };

    res.json(trip);
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết chuyến xe:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Lấy danh sách chuyến xe theo tài xế (driverId) - dùng cho trang tài xế
// @route   GET /api/trips?driverId=:id
const getDriverTrips = async (req, res) => {
  const { driverId } = req.query;
  if (!driverId) {
    return res.status(400).json({ message: 'Thiếu driverId' });
  }

  try {
    const pool = getPool();
    const result = await pool.request()
      .input('driverId', sql.Int, parseInt(driverId))
      .query(`
        SELECT
          cx.maChuyenXe,
          cx.maNhanVien,
          td.diemDi,
          td.diemDen,
          td.loaiDichVu,
          cx.thoiGianDi,
          cx.thoiGianDen,
          cx.giaCoBan,
          cx.soGheConTrong,
          cx.trangThaiChuyen,
          pt.bienSoXe,
          pt.loaiXe,
          pt.phanLoaiXe
        FROM ChuyenXe cx
        INNER JOIN TuyenDuong td ON cx.maTuyenDuong = td.maTuyenDuong
        INNER JOIN PhuongTien pt ON cx.maPhuongTien = pt.maPhuongTien
        WHERE cx.maNhanVien = @driverId
        ORDER BY cx.thoiGianDi DESC
      `);

    res.json(result.recordset.map(row => ({
      maChuyenXe: row.maChuyenXe,
      diemDi: row.diemDi,
      diemDen: row.diemDen,
      loaiDichVu: row.loaiDichVu,
      thoiGianDi: row.thoiGianDi,
      thoiGianDen: row.thoiGianDen,
      giaCoBan: row.giaCoBan,
      soGheConTrong: row.soGheConTrong,
      trangThaiChuyen: row.trangThaiChuyen,
      bienSoXe: row.bienSoXe,
      loaiXe: row.loaiXe,
      phanLoaiXe: row.phanLoaiXe
    })));
  } catch (error) {
    console.error('Lỗi lấy chuyến xe theo tài xế:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = {
  searchTrips,
  getTripById,
  getDriverTrips,
  releaseExpiredSeats
};
