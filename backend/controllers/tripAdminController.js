const { sql } = require('../config/db');

const VALID_TRANG_THAI = ['da_len_lich', 'dang_chay', 'hoan_thanh', 'da_huy'];

// @desc    Lấy danh sách chuyến xe
// @route   GET /api/admin/trips
// @access  Private/Admin
const getAllTrips = async (req, res) => {
  try {
    const pool = await sql.connect();
    const result = await pool.request().query(`
      SELECT 
        cx.maChuyenXe, cx.thoiGianDi, cx.thoiGianDen, cx.giaCoBan,
        cx.soGheConTrong, cx.soLuongGheDat, cx.trangThaiChuyen,
        cx.tienIchChiTiet, cx.diemDanhGia, cx.soLuotDanhGia, cx.ngayTao,
        td.diemDi, td.diemDen, td.loaiDichVu, td.khoangCach,
        pt.bienSoXe, pt.loaiXe, pt.tongSoGhe,
        nd.tenNguoiDung AS tenNhanVien
      FROM ChuyenXe cx
      INNER JOIN TuyenDuong td ON cx.maTuyenDuong = td.maTuyenDuong
      INNER JOIN PhuongTien pt ON cx.maPhuongTien = pt.maPhuongTien
      LEFT JOIN NguoiDung nd ON cx.maNhanVien = nd.maNguoiDung
      ORDER BY cx.thoiGianDi DESC
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách chuyến xe:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// @desc    Lên lịch chuyến xe mới
// @route   POST /api/admin/trips
// @access  Private/Admin
const createTrip = async (req, res) => {
  const { maTuyenDuong, maPhuongTien, maNhanVien, thoiGianDi, thoiGianDen, giaCoBan, tienIchChiTiet } = req.body;

  if (!maTuyenDuong || !maPhuongTien || !thoiGianDi || !thoiGianDen || !giaCoBan) {
    return res.status(400).json({ message: 'Vui lòng cung cấp tuyến đường, phương tiện, thời gian và giá cơ bản' });
  }

  if (new Date(thoiGianDi) >= new Date(thoiGianDen)) {
    return res.status(400).json({ message: 'Thời gian đi phải trước thời gian đến' });
  }

  try {
    const pool = await sql.connect();

    // Kiểm tra tuyến đường tồn tại
    const routeCheck = await pool.request()
      .input('maTuyenDuong', sql.Int, maTuyenDuong)
      .query('SELECT maTuyenDuong FROM TuyenDuong WHERE maTuyenDuong = @maTuyenDuong');
    if (routeCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tuyến đường' });
    }

    // Kiểm tra phương tiện tồn tại và đang active
    const vehicleCheck = await pool.request()
      .input('maPhuongTien', sql.Int, maPhuongTien)
      .query('SELECT maPhuongTien, tongSoGhe, trangThaiXe FROM PhuongTien WHERE maPhuongTien = @maPhuongTien');
    if (vehicleCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy phương tiện' });
    }
    const vehicle = vehicleCheck.recordset[0];
    if (vehicle.trangThaiXe !== 'active' && vehicle.trangThaiXe !== 'san_sang') {
      return res.status(400).json({ message: 'Phương tiện đang bảo trì hoặc không hoạt động' });
    }

    // Kiểm tra xe có bị trùng lịch không
    const conflictCheck = await pool.request()
      .input('maPhuongTien', sql.Int, maPhuongTien)
      .input('thoiGianDi', sql.DateTime, thoiGianDi)
      .input('thoiGianDen', sql.DateTime, thoiGianDen)
      .query(`
        SELECT TOP 1 maChuyenXe FROM ChuyenXe
        WHERE maPhuongTien = @maPhuongTien
          AND trangThaiChuyen NOT IN ('hoan_thanh', 'da_huy')
          AND (
            (thoiGianDi <= @thoiGianDi AND thoiGianDen > @thoiGianDi) OR
            (thoiGianDi < @thoiGianDen AND thoiGianDen >= @thoiGianDen) OR
            (thoiGianDi >= @thoiGianDi AND thoiGianDen <= @thoiGianDen)
          )
      `);
    if (conflictCheck.recordset.length > 0) {
      return res.status(400).json({ message: 'Phương tiện đã có lịch chạy trong khung giờ này' });
    }

    // Kiểm tra nhân viên/tài xế nếu có gán
    if (maNhanVien) {
      const staffCheck = await pool.request()
        .input('maNhanVien', sql.Int, maNhanVien)
        .query('SELECT maNhanVien FROM NhanVien WHERE maNhanVien = @maNhanVien');
      if (staffCheck.recordset.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy nhân viên/tài xế' });
      }
    }

    const tienIchJson = tienIchChiTiet ? JSON.stringify(tienIchChiTiet) : '["AC", "Wifi"]';

    const result = await pool.request()
      .input('maTuyenDuong', sql.Int, maTuyenDuong)
      .input('maPhuongTien', sql.Int, maPhuongTien)
      .input('maNhanVien', sql.Int, maNhanVien || null)
      .input('thoiGianDi', sql.DateTime, thoiGianDi)
      .input('thoiGianDen', sql.DateTime, thoiGianDen)
      .input('giaCoBan', sql.Decimal(18, 2), giaCoBan)
      .input('soGheConTrong', sql.Int, vehicle.tongSoGhe)
      .input('tienIchChiTiet', sql.NVarChar, tienIchJson)
      .query(`
        INSERT INTO ChuyenXe (maTuyenDuong, maPhuongTien, maNhanVien, thoiGianDi, thoiGianDen, giaCoBan, soGheConTrong, soLuongGheDat, trangThaiChuyen, tienIchChiTiet)
        OUTPUT INSERTED.maChuyenXe
        VALUES (@maTuyenDuong, @maPhuongTien, @maNhanVien, @thoiGianDi, @thoiGianDen, @giaCoBan, @soGheConTrong, 0, 'da_len_lich', @tienIchChiTiet)
      `);

    res.status(201).json({
      message: 'Lên lịch chuyến xe thành công',
      trip: {
        id: result.recordset[0].maChuyenXe,
        maTuyenDuong, maPhuongTien, maNhanVien,
        thoiGianDi, thoiGianDen, giaCoBan
      }
    });

  } catch (error) {
    console.error('Lỗi khi tạo chuyến xe:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// @desc    Cập nhật chuyến xe (gán tài xế, gán xe, đổi trạng thái)
// @route   PUT /api/admin/trips/:id
// @access  Private/Admin
const updateTrip = async (req, res) => {
  const { id } = req.params;
  const { maPhuongTien, maNhanVien, thoiGianDi, thoiGianDen, giaCoBan, trangThaiChuyen, tienIchChiTiet } = req.body;

  if (trangThaiChuyen && !VALID_TRANG_THAI.includes(trangThaiChuyen)) {
    return res.status(400).json({ message: `Trạng thái không hợp lệ. Chỉ chấp nhận: ${VALID_TRANG_THAI.join(', ')}` });
  }

  if (thoiGianDi && thoiGianDen && new Date(thoiGianDi) >= new Date(thoiGianDen)) {
    return res.status(400).json({ message: 'Thời gian đi phải trước thời gian đến' });
  }

  try {
    const pool = await sql.connect();

    const existing = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT maChuyenXe, trangThaiChuyen FROM ChuyenXe WHERE maChuyenXe = @id');

    if (existing.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy chuyến xe' });
    }

    // Không cho sửa chuyến đã hoàn thành
    if (existing.recordset[0].trangThaiChuyen === 'hoan_thanh') {
      return res.status(400).json({ message: 'Không thể chỉnh sửa chuyến xe đã hoàn thành' });
    }

    // Kiểm tra phương tiện nếu có thay đổi
    if (maPhuongTien) {
      const vehicleCheck = await pool.request()
        .input('maPhuongTien', sql.Int, maPhuongTien)
        .query('SELECT trangThaiXe FROM PhuongTien WHERE maPhuongTien = @maPhuongTien');
      if (vehicleCheck.recordset.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy phương tiện' });
      }
      if (vehicleCheck.recordset[0].trangThaiXe !== 'active' && vehicleCheck.recordset[0].trangThaiXe !== 'san_sang') {
        return res.status(400).json({ message: 'Phương tiện đang bảo trì hoặc không hoạt động' });
      }
    }

    // Kiểm tra nhân viên nếu có gán
    if (maNhanVien) {
      const staffCheck = await pool.request()
        .input('maNhanVien', sql.Int, maNhanVien)
        .query('SELECT maNhanVien FROM NhanVien WHERE maNhanVien = @maNhanVien');
      if (staffCheck.recordset.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy nhân viên/tài xế' });
      }
    }

    const tienIchJson = tienIchChiTiet ? JSON.stringify(tienIchChiTiet) : null;

    await pool.request()
      .input('id', sql.Int, id)
      .input('maPhuongTien', sql.Int, maPhuongTien || null)
      .input('maNhanVien', sql.Int, maNhanVien || null)
      .input('thoiGianDi', sql.DateTime, thoiGianDi || null)
      .input('thoiGianDen', sql.DateTime, thoiGianDen || null)
      .input('giaCoBan', sql.Decimal(18, 2), giaCoBan || null)
      .input('trangThaiChuyen', sql.VarChar, trangThaiChuyen || null)
      .input('tienIchChiTiet', sql.NVarChar, tienIchJson)
      .query(`
        UPDATE ChuyenXe SET
          maPhuongTien    = COALESCE(@maPhuongTien, maPhuongTien),
          maNhanVien      = COALESCE(@maNhanVien, maNhanVien),
          thoiGianDi      = COALESCE(@thoiGianDi, thoiGianDi),
          thoiGianDen     = COALESCE(@thoiGianDen, thoiGianDen),
          giaCoBan        = COALESCE(@giaCoBan, giaCoBan),
          trangThaiChuyen = COALESCE(@trangThaiChuyen, trangThaiChuyen),
          tienIchChiTiet  = COALESCE(@tienIchChiTiet, tienIchChiTiet)
        WHERE maChuyenXe = @id
      `);

    res.json({ message: 'Cập nhật chuyến xe thành công' });

  } catch (error) {
    console.error('Lỗi khi cập nhật chuyến xe:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

module.exports = { getAllTrips, createTrip, updateTrip };
