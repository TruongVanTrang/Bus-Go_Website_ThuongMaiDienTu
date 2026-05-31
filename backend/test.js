const { sql, connectDB } = require('./config/db');

async function test() {
  const pool = await connectDB();
  console.log('connected');
  
  try {
    await pool.request().query(`
      DECLARE @ExpiredTickets TABLE (maVe INT, maGhe INT);

      INSERT INTO @ExpiredTickets (maVe, maGhe)
      SELECT maVe, maGhe FROM VeDienTu 
      WHERE trangThaiVe = 'da_dat' AND DATEDIFF(minute, ngayDatVe, GETDATE()) >= 5;

      IF EXISTS (SELECT 1 FROM @ExpiredTickets)
      BEGIN
        UPDATE VeDienTu 
        SET trangThaiVe = 'da_huy' 
        WHERE maVe IN (SELECT maVe FROM @ExpiredTickets);

        UPDATE GheNgoi 
        SET trangThaiGhe = 'trong' 
        WHERE maGhe IN (SELECT maGhe FROM @ExpiredTickets WHERE maGhe IS NOT NULL);
      END
    `);
    console.log('Query OK');
  } catch (err) {
    console.error(err);
  }
  process.exit();
}

test();
