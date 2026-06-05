const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8');

// 1. Map rawData
const targetMap = `date: item.ngayGui,
            images: item.hinhAnh || []`;
const replaceMap = `date: item.ngayGui,
            images: item.hinhAnh || [],
            rawBackendData: item`;
if(content.includes(targetMap)) {
    content = content.replace(targetMap, replaceMap);
    console.log('Added rawBackendData mapping');
}

// 2. Change buttons rendering
const targetButtons = `<button
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

const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const targetRegexStr = escapeRegex(targetButtons).replace(/\\n/g, '\n').replace(/\s+/g, '\\s+');
const targetRegex = new RegExp(targetRegexStr);

const replaceButtons = `{consignment.cargoStatus === 'confirmed' ? (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => {
                                navigate('/cargo-consignment', { 
                                  state: { 
                                    payNowData: consignment.rawBackendData
                                  } 
                                })
                              }}
                            >
                              <FiDollarSign size={14} className="me-1" />
                              Thanh toán ngay
                            </button>
                          ) : (
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
                            </button>
                          )}`;

if(targetRegex.test(content)) {
    content = content.replace(targetRegex, replaceButtons);
    fs.writeFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', content, 'utf8');
    console.log('Fixed buttons');
} else {
    console.log('Could not find buttons');
}
