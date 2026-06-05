const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8');

// 1. Grid layout
content = content.replace(
  '<div className="consignments-list">',
  '<div className="consignments-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">'
);

content = content.replace(
  /marginBottom: '1rem' }}/g,
  `}}`
);

// 2. Fix payment prices
const searchPayment = `                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Phí gửi hàng hóa</span>
                    <span className="fw-600">0đ</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Phí bảo hiểm (2%)</span>
                    <span className="fw-600">0đ</span>
                  </div>`;

const replacePayment = `                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Phí gửi hàng hóa</span>
                    <span className="fw-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedConsignment.giaCuoc || 0)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Phí bảo hiểm (2%)</span>
                    <span className="fw-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedConsignment.giaBAO_HIEM || 0)}</span>
                  </div>`;

content = content.replace(searchPayment, replacePayment);

// 3. Add Driver info in the modal
const searchSender = `                <div className="mb-4">
                  <h6 className="fw-bold mb-3">👤 Thông Tin Người Gửi & Nhận</h6>`;
const replaceDriverInfo = `                {selectedConsignment.driverInfo && (
                  <div className="mb-4">
                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                      <FiTruck className="text-primary" /> Thông Tin Tài Xế & Xe
                    </h6>
                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100" style={{ backgroundColor: '#eff6ff', borderColor: '#dbeafe', borderRadius: '0.75rem', padding: '1rem' }}>
                      <p className="mb-0 text-blue-900 fw-medium" style={{ color: '#1e3a8a', fontWeight: '500' }}>{selectedConsignment.driverInfo}</p>
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <h6 className="fw-bold mb-3">👤 Thông Tin Người Gửi & Nhận</h6>`;

content = content.replace(searchSender, replaceDriverInfo);

// 4. Update Images
const searchImg = `                <h6 className="fw-bold mb-3">🕒 Lịch Trình & Hình Ảnh</h6>`;
const endImgSearch = `            <div className="modal-footer">`;

const idx1 = content.indexOf(searchImg);
const idx2 = content.indexOf(endImgSearch, idx1);

if (idx1 !== -1 && idx2 !== -1) {
  const replaceImg = `                {(() => {
                  const imgs = selectedConsignment.images || [];
                  let customerImages = imgs;
                  let pickupImage = null;
                  let deliveryImage = null;

                  if (selectedConsignment.cargoStatus === 'delivered' && imgs.length >= 2) {
                    deliveryImage = imgs[imgs.length - 1];
                    pickupImage = imgs[imgs.length - 2];
                    customerImages = imgs.slice(0, imgs.length - 2);
                  } else if (selectedConsignment.cargoStatus === 'delivered' && imgs.length === 1) {
                    deliveryImage = imgs[0];
                    customerImages = [];
                  } else if (['in_transit', 'received_at_station'].includes(selectedConsignment.cargoStatus) && imgs.length >= 1) {
                    pickupImage = imgs[imgs.length - 1];
                    customerImages = imgs.slice(0, imgs.length - 1);
                  }

                  return (
                    <>
                      <div className="mb-4">
                        <h6 className="fw-bold mb-3">📦 Hình Ảnh Của Bạn (Lúc Gửi)</h6>
                        {customerImages.length > 0 ? (
                          <div className="d-flex flex-wrap gap-2">
                            {customerImages.map((img, i) => (
                              <img key={i} src={img} alt={"Hình ảnh khách gửi " + (i+1)} style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '0.5rem', border: '1px solid #e5e7eb', objectFit: 'cover' }} />
                            ))}
                          </div>
                        ) : (
                          <div className="text-muted small italic">Không có hình ảnh đính kèm</div>
                        )}
                      </div>

                      <h6 className="fw-bold mb-3">🕒 Lịch Trình & Hình Ảnh (Tài xế)</h6>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingLeft: '0.5rem', borderLeft: '2px solid #e5e7eb', marginLeft: '0.5rem' }}>
                        
                        <div style={{ display: 'flex', gap: '1rem', opacity: ['pending', 'confirmed', 'received_at_station', 'in_transit', 'delivered'].includes(selectedConsignment.cargoStatus) ? 1 : 0.5 }}>
                          <div style={{ marginLeft: '-1.15rem', backgroundColor: 'white', padding: '0.2rem' }}>⏳</div>
                          <div>
                            <div className="fw-600">Đã gửi yêu cầu</div>
                            <div className="small text-muted">Đang chờ tài xế duyệt</div>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1rem', opacity: ['confirmed', 'received_at_station', 'in_transit', 'delivered'].includes(selectedConsignment.cargoStatus) ? 1 : 0.5 }}>
                          <div style={{ marginLeft: '-1.15rem', backgroundColor: 'white', padding: '0.2rem' }}>✅</div>
                          <div>
                            <div className="fw-600">Đã duyệt (Chờ nhận hàng)</div>
                            <div className="small text-muted">Tài xế đã đồng ý và đang chờ lấy hàng</div>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1rem', opacity: ['in_transit', 'delivered'].includes(selectedConsignment.cargoStatus) ? 1 : 0.5 }}>
                          <div style={{ marginLeft: '-1.15rem', backgroundColor: 'white', padding: '0.2rem' }}>🚚</div>
                          <div>
                            <div className="fw-600">Đã lấy hàng & Đang vận chuyển</div>
                            <div className="small text-muted">Tài xế đã xác nhận nhận hàng</div>
                            {pickupImage && ['in_transit', 'delivered'].includes(selectedConsignment.cargoStatus) && (
                              <div className="mt-2">
                                <img src={pickupImage} alt="Hình ảnh nhận hàng" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '0.5rem', border: '1px solid #e5e7eb', objectFit: 'cover' }} />
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', opacity: ['delivered'].includes(selectedConsignment.cargoStatus) ? 1 : 0.5 }}>
                          <div style={{ marginLeft: '-1.15rem', backgroundColor: 'white', padding: '0.2rem' }}>🎉</div>
                          <div>
                            <div className="fw-600">Đã giao thành công</div>
                            <div className="small text-muted">Hàng đã đến tay người nhận</div>
                            {deliveryImage && selectedConsignment.cargoStatus === 'delivered' && (
                              <div className="mt-2">
                                <img src={deliveryImage} alt="Hình ảnh giao hàng" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '0.5rem', border: '1px solid #e5e7eb', object fixed: 'cover' }} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

`;
  content = content.substring(0, idx1) + replaceImg + content.substring(idx2);
}

fs.writeFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', content, 'utf8');
console.log('Fixed UserHistory');
