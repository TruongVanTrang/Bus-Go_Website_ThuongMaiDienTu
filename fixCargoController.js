const fs = require('fs');
let content = fs.readFileSync('backend/controllers/cargoController.js', 'utf8');

const targetStr = `          UPDATE KyGuiHang
          SET trangThaiKyGui = @trangThaiKyGui,
              maTaiXePhuTrach = @maTaiXe,
              thongTinTaiXe = @driverInfo,
              viTriHienTai = @viTriHienTai,
              ngayCapNhat = GETDATE()
          WHERE consignmentId = @consignmentId`;

const replacementStr = `          UPDATE KyGuiHang
          SET trangThaiKyGui = @trangThaiKyGui,
              maTaiXe = @maTaiXe,
              driverInfo = @driverInfo,
              viTriHienTai = @viTriHienTai,
              ngayCapNhat = GETDATE()
          WHERE consignmentId = @consignmentId`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('backend/controllers/cargoController.js', content, 'utf8');
  console.log('Fixed cargoController.js correctly.');
} else {
  console.log('Target string not found in cargoController.js.');
}
