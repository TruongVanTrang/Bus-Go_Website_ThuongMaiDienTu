require('dotenv').config();
const sql = require('mssql');
const config = require('./config/dbConfig'); // wait, the error was dbConfig not found. I'll use raw config here.

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  }
};

async function check() {
  try {
    await sql.connect(dbConfig);
    const result = await sql.query('SELECT TOP 5 consignmentId, hinhAnh FROM KyGuiHang ORDER BY ngayCapNhat DESC');
    console.log(JSON.stringify(result.recordset, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
check();
