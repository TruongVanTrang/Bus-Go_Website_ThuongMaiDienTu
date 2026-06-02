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

async function test() {
  try {
    const pool = await sql.connect(config);
    const dbId = 'CSM1780407561003';
    
    const checkRes = await pool.request()
      .input('consignmentId', sql.VarChar, dbId)
      .query('SELECT hinhAnh FROM KyGuiHang WHERE consignmentId = @consignmentId');
    console.log(checkRes.recordset);
  } catch(e) {
    console.error(e);
  }
  process.exit();
}
test();
