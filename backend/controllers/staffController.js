const bcrypt = require('bcryptjs');
const { sql } = require('../config/db');

const VALID_ROLES = ['Driver', 'Ticket-Staff', 'Support-Staff'];

// @desc    Tạo tài khoản nhân sự
// @route   POST /api/admin/staff
// @access  Private/Admin
const createStaff = async (req, res) => {
  const { fullName, email, phone, password, role } = req.body;

  if (!fullName || !email || !phone || !password || !role) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
  }

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({
      message: `Vai trò không hợp lệ. Chỉ chấp nhận: ${VALID_ROLES.join(', ')}`
    });
  }

  try {
    const pool = await sql.connect();

    // Kiểm tra email hoặc SĐT đã tồn tại chưa
    const existing = await pool.request()
      .input('email', sql.VarChar, email)
      .input('phone', sql.VarChar, phone)
      .query('SELECT maNguoiDung FROM NguoiDung WHERE email = @email OR soDienThoai = @phone');

    if (existing.recordset.length > 0) {
      return res.status(400).json({ message: 'Email hoặc số điện thoại đã được sử dụng' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

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
        .input('vaiTro', sql.VarChar, role)
        .query(`
          INSERT INTO NhanVien (maNhanVien, vaiTro)
          VALUES (@maNhanVien, @vaiTro)
        `);

      // 3. Nếu là Driver, insert thêm vào TaiXe nếu bảng tồn tại
      if (role === 'Driver') {
        await transaction.request()
          .input('maTaiXe', sql.Int, userId)
          .query(`
            IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'TaiXe')
            BEGIN
              INSERT INTO TaiXe (maTaiXe, trangThai)
              VALUES (@maTaiXe, 'active')
            END
          `);
      }

      await transaction.commit();

      res.status(201).json({
        message: 'Tạo tài khoản nhân sự thành công',
        staff: { id: userId, name: fullName, email, phone, role }
      });

    } catch (err) {
      await transaction.rollback();
      throw err;
    }

  } catch (error) {
    console.error('Lỗi khi tạo tài khoản nhân sự:', error.message);
    console.error('Chi tiết:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo tài khoản nhân sự', error: error.message });
  }
};

// @desc    Lấy danh sách nhân sự
// @route   GET /api/admin/staff
// @access  Private/Admin
const getAllStaff = async (req, res) => {
  try {
    const pool = await sql.connect();
    const result = await pool.request().query(`
      SELECT 
        nd.maNguoiDung, nd.tenNguoiDung, nd.email, nd.soDienThoai,
        nd.trangThaiTaiKhoan, nd.ngayTaoTaiKhoan,
        nv.vaiTro, nv.lichLamViec
      FROM NguoiDung nd
      INNER JOIN NhanVien nv ON nd.maNguoiDung = nv.maNhanVien
      ORDER BY nd.ngayTaoTaiKhoan DESC
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách nhân sự:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách nhân sự' });
  }
};

// @desc    Cập nhật thông tin nhân sự
// @route   PUT /api/admin/staff/:id
// @access  Private/Admin
const updateStaff = async (req, res) => {
  const { id } = req.params;
  const { fullName, phone, role, trangThaiTaiKhoan } = req.body;

  if (role && !VALID_ROLES.includes(role)) {
    return res.status(400).json({
      message: `Vai trò không hợp lệ. Chỉ chấp nhận: ${VALID_ROLES.join(', ')}`
    });
  }

  try {
    const pool = await sql.connect();

    const existing = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT nd.maNguoiDung FROM NguoiDung nd
        INNER JOIN NhanVien nv ON nd.maNguoiDung = nv.maNhanVien
        WHERE nd.maNguoiDung = @id
      `);

    if (existing.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy nhân sự' });
    }

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      await transaction.request()
        .input('id', sql.Int, id)
        .input('tenNguoiDung', sql.NVarChar, fullName || null)
        .input('soDienThoai', sql.VarChar, phone || null)
        .input('trangThaiTaiKhoan', sql.VarChar, trangThaiTaiKhoan || null)
        .query(`
          UPDATE NguoiDung SET
            tenNguoiDung      = COALESCE(@tenNguoiDung, tenNguoiDung),
            soDienThoai       = COALESCE(@soDienThoai, soDienThoai),
            trangThaiTaiKhoan = COALESCE(@trangThaiTaiKhoan, trangThaiTaiKhoan),
            ngayCapNhatCuoi   = GETDATE()
          WHERE maNguoiDung = @id
        `);

      if (role) {
        await transaction.request()
          .input('id', sql.Int, id)
          .input('vaiTro', sql.VarChar, role)
          .query('UPDATE NhanVien SET vaiTro = @vaiTro WHERE maNhanVien = @id');
      }

      await transaction.commit();
      res.json({ message: 'Cập nhật thông tin nhân sự thành công' });

    } catch (err) {
      await transaction.rollback();
      throw err;
    }

  } catch (error) {
    console.error('Lỗi khi cập nhật nhân sự:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật nhân sự' });
  }
};

module.exports = { createStaff, getAllStaff, updateStaff };
