const sql = require('mssql');

const config = {
    user: 'sa',
    password: '160505',
    server: 'localhost',
    database: 'BusGoDBs',
    options: {
        encrypt: true,
        trustServerCertificate: true // Fix for self-signed certs
    }
};

async function queryDB() {
    try {
        await sql.connect(config);
        const result = await sql.query(`
            SELECT TOP 10 consignmentId, maChuyenXe, loaiDichVu, trangThaiKyGui, maTaiXe 
            FROM KyGuiHang 
            WHERE consignmentId LIKE '%0583%' ORDER BY ngayCapNhat DESC
        `);
        console.log("KyGuiHang recent records:", result.recordset);

        const trips = await sql.query(`
            SELECT cx.maChuyenXe, cx.maTuyenDuong, pt.bienSoXe, td.diemDi, td.diemDen, cx.thoiGianDi 
            FROM ChuyenXe cx
            JOIN TuyenDuong td ON cx.maTuyenDuong = td.maTuyenDuong
            JOIN PhuongTien pt ON cx.maPhuongTien = pt.maPhuongTien
            WHERE td.diemDi = N'Đà Nẵng' AND td.diemDen = N'Huế'
        `);
        console.log("Relevant Trips:", trips.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

queryDB();
