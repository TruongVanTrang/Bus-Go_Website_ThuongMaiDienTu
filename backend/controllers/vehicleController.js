const { sql } = require('../config/db');

const VALID_LOAI_XE = ['16-seater', '35-seater'];
const VALID_TRANG_THAI = ['active', 'san_sang', 'maintenance', 'inactive'];

// @desc    Lấy danh sách phương tiện
// @route   GET /api/admin/vehicles
// @access  Private/Admin
const getAllVehicles = async (req, res) => {
  try {
    const pool = await sql.connect();
    const result = await pool.request().query(`
      SELECT 
        pt.maPhuongTien, pt.bienSoXe, pt.nhanHieu, pt.mauSac, pt.namSanXuat,
        pt.tongSoGhe, pt.loaiXe, pt.trangThaiXe, pt.tienIch,
        pt.ngayMuaVao, pt.ngayBaoTriLanSau, pt.maTaiXeChinh,
        nd.tenNguoiDung AS tenTaiXe
      FROM PhuongTien pt
      LEFT JOIN NguoiDung nd ON pt.maTaiXeChinh = nd.maNguoiDung
      ORDER BY pt.maPhuongTien ASC
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách phương tiện:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// @desc    Thêm phương tiện mới
// @route   POST /api/admin/vehicles
// @access  Private/Admin
const createVehicle = async (req, res) => {
  const { bienSoXe, nhanHieu, mauSac, namSanXuat, tongSoGhe, loaiXe, tienIch, ngayMuaVao, ngayBaoTriLanSau, maTaiXeChinh } = req.body;

  if (!bienSoXe || !loaiXe || !tongSoGhe) {
    return res.status(400).json({ message: 'Vui lòng cung cấp biển số xe, loại xe và số ghế' });
  }

  if (!VALID_LOAI_XE.includes(loaiXe)) {
    return res.status(400).json({ message: `Loại xe không hợp lệ. Chỉ chấp nhận: ${VALID_LOAI_XE.join(', ')}` });
  }

  // Kiểm tra số ghế hợp lệ theo loại xe
  if (loaiXe === '16-seater' && tongSoGhe !== 16) {
    return res.status(400).json({ message: 'Xe 16 chỗ phải có đúng 16 ghế' });
  }
  if (loaiXe === '35-seater' && tongSoGhe !== 35) {
    return res.status(400).json({ message: 'Xe 35 chỗ phải có đúng 35 ghế' });
  }

  try {
    const pool = await sql.connect();

    // Kiểm tra biển số đã tồn tại chưa
    const existing = await pool.request()
      .input('bienSoXe', sql.VarChar, bienSoXe)
      .query('SELECT maPhuongTien FROM PhuongTien WHERE bienSoXe = @bienSoXe');

    if (existing.recordset.length > 0) {
      return res.status(400).json({ message: 'Biển số xe đã tồn tại' });
    }

    const result = await pool.request()
      .input('bienSoXe', sql.VarChar, bienSoXe)
      .input('nhanHieu', sql.NVarChar, nhanHieu || null)
      .input('mauSac', sql.NVarChar, mauSac || null)
      .input('namSanXuat', sql.Int, namSanXuat || null)
      .input('tongSoGhe', sql.Int, tongSoGhe)
      .input('loaiXe', sql.VarChar, loaiXe)
      .input('trangThaiXe', sql.VarChar, 'active')
      .input('tienIch', sql.NVarChar, tienIch ? JSON.stringify(tienIch) : '["AC", "Wifi"]')
      .input('ngayMuaVao', sql.Date, ngayMuaVao || null)
      .input('ngayBaoTriLanSau', sql.Date, ngayBaoTriLanSau || null)
      .input('maTaiXeChinh', sql.Int, maTaiXeChinh || null)
      .query(`
        INSERT INTO PhuongTien (bienSoXe, nhanHieu, mauSac, namSanXuat, tongSoGhe, loaiXe, trangThaiXe, tienIch, ngayMuaVao, ngayBaoTriLanSau, maTaiXeChinh)
        OUTPUT INSERTED.maPhuongTien
        VALUES (@bienSoXe, @nhanHieu, @mauSac, @namSanXuat, @tongSoGhe, @loaiXe, @trangThaiXe, @tienIch, @ngayMuaVao, @ngayBaoTriLanSau, @maTaiXeChinh)
      `);

    res.status(201).json({
      message: 'Thêm phương tiện thành công',
      vehicle: { id: result.recordset[0].maPhuongTien, bienSoXe, loaiXe, tongSoGhe }
    });

  } catch (error) {
    console.error('Lỗi khi thêm phương tiện:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// @desc    Cập nhật phương tiện
// @route   PUT /api/admin/vehicles/:id
// @access  Private/Admin
const updateVehicle = async (req, res) => {
  const { id } = req.params;
  const { nhanHieu, mauSac, namSanXuat, trangThaiXe, tienIch, ngayBaoTriLanSau, maTaiXeChinh } = req.body;

  if (trangThaiXe && !VALID_TRANG_THAI.includes(trangThaiXe)) {
    return res.status(400).json({ message: `Trạng thái không hợp lệ. Chỉ chấp nhận: ${VALID_TRANG_THAI.join(', ')}` });
  }

  try {
    const pool = await sql.connect();

    const existing = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT maPhuongTien FROM PhuongTien WHERE maPhuongTien = @id');

    if (existing.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy phương tiện' });
    }

    await pool.request()
      .input('id', sql.Int, id)
      .input('nhanHieu', sql.NVarChar, nhanHieu || null)
      .input('mauSac', sql.NVarChar, mauSac || null)
      .input('namSanXuat', sql.Int, namSanXuat || null)
      .input('trangThaiXe', sql.VarChar, trangThaiXe || null)
      .input('tienIch', sql.NVarChar, tienIch ? JSON.stringify(tienIch) : null)
      .input('ngayBaoTriLanSau', sql.Date, ngayBaoTriLanSau || null)
      .input('maTaiXeChinh', sql.Int, maTaiXeChinh || null)
      .query(`
        UPDATE PhuongTien SET
          nhanHieu         = COALESCE(@nhanHieu, nhanHieu),
          mauSac           = COALESCE(@mauSac, mauSac),
          namSanXuat       = COALESCE(@namSanXuat, namSanXuat),
          trangThaiXe      = COALESCE(@trangThaiXe, trangThaiXe),
          tienIch          = COALESCE(@tienIch, tienIch),
          ngayBaoTriLanSau = COALESCE(@ngayBaoTriLanSau, ngayBaoTriLanSau),
          maTaiXeChinh     = COALESCE(@maTaiXeChinh, maTaiXeChinh)
        WHERE maPhuongTien = @id
      `);

    res.json({ message: 'Cập nhật phương tiện thành công' });

  } catch (error) {
    console.error('Lỗi khi cập nhật phương tiện:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// @desc    Xóa phương tiện
// @route   DELETE /api/admin/vehicles/:id
// @access  Private/Admin
const deleteVehicle = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await sql.connect();

    // Kiểm tra xe có đang được dùng trong chuyến xe nào không
    const inUse = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT TOP 1 maChuyenXe FROM ChuyenXe 
        WHERE maPhuongTien = @id AND trangThaiChuyen NOT IN ('hoan_thanh', 'da_huy')
      `);

    if (inUse.recordset.length > 0) {
      return res.status(400).json({ message: 'Không thể xóa xe đang được sử dụng trong chuyến xe' });
    }

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM PhuongTien WHERE maPhuongTien = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Không tìm thấy phương tiện' });
    }

    res.json({ message: 'Xóa phương tiện thành công' });

  } catch (error) {
    console.error('Lỗi khi xóa phương tiện:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

module.exports = { getAllVehicles, createVehicle, updateVehicle, deleteVehicle };
