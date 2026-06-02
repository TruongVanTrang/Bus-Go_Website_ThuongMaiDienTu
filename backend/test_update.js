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
    const status = 'SHIPPING';
    const dbStatus = 'in_transit';
    
    let hinhAnhStr = undefined;
    const imageUrl = 'https://example.com/pickup.jpg';

    const checkRes = await pool.request()
      .input('consignmentId', sql.VarChar, dbId)
      .query('SELECT hinhAnh FROM KyGuiHang WHERE consignmentId = @consignmentId');
      
    if (checkRes.recordset.length > 0) {
      let hinhAnhArr = [];
      try {
        hinhAnhArr = JSON.parse(checkRes.recordset[0].hinhAnh || '[]');
      } catch (e) {
        hinhAnhArr = [];
      }
      hinhAnhArr.push(imageUrl);
      hinhAnhStr = JSON.stringify(hinhAnhArr);
      console.log('New hinhAnhStr:', hinhAnhStr);
    }
    
    await pool.request()
      .input('consignmentId', sql.VarChar, dbId)
      .input('status', sql.NVarChar, dbStatus)
      .input('hinhAnh', sql.NVarChar, hinhAnhStr)
      .query(
        UPDATE KyGuiHang
        SET trangThaiKyGui = @status,
            hinhAnh = @hinhAnh,
            ngayCapNhat = GETDATE()
        WHERE consignmentId = @consignmentId
      );
      
    console.log('Update success');
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
test();
