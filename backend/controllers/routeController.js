const { sql } = require('../config/db');

const VALID_LOAI_DICH_VU = ['city', 'interCity'];

// @desc    Lấy danh sách tuyến đường
// @route   GET /api/admin/routes
// @access  Private/Admin
const getAllRoutes = async (req, res) => {
  try {
    const pool = await sql.connect();
    const result = await pool.request().query(`
      SELECT maTuyenDuong, diemDi, diemDen, loaiDichVu, khoangCach, danhSachTramDung, ngayTao
      FROM TuyenDuong
      ORDER BY ngayTao DESC
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách tuyến đường:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// @desc    Thêm tuyến đường mới
// @route   POST /api/admin/routes
// @access  Private/Admin
const createRoute = async (req, res) => {
  const { diemDi, diemDen, loaiDichVu, khoangCach, danhSachTramDung } = req.body;

  if (!diemDi || !diemDen || !loaiDichVu) {
    return res.status(400).json({ message: 'Vui lòng cung cấp điểm đi, điểm đến và loại dịch vụ' });
  }

  if (!VALID_LOAI_DICH_VU.includes(loaiDichVu)) {
    return res.status(400).json({ message: `Loại dịch vụ không hợp lệ. Chỉ chấp nhận: ${VALID_LOAI_DICH_VU.join(', ')}` });
  }

  try {
    const pool = await sql.connect();

    // Kiểm tra tuyến đường đã tồn tại chưa
    const existing = await pool.request()
      .input('diemDi', sql.NVarChar, diemDi)
      .input('diemDen', sql.NVarChar, diemDen)
      .query('SELECT maTuyenDuong FROM TuyenDuong WHERE diemDi = @diemDi AND diemDen = @diemDen');

    if (existing.recordset.length > 0) {
      return res.status(400).json({ message: 'Tuyến đường này đã tồn tại' });
    }

    // danhSachTramDung là mảng JSON: [{ name, time, type }]
    const tramDungJson = danhSachTramDung ? JSON.stringify(danhSachTramDung) : null;

    const result = await pool.request()
      .input('diemDi', sql.NVarChar, diemDi)
      .input('diemDen', sql.NVarChar, diemDen)
      .input('loaiDichVu', sql.NVarChar, loaiDichVu)
      .input('khoangCach', sql.Float, khoangCach || null)
      .input('danhSachTramDung', sql.NVarChar, tramDungJson)
      .query(`
        INSERT INTO TuyenDuong (diemDi, diemDen, loaiDichVu, khoangCach, danhSachTramDung)
        OUTPUT INSERTED.maTuyenDuong
        VALUES (@diemDi, @diemDen, @loaiDichVu, @khoangCach, @danhSachTramDung)
      `);

    res.status(201).json({
      message: 'Thêm tuyến đường thành công',
      route: {
        id: result.recordset[0].maTuyenDuong,
        diemDi, diemDen, loaiDichVu, khoangCach
      }
    });

  } catch (error) {
    console.error('Lỗi khi thêm tuyến đường:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// @desc    Cập nhật tuyến đường
// @route   PUT /api/admin/routes/:id
// @access  Private/Admin
const updateRoute = async (req, res) => {
  const { id } = req.params;
  const { diemDi, diemDen, loaiDichVu, khoangCach, danhSachTramDung } = req.body;

  if (loaiDichVu && !VALID_LOAI_DICH_VU.includes(loaiDichVu)) {
    return res.status(400).json({ message: `Loại dịch vụ không hợp lệ. Chỉ chấp nhận: ${VALID_LOAI_DICH_VU.join(', ')}` });
  }

  try {
    const pool = await sql.connect();

    const existing = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT maTuyenDuong FROM TuyenDuong WHERE maTuyenDuong = @id');

    if (existing.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tuyến đường' });
    }

    const tramDungJson = danhSachTramDung ? JSON.stringify(danhSachTramDung) : null;

    await pool.request()
      .input('id', sql.Int, id)
      .input('diemDi', sql.NVarChar, diemDi || null)
      .input('diemDen', sql.NVarChar, diemDen || null)
      .input('loaiDichVu', sql.NVarChar, loaiDichVu || null)
      .input('khoangCach', sql.Float, khoangCach || null)
      .input('danhSachTramDung', sql.NVarChar, tramDungJson)
      .query(`
        UPDATE TuyenDuong SET
          diemDi           = COALESCE(@diemDi, diemDi),
          diemDen          = COALESCE(@diemDen, diemDen),
          loaiDichVu       = COALESCE(@loaiDichVu, loaiDichVu),
          khoangCach       = COALESCE(@khoangCach, khoangCach),
          danhSachTramDung = COALESCE(@danhSachTramDung, danhSachTramDung)
        WHERE maTuyenDuong = @id
      `);

    res.json({ message: 'Cập nhật tuyến đường thành công' });

  } catch (error) {
    console.error('Lỗi khi cập nhật tuyến đường:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// @desc    Xóa tuyến đường
// @route   DELETE /api/admin/routes/:id
// @access  Private/Admin
const deleteRoute = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await sql.connect();

    // Kiểm tra tuyến đường có chuyến xe chưa hoàn thành không
    const inUse = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT TOP 1 maChuyenXe FROM ChuyenXe
        WHERE maTuyenDuong = @id AND trangThaiChuyen NOT IN ('hoan_thanh', 'da_huy')
      `);

    if (inUse.recordset.length > 0) {
      return res.status(400).json({ message: 'Không thể xóa tuyến đường đang có chuyến xe hoạt động' });
    }

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM TuyenDuong WHERE maTuyenDuong = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tuyến đường' });
    }

    res.json({ message: 'Xóa tuyến đường thành công' });

  } catch (error) {
    console.error('Lỗi khi xóa tuyến đường:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

module.exports = { getAllRoutes, createRoute, updateRoute, deleteRoute };
