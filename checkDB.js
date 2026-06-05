const { connectDB } = require('./backend/config/db');
const sql = require('mssql');

async function checkDB() {
  const pool = await connectDB();
  const res = await pool.request().query('SELECT consignmentId, hinhAnh FROM KyGuiHang');
  console.log(res.recordset);
  process.exit(0);
}

checkDB();
