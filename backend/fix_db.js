const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: 'localhost',
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

(async () => {
  try {
    const pool = await sql.connect(config);
    console.log('Connected to DB. Running ALTER TABLE...');

    const queries = [
      "ALTER TABLE KyGuiHang ADD loaiDichVu NVARCHAR(50);",
      "ALTER TABLE KyGuiHang ADD diemGui NVARCHAR(255);",
      "ALTER TABLE KyGuiHang ADD diemNhan NVARCHAR(255);",
      "ALTER TABLE KyGuiHang ADD ngayGui DATE;",
      "ALTER TABLE KyGuiHang ADD diaChiGuiChiTiet NVARCHAR(MAX);",
      "ALTER TABLE KyGuiHang ADD diaChiNhanChiTiet NVARCHAR(MAX);",
      "ALTER TABLE KyGuiHang ADD soCCCD VARCHAR(50);",
      "ALTER TABLE KyGuiHang ADD emailNguoiGui VARCHAR(100);",
      "ALTER TABLE KyGuiHang ADD trangThaiThanhToan NVARCHAR(50) DEFAULT 'cho_thanh_toan';",
      "ALTER TABLE KyGuiHang ADD soLuong INT DEFAULT 1;",
      "ALTER TABLE KyGuiHang ADD trongLuong FLOAT DEFAULT 1;",
      "ALTER TABLE KyGuiHang ADD loaiHangHoa NVARCHAR(100);",
      "ALTER TABLE KyGuiHang ADD maChuyenXe INT;",
      "ALTER TABLE KyGuiHang ADD loaiXeVanTai VARCHAR(50);",
      "ALTER TABLE KyGuiHang ADD giaCuoc DECIMAL(18,2) DEFAULT 0;",
      "ALTER TABLE KyGuiHang ADD tongTien DECIMAL(18,2) DEFAULT 0;",
      "ALTER TABLE KyGuiHang ADD hinhAnh NVARCHAR(MAX);",
      "ALTER TABLE KyGuiHang ADD maTaiXe INT;",
      "ALTER TABLE KyGuiHang ADD driverInfo NVARCHAR(MAX);",
      "ALTER TABLE KyGuiHang ADD yeuCauHuy NVARCHAR(50);",
      "ALTER TABLE KyGuiHang ADD lyDoHuy NVARCHAR(MAX);"
    ];

    for (const q of queries) {
      try {
        await pool.request().query(q);
        console.log('Executed:', q);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log('Column already exists, skipping:', q);
        } else {
          console.error('Error on query:', q, err.message);
        }
      }
    }

    console.log('Database updated successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Connection failed:', error);
    process.exit(1);
  }
})();
