require('dotenv').config();
const { connectDB } = require('./config/db.js');

async function updateDB() {
    try {
        let pool = await connectDB();
        
        try {
            await pool.request().query(`
                IF NOT EXISTS (
                    SELECT * FROM sys.columns 
                    WHERE object_id = OBJECT_ID(N'[dbo].[KyGuiHang]') AND name = 'khachDaChinhSua'
                )
                BEGIN
                    ALTER TABLE KyGuiHang ADD khachDaChinhSua BIT DEFAULT 0;
                END
            `);
            console.log('Added khachDaChinhSua column.');
        } catch(e) {
            console.log('Error adding column:', e.message);
        }

        try {
            await pool.request().query(`
                INSERT INTO ChuyenXe (maTuyenDuong, maPhuongTien, maNhanVien, thoiGianDi, thoiGianDen, giaCoBan, soGheConTrong, soLuongGheDat, trangThaiChuyen)
                VALUES 
                (1, 1, 1, DATEADD(day, 1, GETDATE()), DATEADD(day, 1, DATEADD(hour, 5, GETDATE())), 150000, 40, 0, 'da_len_lich'),
                (2, 2, 2, DATEADD(day, 2, GETDATE()), DATEADD(day, 2, DATEADD(hour, 6, GETDATE())), 200000, 35, 5, 'da_len_lich'),
                (3, 3, 3, DATEADD(day, 3, GETDATE()), DATEADD(day, 3, DATEADD(hour, 8, GETDATE())), 250000, 40, 0, 'da_len_lich')
            `);
            console.log('Inserted dummy Bus trips.');
        } catch(e) {
            console.log('Error inserting trips:', e.message);
        }

        process.exit(0);
    } catch (err) {
        console.error('DB Error:', err);
    }
}

updateDB();
