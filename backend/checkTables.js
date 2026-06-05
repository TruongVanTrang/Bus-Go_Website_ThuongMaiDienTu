require('dotenv').config();
const sql = require('mssql');

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'
    }
};

async function check() {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request().query("SELECT table_name FROM information_schema.tables WHERE table_type = 'base table'");
  console.dir(result.recordset.map(r => r.table_name));
  process.exit(0);
}
check();
