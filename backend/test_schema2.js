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

async function testSchema() {
  const pool = await sql.connect(config);
  try {
    const result = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ChuyenXe'");
    console.log(result.recordset.map(r => r.COLUMN_NAME));
  } catch(e) { console.error(e); }
  process.exit();
}
testSchema();
