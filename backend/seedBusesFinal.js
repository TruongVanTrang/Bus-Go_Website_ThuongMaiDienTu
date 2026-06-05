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
    const routeResult = await pool.request().query(`SELECT TOP 1 maTuyenDuong FROM TuyenDuong`);
    const route = routeResult.recordset.length > 0 ? routeResult.recordset[0] : null;

    if (!route) {
      console.log('No route found');
      return;
    }

    // Get a vehicle
    const vehicleResult = await pool.request().query(`SELECT TOP 1 maPhuongTien, tongSoGhe FROM PhuongTien`);
    const vehicle = vehicleResult.recordset.length > 0 ? vehicleResult.recordset[0] : null;

    if (!vehicle) {
      console.log('No vehicle found');
      return;
    }

    // Insert trip 1
    await pool.request()
      .input('maTuyenDuong', sql.Int, route.maTuyenDuong)
      .input('maPhuongTien', sql.Int, vehicle.maPhuongTien)
      .input('maNhanVien', sql.Int, driverId)
      .input('thoiGianDi', sql.DateTime, new Date(Date.now() + 86400000)) // Tomorrow
      .input('thoiGianDen', sql.DateTime, new Date(Date.now() + 86400000 + 3600000 * 2))
      .input('giaCoBan', sql.Decimal, 150000)
      .input('soGheConTrong', sql.Int, vehicle.tongSoGhe)
      .input('soLuongGheDat', sql.Int, 0)
      .input('trangThaiChuyen', sql.VarChar, 'pending')
      .query(`
        INSERT INTO ChuyenXe (maTuyenDuong, maPhuongTien, maNhanVien, thoiGianDi, thoiGianDen, giaCoBan, soGheConTrong, soLuongGheDat, trangThaiChuyen, ngayTao)
        VALUES (@maTuyenDuong, @maPhuongTien, @maNhanVien, @thoiGianDi, @thoiGianDen, @giaCoBan, @soGheConTrong, @soLuongGheDat, @trangThaiChuyen, GETDATE())
      `);

    // Insert trip 2
    await pool.request()
      .input('maTuyenDuong', sql.Int, route.maTuyenDuong)
      .input('maPhuongTien', sql.Int, vehicle.maPhuongTien)
      .input('maNhanVien', sql.Int, driverId)
      .input('thoiGianDi', sql.DateTime, new Date(Date.now() - 86400000)) // Yesterday
      .input('thoiGianDen', sql.DateTime, new Date(Date.now() - 86400000 + 3600000 * 2))
      .input('giaCoBan', sql.Decimal, 150000)
      .input('soGheConTrong', sql.Int, vehicle.tongSoGhe)
      .input('soLuongGheDat', sql.Int, 0)
      .input('trangThaiChuyen', sql.VarChar, 'completed')
      .query(`
        INSERT INTO ChuyenXe (maTuyenDuong, maPhuongTien, maNhanVien, thoiGianDi, thoiGianDen, giaCoBan, soGheConTrong, soLuongGheDat, trangThaiChuyen, ngayTao)
        VALUES (@maTuyenDuong, @maPhuongTien, @maNhanVien, @thoiGianDi, @thoiGianDen, @giaCoBan, @soGheConTrong, @soLuongGheDat, @trangThaiChuyen, GETDATE())
      `);

    console.log('Successfully added 2 test bus trips');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

insertTestBuses();
