const sql = require('mssql');
const dbConfig = { user: 'sa', password: '160505', database: 'BusGoDBs', server: 'localhost', options: { encrypt: false, trustServerCertificate: true } };
sql.connect(dbConfig).then(async pool => {
  const roles = await pool.request().query('SELECT DISTINCT vaiTro FROM NhanVien');
  console.log(roles.recordset);
  process.exit();
}).catch(console.error);
