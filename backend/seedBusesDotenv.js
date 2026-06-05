require('dotenv').config();
const sql = require('mssql');

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'
    }
};

async function insertTestBuses() {
  try {
    const pool = await sql.connect(dbConfig);

    // Get an employee to be driver
    const driverResult = await pool.request().query(`SELECT TOP 1 maNhanVien FROM NhanVien WHERE vaiTro = 'driver'`);
    const driverId = driverResult.recordset.length > 0 ? driverResult.recordset[0].maNhanVien : null;

    if (!driverId) {
      console.log('No driver found');
      return;
    }

    // Get a route
    const routeResult = await pool.request().query(`SELECT TOP 1 maTuyenDuong, diemDi, diemDen FROM TuyenDuong`);
    const route = routeResult.recordset.length > 0 ? routeResult.recordset[0] : null;

    if (!route) {
      console.log('No route found');
      return;
    }

    // Insert trip 1
    await pool.request()
      .input('maTuyenDuong', sql.Int, route.maTuyenDuong)
      .input('maNhanVien', sql.Int, driverId)
      .input('bienSoXe', sql.VarChar, '51B-123.45')
      .input('thoiGianDi', sql.DateTime, new Date(Date.now() + 86400000)) // Tomorrow
      .input('thoiGianDenDutKien', sql.DateTime, new Date(Date.now() + 86400000 + 3600000 * 2))
      .input('giaVe', sql.Decimal, 150000)
      .query(`
        INSERT INTO ChuyenXe (maTuyenDuong, maNhanVien, bienSoXe, thoiGianDi, thoiGianDenDutKien, soGheTrong, tongSoGhe, trangThai, giaVe)
        VALUES (@maTuyenDuong, @maNhanVien, @bienSoXe, @thoiGianDi, @thoiGianDenDutKien, 40, 40, 'da_len_lich', @giaVe)
      `);

    // Insert trip 2
    await pool.request()
      .input('maTuyenDuong', sql.Int, route.maTuyenDuong)
      .input('maNhanVien', sql.Int, driverId)
      .input('bienSoXe', sql.VarChar, '51B-987.65')
      .input('thoiGianDi', sql.DateTime, new Date(Date.now() - 86400000)) // Yesterday
      .input('thoiGianDenDutKien', sql.DateTime, new Date(Date.now() - 86400000 + 3600000 * 2))
      .input('giaVe', sql.Decimal, 150000)
      .query(`
        INSERT INTO ChuyenXe (maTuyenDuong, maNhanVien, bienSoXe, thoiGianDi, thoiGianDenDutKien, soGheTrong, tongSoGhe, trangThai, giaVe)
        VALUES (@maTuyenDuong, @maNhanVien, @bienSoXe, @thoiGianDi, @thoiGianDenDutKien, 35, 40, 'da_hoan_thanh', @giaVe)
      `);

    console.log('Successfully added 2 test bus trips');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

insertTestBuses();
