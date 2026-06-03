const sql = require('mssql');
const dbConfig = { user: 'sa', password: '160505', database: 'BusGoDBs', server: 'localhost', options: { encrypt: false, trustServerCertificate: true } };
sql.connect(dbConfig).then(async pool => {
  try {
    await pool.request().query(`
      CREATE TABLE NhatKyHanhTrinh (
          maNhatKy INT IDENTITY(1,1) PRIMARY KEY,
          maChuyenXe INT NOT NULL FOREIGN KEY REFERENCES ChuyenXe(maChuyenXe),
          kieuCapNhat NVARCHAR(50) NOT NULL,
          thoiGian DATETIME DEFAULT GETDATE(),
          viTri NVARCHAR(255) NOT NULL,
          soKm INT NOT NULL,
          tinhTrangXe NVARCHAR(255),
          anhMinhChung NVARCHAR(MAX),
          anhXeSauChuyen NVARCHAR(MAX),
          ghiChu NVARCHAR(MAX)
      );
    `);
    console.log('Table NhatKyHanhTrinh created');
  } catch(e) {
    console.error(e.message);
  }
  process.exit();
}).catch(console.error);
