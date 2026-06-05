require('dotenv').config();
const { connectDB } = require('./config/db');

async function checkDb() {
  try {
    let pool = await connectDB();
    let result = await pool.request().query("EXEC sp_TimKyGuiHang @maKhachHang = 1");
    if(result.recordset.length > 0) {
      console.log(Object.keys(result.recordset[0]));
    } else {
      let result2 = await pool.request().query("SELECT TOP 1 * FROM KyGuiHang");
      console.log("SELECT keys:", Object.keys(result2.recordset[0]));
    }
    pool.close();
  } catch (err) {
    console.error(err);
  }
}
checkDb();
