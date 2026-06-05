require('dotenv').config();
const { connectDB } = require('./config/db');

async function checkDb() {
  const pool = await connectDB();
  const result = await pool.request().query("SELECT maKhachHang FROM KyGuiHang WHERE consignmentId = 'CSM1780671061076'");
  console.log(result.recordset);
  pool.close();
}
checkDb();
