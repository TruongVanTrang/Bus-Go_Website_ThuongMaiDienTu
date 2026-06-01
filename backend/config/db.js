const sql = require('mssql');
require('dotenv').config();

let serverName = process.env.DB_SERVER;
let instanceName = undefined;

if (serverName && serverName.includes('\\')) {
  const parts = serverName.split('\\');
  serverName = parts[0];
  instanceName = parts[1];
}

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: serverName,
  database: process.env.DB_NAME,
  options: {
    encrypt: false, // For local dev
    trustServerCertificate: true,
    instanceName: instanceName
  },
};

const connectDB = async () => {
  try {
    const pool = await sql.connect(config);
    console.log('✅ Kết nối Database thành công!');
    return pool;
  } catch (err) {
    console.error('❌ Kết nối Database thất bại:', err.message);
    process.exit(1);
  }
};

module.exports = {
  sql,
  connectDB
};
