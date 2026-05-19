const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: false, // For local dev
    trustServerCertificate: true,
  },
};

const connectDB = async () => {
  try {
    const pool = await sql.connect(config);
    console.log('✅ MSSQL Connected...');
    return pool;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = {
  sql,
  connectDB
};
