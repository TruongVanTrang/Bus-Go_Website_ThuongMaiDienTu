const { sql } = require('../config/db');

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

module.exports = {
  getAllUsers,
  updateUserStatus
};
