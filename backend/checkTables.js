require('dotenv').config();
const { connectDB } = require('./config/db');

async function checkDb() {
  try {
    let pool = await connectDB();
    let result = await pool.request().query("SELECT table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE'");
    console.log(result.recordset);
    pool.close();
  } catch (err) {
    console.error(err);
  }
}
checkDb();
