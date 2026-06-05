require('dotenv').config();
const { connectDB } = require('./config/db');

async function checkDb() {
  try {
    let pool = await connectDB();
    let result = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'KyGuiHang' AND COLUMN_NAME = 'trangThaiThanhToan'");
    console.log(result.recordset);
    pool.close();
  } catch (err) {
    console.error(err);
  }
}
checkDb();
