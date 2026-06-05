const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8');

// 1. Grid layout
content = content.replace(
  '<div className="consignments-list">',
  '<div className="consignments-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">'
);

// 2. Remove marginBottom from card inline style using regex to ensure it replaces all if needed (but only one exists)
content = content.replace(
  /marginBottom: '1rem' }}/g,
  `}}`
);

// 3. Fix payment prices
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

// 4. Add Driver info in the modal, above "Thông Tin Người Gửi & Nhận"
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

fs.writeFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', content, 'utf8');
console.log('Fixed UserHistory.jsx');
