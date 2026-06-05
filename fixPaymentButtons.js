const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8');

const targetButtons = `{consignment.cargoStatus === 'confirmed' ? (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => {
                                setPaymentConsignment(consignment)
                                setShowPaymentModal(true)
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

const replaceButtons = `{(consignment.cargoStatus === 'confirmed' || consignment.cargoStatus === 'in_transit') && consignment.rawBackendData?.trangThaiThanhToan === 'paid' ? (
                            <button
                              className="btn btn-success btn-sm"
                              disabled
                              style={{ opacity: 0.7 }}
                            >
                              <FiCheckCircle size={14} className="me-1" />
                              Đã thanh toán
                            </button>
                          ) : consignment.cargoStatus === 'confirmed' && consignment.rawBackendData?.trangThaiThanhToan !== 'paid' ? (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => {
                                setPaymentConsignment(consignment)
                                setShowPaymentModal(true)
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

const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const targetRegexStr = escapeRegex(targetButtons).replace(/\\n/g, '\n').replace(/\s+/g, '\\s+');
const targetRegex = new RegExp(targetRegexStr);

if(targetRegex.test(content)) {
    content = content.replace(targetRegex, replaceButtons);
    fs.writeFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', content, 'utf8');
    console.log('Fixed buttons');
} else {
    console.log('Could not find buttons');
}
