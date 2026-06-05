const sql = require('mssql');
const dbConfig = { user: 'sa', password: '160505', database: 'BusGoDBs', server: 'localhost', options: { encrypt: false, trustServerCertificate: true } };
sql.connect(dbConfig).then(async pool => {
  const result = await pool.request().query("SELECT * FROM NguoiDung nd INNER JOIN NhanVien nv ON nd.maNguoiDung = nv.maNhanVien WHERE tenNguoiDung LIKE N'%Hoàng Hữu%'");
  console.log(result.recordset);
  process.exit();
}).catch(console.error);
