require('dotenv').config();
const { connectDB } = require('./config/db');

async function checkDb() {
  try {
    let pool = await connectDB();
    let result = await pool.request().query("EXEC sp_helptext 'sp_TimKyGuiHang'");
    console.log(result.recordset.map(r => r.Text).join(''));
    pool.close();
  } catch (err) {
    console.error(err);
  }
}
checkDb();
