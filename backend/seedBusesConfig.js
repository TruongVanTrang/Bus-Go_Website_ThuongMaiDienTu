const db = require('./config/db');
const sql = require('mssql');

async function run() {
  const pool = await db.sql.connect(db.config);
  
  // Get an employee to be driver
  const driverResult = await pool.request().query(`SELECT TOP 1 maNhanVien FROM NhanVien WHERE vaiTro = 'driver'`);
  const driverId = driverResult.recordset.length > 0 ? driverResult.recordset[0].maNhanVien : null;

  // Get a route
  const routeResult = await pool.request().query(`SELECT TOP 1 maTuyenDuong, diemDi, diemDen FROM TuyenDuong`);
  const route = routeResult.recordset.length > 0 ? routeResult.recordset[0] : null;

  if (driverId && route) {
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
    console.log('Added bus trip');
  } else {
    console.log('Driver or Route missing');
  }
  process.exit(0);
}
run().catch(console.error);
