const sql = require('mssql');
const bcrypt = require('bcryptjs');

const dbConfig = {
  user: 'sa',
  password: '160505',
  database: 'BusGoDBs',
  server: 'localhost',
  options: { encrypt: false, trustServerCertificate: true }
};

async function resetTruckDrivers() {
  try {
    const pool = await sql.connect(dbConfig);
    const hashPassword = await bcrypt.hash('password123', 10);

    // Xóa các tài xế truck cũ (nếu có)
    await pool.request().query(`
      DELETE FROM PhuongTien WHERE loaiXe IN ('truck_5t', 'truck_10t', 'truck_20t', 'truck_30t', 'truck_1.5t');
      DELETE FROM NhanVien WHERE vaiTro = 'TRUCK_DRIVER';
      DELETE FROM NguoiDung WHERE email LIKE '%truck%';
    `);

    const drivers = [
      { name: 'Nguyễn Văn A', email: 'truck1@busgo.com', phone: '0901000001', type: 'truck_5t', plate: '51C-111.11' },
      { name: 'Trần Cảnh B', email: 'truck2@busgo.com', phone: '0901000002', type: 'truck_5t', plate: '51C-111.22' },
      { name: 'Lê Quốc C', email: 'truck3@busgo.com', phone: '0901000003', type: 'truck_10t', plate: '51C-222.11' },
      { name: 'Phạm Minh D', email: 'truck4@busgo.com', phone: '0901000004', type: 'truck_10t', plate: '51C-222.22' },
      { name: 'Hoàng Hữu E', email: 'truck5@busgo.com', phone: '0901000005', type: 'truck_30t', plate: '51C-333.11' },
      { name: 'Vũ Thanh F', email: 'truck6@busgo.com', phone: '0901000006', type: 'truck_30t', plate: '51C-333.22' }
    ];

    for (const d of drivers) {
      // Thêm NguoiDung
      const userRes = await pool.request()
        .input('name', sql.NVarChar, d.name)
        .input('email', sql.VarChar, d.email)
        .input('phone', sql.VarChar, d.phone)
        .input('pass', sql.VarChar, hashPassword)
        .query(`
          INSERT INTO NguoiDung (tenNguoiDung, email, soDienThoai, matKhau, trangThaiTaiKhoan, daXacThucEmail, ngayTaoTaiKhoan)
          OUTPUT inserted.maNguoiDung
          VALUES (@name, @email, @phone, @pass, 'active', 1, GETDATE())
        `);
      const userId = userRes.recordset[0].maNguoiDung;

      // Thêm NhanVien
      await pool.request()
        .input('userId', sql.Int, userId)
        .query(`
          INSERT INTO NhanVien (maNhanVien, vaiTro)
          VALUES (@userId, 'TRUCK_DRIVER')
        `);

      // Thêm PhuongTien
      await pool.request()
        .input('userId', sql.Int, userId)
        .input('plate', sql.VarChar, d.plate)
        .input('type', sql.VarChar, d.type)
        .query(`
          INSERT INTO PhuongTien (bienSoXe, nhanHieu, tongSoGhe, loaiXe, maTaiXeChinh, trangThaiXe, phanLoaiXe)
          VALUES (@plate, 'Hino', 0, @type, @userId, 'san_sang', 'xe_tai')
        `);
    }

    console.log('Successfully added 6 truck drivers!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

resetTruckDrivers();
