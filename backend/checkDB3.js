require('dotenv').config();
const { connectDB } = require('./config/db');

async function checkDb() {
  try {
    let pool = await connectDB();
    let result = await pool.request().query("SELECT consignmentId, trangThaiKyGui, trangThaiThanhToan FROM KyGuiHang WHERE consignmentId = 'CSM1780671061076'");
    console.log(result.recordset);
    pool.close();
  } catch (err) {
    console.error(err);
  }
}
checkDb();
