const fs = require('fs');
let lines = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8').split('\n');
lines.splice(102, 0, `            declaredValue: item.giaTrucDeclare,
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
    }`);
fs.writeFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', lines.join('\n'), 'utf8');
console.log('Fixed');
