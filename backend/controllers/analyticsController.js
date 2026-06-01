const { sql } = require('../config/db');

// @desc    Doanh thu vé + hàng hóa
// @route   GET /api/admin/analytics/revenue
// @access  Private/Admin
const getRevenue = async (req, res) => {
  const { from, to } = req.query;
  // Mặc định 30 ngày gần nhất nếu không truyền
  const dateFrom = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dateTo = to || new Date().toISOString().split('T')[0];

  try {
    const pool = await sql.connect();

    // Tổng doanh thu theo ngày
    const dailyResult = await pool.request()
      .input('dateFrom', sql.Date, dateFrom)
      .input('dateTo', sql.Date, dateTo)
      .query(`
        SELECT 
          CAST(ngayDatVe AS DATE) AS ngay,
          SUM(giaVe)       AS doanhThuVe,
          SUM(giaHangHoa)  AS doanhThuHangHoa,
          SUM(giaThanhToan) AS tongDoanhThu,
          COUNT(maVe)      AS soVe
        FROM VeDienTu
        WHERE trangThaiVe = 'da_thanh_toan'
          AND CAST(ngayDatVe AS DATE) BETWEEN @dateFrom AND @dateTo
        GROUP BY CAST(ngayDatVe AS DATE)
        ORDER BY ngay ASC
      `);

    // Tổng hợp chung
    const summaryResult = await pool.request()
      .input('dateFrom', sql.Date, dateFrom)
      .input('dateTo', sql.Date, dateTo)
      .query(`
        SELECT 
          SUM(giaVe)        AS tongDoanhThuVe,
          SUM(giaHangHoa)   AS tongDoanhThuHangHoa,
          SUM(giaThanhToan) AS tongDoanhThu,
          COUNT(maVe)       AS tongSoVe
        FROM VeDienTu
        WHERE trangThaiVe = 'da_thanh_toan'
          AND CAST(ngayDatVe AS DATE) BETWEEN @dateFrom AND @dateTo
      `);

    // Doanh thu theo phương thức thanh toán
    const paymentResult = await pool.request()
      .input('dateFrom', sql.Date, dateFrom)
      .input('dateTo', sql.Date, dateTo)
      .query(`
        SELECT 
          ptt.tenPhuongThuc,
          SUM(vdt.giaThanhToan) AS tongTien,
          COUNT(vdt.maVe)       AS soVe
        FROM VeDienTu vdt
        LEFT JOIN PhuongThucThanhToan ptt ON vdt.maPhuongThuc = ptt.maPhuongThuc
        WHERE vdt.trangThaiVe = 'da_thanh_toan'
          AND CAST(vdt.ngayDatVe AS DATE) BETWEEN @dateFrom AND @dateTo
        GROUP BY ptt.tenPhuongThuc
        ORDER BY tongTien DESC
      `);

    res.json({
      period: { from: dateFrom, to: dateTo },
      summary: summaryResult.recordset[0],
      daily: dailyResult.recordset,
      byPaymentMethod: paymentResult.recordset
    });

  } catch (error) {
    console.error('Lỗi khi lấy doanh thu:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// @desc    Tỷ lệ lấp đầy tuyến đường
// @route   GET /api/admin/analytics/routes
// @access  Private/Admin
const getRouteAnalytics = async (req, res) => {
  const { from, to } = req.query;
  const dateFrom = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dateTo = to || new Date().toISOString().split('T')[0];

  try {
    const pool = await sql.connect();

    const result = await pool.request()
      .input('dateFrom', sql.Date, dateFrom)
      .input('dateTo', sql.Date, dateTo)
      .query(`
        SELECT 
          td.maTuyenDuong,
          td.diemDi,
          td.diemDen,
          td.loaiDichVu,
          COUNT(cx.maChuyenXe)                          AS soChuyenXe,
          SUM(cx.soLuongGheDat)                         AS tongGheDat,
          SUM(cx.tongSoGhe)                             AS tongGhe,
          CASE 
            WHEN SUM(cx.tongSoGhe) > 0 
            THEN ROUND(SUM(cx.soLuongGheDat) * 100.0 / SUM(cx.tongSoGhe), 1)
            ELSE 0 
          END AS tyLeLapDay
        FROM TuyenDuong td
        INNER JOIN (
          SELECT cx.maChuyenXe, cx.maTuyenDuong, cx.soLuongGheDat, pt.tongSoGhe
          FROM ChuyenXe cx
          INNER JOIN PhuongTien pt ON cx.maPhuongTien = pt.maPhuongTien
          WHERE CAST(cx.thoiGianDi AS DATE) BETWEEN @dateFrom AND @dateTo
            AND cx.trangThaiChuyen != 'da_huy'
        ) cx ON td.maTuyenDuong = cx.maTuyenDuong
        GROUP BY td.maTuyenDuong, td.diemDi, td.diemDen, td.loaiDichVu
        ORDER BY tyLeLapDay DESC
      `);

    res.json({
      period: { from: dateFrom, to: dateTo },
      routes: result.recordset
    });

  } catch (error) {
    console.error('Lỗi khi lấy thống kê tuyến đường:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// @desc    Tổng hợp đánh giá chất lượng tài xế/xe
// @route   GET /api/admin/analytics/ratings
// @access  Private/Admin
const getRatings = async (req, res) => {
  const { from, to } = req.query;
  const dateFrom = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dateTo = to || new Date().toISOString().split('T')[0];

  try {
    const pool = await sql.connect();

    // Đánh giá tổng hợp toàn hệ thống
    const summaryResult = await pool.request()
      .input('dateFrom', sql.Date, dateFrom)
      .input('dateTo', sql.Date, dateTo)
      .query(`
        SELECT 
          COUNT(f.maFeedback)          AS tongSoDanhGia,
          ROUND(AVG(CAST(f.diemDanhGia AS FLOAT)), 2)  AS diemTrungBinh,
          ROUND(AVG(CAST(f.diemPhucVu AS FLOAT)), 2)   AS diemPhucVuTrungBinh,
          ROUND(AVG(CAST(f.diemGiaoThiep AS FLOAT)), 2) AS diemGiaoThiepTrungBinh,
          SUM(CASE WHEN f.diemDanhGia = 5 THEN 1 ELSE 0 END) AS so5Sao,
          SUM(CASE WHEN f.diemDanhGia = 4 THEN 1 ELSE 0 END) AS so4Sao,
          SUM(CASE WHEN f.diemDanhGia = 3 THEN 1 ELSE 0 END) AS so3Sao,
          SUM(CASE WHEN f.diemDanhGia = 2 THEN 1 ELSE 0 END) AS so2Sao,
          SUM(CASE WHEN f.diemDanhGia = 1 THEN 1 ELSE 0 END) AS so1Sao
        FROM Feedback f
        WHERE CAST(f.ngayTao AS DATE) BETWEEN @dateFrom AND @dateTo
      `);

    // Đánh giá theo tuyến đường
    const byRouteResult = await pool.request()
      .input('dateFrom', sql.Date, dateFrom)
      .input('dateTo', sql.Date, dateTo)
      .query(`
        SELECT 
          td.diemDi,
          td.diemDen,
          COUNT(f.maFeedback) AS soDanhGia,
          ROUND(AVG(CAST(f.diemDanhGia AS FLOAT)), 2) AS diemTrungBinh
        FROM Feedback f
        INNER JOIN VeDienTu vdt ON f.maVe = vdt.maVe
        INNER JOIN ChuyenXe cx ON vdt.maChuyenXe = cx.maChuyenXe
        INNER JOIN TuyenDuong td ON cx.maTuyenDuong = td.maTuyenDuong
        WHERE CAST(f.ngayTao AS DATE) BETWEEN @dateFrom AND @dateTo
        GROUP BY td.diemDi, td.diemDen
        ORDER BY diemTrungBinh DESC
      `);

    // Đánh giá theo tài xế
    const byDriverResult = await pool.request()
      .input('dateFrom', sql.Date, dateFrom)
      .input('dateTo', sql.Date, dateTo)
      .query(`
        SELECT 
          nd.maNguoiDung AS maTaiXe,
          nd.tenNguoiDung AS tenTaiXe,
          COUNT(f.maFeedback) AS soDanhGia,
          ROUND(AVG(CAST(f.diemDanhGia AS FLOAT)), 2)   AS diemTrungBinh,
          ROUND(AVG(CAST(f.diemPhucVu AS FLOAT)), 2)    AS diemPhucVu,
          ROUND(AVG(CAST(f.diemGiaoThiep AS FLOAT)), 2) AS diemGiaoThiep
        FROM Feedback f
        INNER JOIN VeDienTu vdt ON f.maVe = vdt.maVe
        INNER JOIN ChuyenXe cx ON vdt.maChuyenXe = cx.maChuyenXe
        INNER JOIN NguoiDung nd ON cx.maNhanVien = nd.maNguoiDung
        WHERE CAST(f.ngayTao AS DATE) BETWEEN @dateFrom AND @dateTo
        GROUP BY nd.maNguoiDung, nd.tenNguoiDung
        ORDER BY diemTrungBinh DESC
      `);

    // Nhận xét gần nhất
    const recentResult = await pool.request()
      .input('dateFrom', sql.Date, dateFrom)
      .input('dateTo', sql.Date, dateTo)
      .query(`
        SELECT TOP 10
          f.diemDanhGia, f.nhanXet, f.ngayTao,
          nd.tenNguoiDung AS tenKhachHang,
          td.diemDi, td.diemDen
        FROM Feedback f
        INNER JOIN NguoiDung nd ON f.maKhachHang = nd.maNguoiDung
        INNER JOIN VeDienTu vdt ON f.maVe = vdt.maVe
        INNER JOIN ChuyenXe cx ON vdt.maChuyenXe = cx.maChuyenXe
        INNER JOIN TuyenDuong td ON cx.maTuyenDuong = td.maTuyenDuong
        WHERE CAST(f.ngayTao AS DATE) BETWEEN @dateFrom AND @dateTo
        ORDER BY f.ngayTao DESC
      `);

    res.json({
      period: { from: dateFrom, to: dateTo },
      summary: summaryResult.recordset[0],
      byRoute: byRouteResult.recordset,
      byDriver: byDriverResult.recordset,
      recentReviews: recentResult.recordset
    });

  } catch (error) {
    console.error('Lỗi khi lấy thống kê đánh giá:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

module.exports = { getRevenue, getRouteAnalytics, getRatings };
