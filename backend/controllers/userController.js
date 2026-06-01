const { sql } = require('../config/db');
const { otpStore } = require('./authController');

// @desc    Lấy thông tin profile người dùng
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await sql.connect();

    const userResult = await pool.request()
      .input('maNguoiDung', sql.Int, userId)
      .query(`
        SELECT maNguoiDung as id, tenNguoiDung as name, email, soDienThoai as phone, 
               daXacThucEmail, trangThaiTaiKhoan, ngayTaoTaiKhoan
        FROM NguoiDung 
        WHERE maNguoiDung = @maNguoiDung
      `);

    const user = userResult.recordset[0];

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Nếu là KhachHang thì lấy thêm thông tin
    let customerInfo = {};
    if (req.user.role === 'CUSTOMER') {
      const customerResult = await pool.request()
        .input('maKhachHang', sql.Int, userId)
        .query(`
          SELECT diemTichLuy, capDoThanhVien, tongTienDaChiTra 
          FROM KhachHang 
          WHERE maKhachHang = @maKhachHang
        `);
      if (customerResult.recordset.length > 0) {
        customerInfo = customerResult.recordset[0];
      }
    }

    res.json({
      ...user,
      ...customerInfo
    });

  } catch (error) {
    console.error('Lỗi khi lấy profile:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Cập nhật profile người dùng (Không cập nhật password)
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  const { name, email, phone, otp } = req.body;
  const userId = req.user.id;

  try {
    const pool = await sql.connect();

    // Check if user exists and get current data
    const userResult = await pool.request()
      .input('maNguoiDung', sql.Int, userId)
      .query('SELECT * FROM NguoiDung WHERE maNguoiDung = @maNguoiDung');

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const currentUser = userResult.recordset[0];

    // Determine if sensitive info (email or phone) is changed
    const isEmailChanged = email && email !== currentUser.email;
    const isPhoneChanged = phone && phone !== currentUser.soDienThoai;

    if (isEmailChanged || isPhoneChanged) {
      // Must provide OTP sent to the CURRENT email
      if (!otp) {
        return res.status(400).json({ message: 'Vui lòng cung cấp mã xác thực OTP' });
      }

      const currentEmail = currentUser.email;
      const record = otpStore[currentEmail];

      if (!record) {
        return res.status(400).json({ message: 'Mã xác thực không tồn tại hoặc đã hết hạn' });
      }

      if (Date.now() > record.expiresAt) {
        delete otpStore[currentEmail];
        return res.status(400).json({ message: 'Mã xác thực đã hết hạn' });
      }

      if (record.code !== otp) {
        return res.status(400).json({ message: 'Mã xác thực không chính xác' });
      }

      // Verification success, delete OTP
      delete otpStore[currentEmail];
    }

    // Check if email or phone is already taken by ANOTHER user
    const checkDuplicate = await pool.request()
      .input('email', sql.VarChar, email)
      .input('phone', sql.VarChar, phone)
      .input('maNguoiDung', sql.Int, userId)
      .query(`
        SELECT * FROM NguoiDung 
        WHERE (email = @email OR soDienThoai = @phone) 
        AND maNguoiDung != @maNguoiDung
      `);

    if (checkDuplicate.recordset.length > 0) {
      return res.status(400).json({ message: 'Email hoặc số điện thoại đã được sử dụng bởi tài khoản khác' });
    }

    // Update info
    await pool.request()
      .input('tenNguoiDung', sql.NVarChar, name)
      .input('email', sql.VarChar, email)
      .input('soDienThoai', sql.VarChar, phone)
      .input('maNguoiDung', sql.Int, userId)
      .query(`
        UPDATE NguoiDung 
        SET tenNguoiDung = @tenNguoiDung, 
            email = @email, 
            soDienThoai = @soDienThoai,
            ngayCapNhatCuoi = GETDATE()
        WHERE maNguoiDung = @maNguoiDung
      `);

    res.json({
      message: 'Cập nhật thông tin thành công',
      user: {
        id: userId,
        name,
        email,
        phone
      }
    });

  } catch (error) {
    console.error('Lỗi cập nhật profile:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = {
  getProfile,
  updateProfile
};
