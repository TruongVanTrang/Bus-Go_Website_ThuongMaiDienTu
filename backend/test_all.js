const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function testAll() {
  const pool = await sql.connect(config);
  try {
    const driverId = 1;
    await pool.request().input('driverId', sql.Int, driverId).query('SELECT * FROM ChuyenXe WHERE maTaiXe = @driverId');
    console.log('getDriverTrips: OK');
  } catch(e) { console.error('getDriverTrips ERROR:', e.message); }

  try {
    const tripId = 1;
    await pool.request().input('tripId', sql.Int, tripId).query('SELECT v.*, g.soGhe FROM VeDienTu v INNER JOIN GheNgoi g ON v.maGhe = g.maGhe WHERE v.maChuyenXe = @tripId');
    console.log('getTripPassengers: OK');
  } catch(e) { console.error('getTripPassengers ERROR:', e.message); }

  try {
    const tripId = 1;
    await pool.request().input('tripId', sql.Int, tripId).query('SELECT * FROM HangHoa WHERE maChuyenXe = @tripId');
    await pool.request().input('tripId', sql.Int, tripId).query('SELECT k.*, h.hinhAnh as hinhAnhHangHoa FROM KyGuiHang k LEFT JOIN HangHoa h ON k.maHangHoa = h.maHangHoa WHERE k.maChuyenXe = @tripId');
    console.log('getTripCargo: OK');
  } catch(e) { console.error('getTripCargo ERROR:', e.message); }
  
  process.exit();
}
testAll();
