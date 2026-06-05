require('dotenv').config();
const { connectDB } = require('./config/db.js');

async function run() {
  const pool = await connectDB();
  await pool.request().query(`
    ALTER PROCEDURE sp_TimKyGuiHang
        @maKhachHang INT
    AS
    BEGIN
        SELECT 
            kg.maKyGui,
            kg.consignmentId,
            kg.loaiDichVu,
            kg.diemGui,
            kg.diemNhan,
            kg.ngayGui,
            kg.diaChiGuiChiTiet,
            kg.diaChiNhanChiTiet,
            kg.tenNguoiGui,
            kg.soDienThoaiNguoiGui,
            kg.soCCCD,
            kg.emailNguoiGui,
            kg.tenNguoiNhan,
            kg.soDienThoaiNguoiNhan,
            kg.trangThaiKyGui,
            kg.trangThaiThanhToan,
            kg.yeuCauHuy,
            kg.isEdited,
            kg.khachDaChinhSua,
            kg.soLuong,
            kg.trongLuong,
            kg.loaiHangHoa,
            kg.maChuyenXe,
            kg.loaiXeVanTai,
            kg.maTaiXe,
            kg.driverInfo,
            kg.giaCuoc,
            kg.giaTrucDeclare,
            kg.giaBAO_HIEM,
            kg.tongTien,
            kg.viTriHienTai,
            kg.chieKySo,
            kg.hinhAnh,
            kg.ngayTao,
            kg.ngayCapNhat
        FROM KyGuiHang kg
        WHERE kg.maKhachHang = @maKhachHang
        ORDER BY kg.ngayCapNhat DESC;
    END;
  `);
  console.log('Altered sp_TimKyGuiHang');
  process.exit(0);
}
run();
