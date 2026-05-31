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

module.exports = {
  getAllUsers,
  updateUserStatus,
  createStaff
};
