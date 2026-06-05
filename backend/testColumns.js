const { sql, connectDB } = require('./config/db');
require('dotenv').config();

async function test() {
  try {
    const pool = await connectDB();
    const result = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'KyGuiHang'");
    console.log("Columns of KyGuiHang:", result.recordset.map(r => r.COLUMN_NAME));
  } catch (err) {
    console.error("❌ DB Error:", err);
  } finally {
    process.exit(0);
  }
}

test();
