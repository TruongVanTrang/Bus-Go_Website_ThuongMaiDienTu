require('dotenv').config();
const sql = require('mssql');

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: true
    }
};

async function check() {
  const pool = await sql.connect(dbConfig);
  const result1 = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'PhuongTien'");
  console.log('PhuongTien columns:');
  console.dir(result1.recordset.map(r => r.COLUMN_NAME));
  
  const result2 = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ChuyenXe'");
  console.log('ChuyenXe columns:');
  console.dir(result2.recordset.map(r => r.COLUMN_NAME));
  process.exit(0);
}
check();
