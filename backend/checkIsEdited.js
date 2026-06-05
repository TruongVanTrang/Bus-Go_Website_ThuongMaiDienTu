require('dotenv').config();
const { connectDB } = require('./config/db.js');

async function run() {
  const pool = await connectDB();
  const res = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'KyGuiHang' AND COLUMN_NAME = 'isEdited'");
  console.log('isEdited exists:', res.recordset.length > 0);
  process.exit(0);
}
run();
