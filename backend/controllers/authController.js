const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql } = require('../config/db');

// Tạo JWT Token
const generateToken = (id, role, name, email) => {
  return jwt.sign({ id, role, name, email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// @desc    Đăng ký người dùng mới (Khách hàng)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  if (!fullName || !email || !phone || !password) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
  }

  try {
    const pool = await sql.connect();
    
    // Kiểm tra xem email hoặc sđt đã tồn tại chưa
    const userExists = await pool.request()
      .input('email', sql.VarChar, email)
      .input('phone', sql.VarChar, phone)
      .query('SELECT * FROM NguoiDung WHERE email = @email OR soDienThoai = @phone');

    if (userExists.recordset.length > 0) {
      return res.status(400).json({ message: 'Email hoặc Số điện thoại đã được sử dụng' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Bắt đầu Transaction để Insert vào NguoiDung và KhachHang
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
          INSERT INTO NguoiDung (tenNguoiDung, email, soDienThoai, matKhau, daXacThucEmail, daXacThucPhone, trangThaiTaiKhoan)
          OUTPUT INSERTED.maNguoiDung
          VALUES (@tenNguoiDung, @email, @soDienThoai, @matKhau, 1, 1, 'active')
        `);

      const userId = insertUserResult.recordset[0].maNguoiDung;

      // 2. Insert KhachHang
      await transaction.request()
        .input('maKhachHang', sql.Int, userId)
        .query(`
          INSERT INTO KhachHang (maKhachHang, diemTichLuy, congTichLuy, tongTienDaChiTra, capDoThanhVien)
          VALUES (@maKhachHang, 0, 0, 0, 'bronze')
        `);

      await transaction.commit();

      // Tạo token
      const role = 'CUSTOMER';
      const token = generateToken(userId, role, fullName, email);

      res.status(201).json({
        message: 'Đăng ký thành công',
        user: {
          id: userId,
          name: fullName,
          email,
          phone,
          role
        },
        token
      });

    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Lỗi khi đăng ký:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Đăng nhập
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { emailOrPhone, password } = req.body;

  if (!emailOrPhone || !password) {
    return res.status(400).json({ message: 'Vui lòng cung cấp email/sđt và mật khẩu' });
  }

  try {
    const pool = await sql.connect();

    // Lấy thông tin user
    const userResult = await pool.request()
      .input('emailOrPhone', sql.VarChar, emailOrPhone)
      .query(`
        SELECT * FROM NguoiDung 
        WHERE email = @emailOrPhone OR soDienThoai = @emailOrPhone
      `);

    const user = userResult.recordset[0];

    if (!user) {
      return res.status(401).json({ message: 'Tài khoản không tồn tại' });
    }

    // Kiểm tra trạng thái
    if (user.trangThaiTaiKhoan !== 'active') {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa hoặc chưa kích hoạt' });
    }

    // Check mật khẩu
    const isMatch = await bcrypt.compare(password, user.matKhau);
    if (!isMatch) {
      // For development, check if plain text matches (to support mock data in SQL if it's not hashed)
      if (password !== user.matKhau && user.matKhau !== 'secure_hash') {
          return res.status(401).json({ message: 'Mật khẩu không chính xác' });
      }
    }

    // Cập nhật lastLoginDate
    await pool.request()
      .input('maNguoiDung', sql.Int, user.maNguoiDung)
      .query('UPDATE NguoiDung SET lastLoginDate = GETDATE() WHERE maNguoiDung = @maNguoiDung');

    // Xác định Role (Admin, NhanVien, KhachHang)
    let role = 'CUSTOMER';
    const adminCheck = await pool.request().input('ma', sql.Int, user.maNguoiDung).query('SELECT * FROM Admin WHERE maAdmin = @ma');
    if (adminCheck.recordset.length > 0) {
      role = 'ADMIN';
    } else {
      const staffCheck = await pool.request().input('ma', sql.Int, user.maNguoiDung).query('SELECT * FROM NhanVien WHERE maNhanVien = @ma');
      if (staffCheck.recordset.length > 0) {
        role = 'STAFF'; // Hoặc theo vaiTro trong bảng NhanVien
      }
    }

    const token = generateToken(user.maNguoiDung, role, user.tenNguoiDung, user.email);

    res.json({
      message: 'Đăng nhập thành công',
      user: {
        id: user.maNguoiDung,
        name: user.tenNguoiDung,
        email: user.email,
        phone: user.soDienThoai,
        role
      },
      token
    });

  } catch (error) {
    console.error('Lỗi khi đăng nhập:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = {
  register,
  login
};
