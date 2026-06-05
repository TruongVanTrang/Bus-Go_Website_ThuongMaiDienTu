const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8');

const target1 = `            cargoStatus: mappedStatus,
            date: item.ngayGui,
            images: item.hinhAnh || []`;

const replacement1 = `            cargoStatus: mappedStatus,
            date: item.ngayGui,
            images: item.hinhAnh || [],
            driverInfo: item.driverInfo || (item.maTaiXe ? 'ID Tài xế: ' + item.maTaiXe : null),
            isEdited: item.isEdited,
            loaiDichVu: item.loaiDichVu,
            maChuyenXe: item.maChuyenXe,
            loaiXeVanTai: item.loaiXeVanTai,
            diaChiGuiChiTiet: item.diaChiGuiChiTiet,
            diaChiNhanChiTiet: item.diaChiNhanChiTiet,
            soCCCD: item.soCCCD,
            emailNguoiGui: item.emailNguoiGui,
            soLuong: item.soLuong,
            chieKySo: item.chieKySo`;

content = content.replace(target1, replacement1);
fs.writeFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', content, 'utf8');
console.log('Injected driverInfo mapping and all fields needed for Edit');
