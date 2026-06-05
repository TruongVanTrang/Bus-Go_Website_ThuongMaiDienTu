const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8');

const targetStr = `            to: item.diemNhan,
            type: item.loaiHangHoa,
            weight: item.trongLuong,
    loadConsignments()`;

const restoreStr = `            to: item.diemNhan,
            type: item.loaiHangHoa,
            weight: item.trongLuong,
            declaredValue: item.giaTrucDeclare,
            totalPrice: item.tongTien,
            senderName: item.tenNguoiGui,
            senderPhone: item.soDienThoaiNguoiGui,
            receiverName: item.tenNguoiNhan,
            receiverPhone: item.soDienThoaiNguoiNhan,
            cargoStatus: mappedStatus,
            date: item.ngayGui,
            images: item.hinhAnh || [],
            rawBackendData: item
          }
        })
        setConsignments(mappedConsignments)
      } catch (err) {
        console.error('Lỗi khi tải lịch sử ký gửi:', err)
      }
    }

    loadConsignments()`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, restoreStr);
  fs.writeFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', content, 'utf8');
  console.log('Restored correctly');
} else {
  console.log('Target not found');
}
