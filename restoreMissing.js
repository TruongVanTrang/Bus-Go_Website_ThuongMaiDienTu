const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8');

const targetStr = `            weight: item.trongLuong,
    loadConsignments()
  }, [navigate])`;

const restoreStr = `            weight: item.trongLuong,
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
    
    loadConsignments()
  }, [navigate])`;

content = content.replace(targetStr, restoreStr);
fs.writeFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', content, 'utf8');
console.log('Restored');
