const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8');

const target = `                        <div className="action-buttons" style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => openConsignmentDetailModal(consignment)}
                          >
                            <FiPackage size={14} className="me-1" />
                            Xem chi tiết
                          </button>
                        </div>`;

const replacement = `                        <div className="action-buttons" style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
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
                                    loaiDichVu: 'van_tai', // Default
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
                            Đặt lại
                          </button>
                        </div>`;

content = content.replace(target, replacement);

fs.writeFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', content, 'utf8');
console.log('Added Reorder button');
