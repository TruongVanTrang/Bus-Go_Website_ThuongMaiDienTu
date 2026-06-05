require('dotenv').config();
const sql = require('mssql');

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: true
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

    // Get a vehicle
    const vehicleResult = await pool.request().query(`SELECT TOP 1 bienSoXe, tongSoGhe FROM XeBus`);
    const vehicle = vehicleResult.recordset.length > 0 ? vehicleResult.recordset[0] : null;

    if (!vehicle) {
      console.log('No vehicle found');
      return;
    }

    // Insert trip 1
    await pool.request()
      .input('maTuyenDuong', sql.Int, route.maTuyenDuong)
      .input('maNhanVien', sql.Int, driverId)
      .input('bienSoXe', sql.VarChar, vehicle.bienSoXe)
      .input('thoiGianDi', sql.DateTime, new Date(Date.now() + 86400000)) // Tomorrow
      .input('thoiGianDenDutKien', sql.DateTime, new Date(Date.now() + 86400000 + 3600000 * 2))
      .input('giaVe', sql.Decimal, 150000)
      .input('soGheTrong', sql.Int, vehicle.tongSoGhe)
      .input('tongSoGhe', sql.Int, vehicle.tongSoGhe)
      .query(`
        INSERT INTO ChuyenXe (maTuyenDuong, maNhanVien, bienSoXe, thoiGianDi, thoiGianDenDutKien, soGheTrong, tongSoGhe, trangThai, giaVe)
        VALUES (@maTuyenDuong, @maNhanVien, @bienSoXe, @thoiGianDi, @thoiGianDenDutKien, @soGheTrong, @tongSoGhe, 'da_len_lich', @giaVe)
      `);

    // Insert trip 2
    await pool.request()
      .input('maTuyenDuong', sql.Int, route.maTuyenDuong)
      .input('maNhanVien', sql.Int, driverId)
      .input('bienSoXe', sql.VarChar, vehicle.bienSoXe)
      .input('thoiGianDi', sql.DateTime, new Date(Date.now() + 86400000 * 2)) // Day after tomorrow
      .input('thoiGianDenDutKien', sql.DateTime, new Date(Date.now() + 86400000 * 2 + 3600000 * 2))
      .input('giaVe', sql.Decimal, 150000)
      .input('soGheTrong', sql.Int, vehicle.tongSoGhe)
      .input('tongSoGhe', sql.Int, vehicle.tongSoGhe)
      .query(`
        INSERT INTO ChuyenXe (maTuyenDuong, maNhanVien, bienSoXe, thoiGianDi, thoiGianDenDutKien, soGheTrong, tongSoGhe, trangThai, giaVe)
        VALUES (@maTuyenDuong, @maNhanVien, @bienSoXe, @thoiGianDi, @thoiGianDenDutKien, @soGheTrong, @tongSoGhe, 'da_len_lich', @giaVe)
      `);

    console.log('Successfully added 2 test bus trips');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

insertTestBuses();
