const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8');

// 1. Fix status map
content = content.replace(/'delivered': \{ \.\.\.baseStyle, backgroundColor: '#10b981', text: 'Đã giao', icon: FiCheckCircle \}/g, 
`'delivered': { ...baseStyle, backgroundColor: '#10b981', text: 'Đã giao', icon: FiCheckCircle },
      'cancelled': { ...baseStyle, backgroundColor: '#ef4444', text: 'Đã hủy', icon: FiX }`);

// 2. Add Reorder button
const targetButton = `<button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => openConsignmentDetailModal(consignment)}
                          >
                            <FiPackage size={14} className="me-1" />
                            Xem chi tiết
                          </button>`;
const replaceButton = `<button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => openConsignmentDetailModal(consignment)}
                          >
                            <FiPackage size={14} className="me-1" />
                            Xem chi tiết
                          </button>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              navigate('/cargo-consignment', { 
                                state: { 
                                  reorderData: {
                                    loaiDichVu: 'van_tai',
                                    diemGui: consignment.from,
                                    diemNhan: consignment.to,
                                    tenNguoiGui: consignment.senderName,
                                    soDienThoaiNguoiGui: consignment.senderPhone,
                                    tenNguoiNhan: consignment.receiverName,
                                    soDienThoaiNguoiNhan: consignment.receiverPhone,
                                    loaiHangHoa: consignment.type,
                                    trongLuong: consignment.weight,
                                    giaTriKhaiGia: consignment.declaredValue,
                                  } 
                                } 
                              })
                            }}
                          >
                            <FiRefreshCw size={14} className="me-1" />
                            Đặt lại
                          </button>`;

// Normalize newlines to match safely
const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const targetRegexStr = escapeRegex(targetButton).replace(/\\n/g, '\\n').replace(/\s+/g, '\\s+');
const targetRegex = new RegExp(targetRegexStr);

if (targetRegex.test(content)) {
    content = content.replace(targetRegex, replaceButton);
    console.log('Successfully replaced button');
} else {
    console.log('Could not find button target');
}

fs.writeFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', content, 'utf8');
console.log('Done script');
