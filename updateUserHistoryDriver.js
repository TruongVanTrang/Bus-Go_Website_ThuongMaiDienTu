const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8');

const target1 = `                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Phí bảo hiểm (2%)</span>
                    <span className="fw-600">0đ</span>
                  </div>`;

const replacement1 = `                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Phí bảo hiểm (2%)</span>
                    <span className="fw-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((selectedConsignment.declaredValue || 0) * 0.02)}</span>
                  </div>`;

content = content.replace(target1, replacement1);

const target3 = `              <hr />

              {/* Cargo Information */}`;

const replacement3 = `              <hr />

              {/* Driver Information */}
              {selectedConsignment.driverInfo && (
                <div className="section mb-4">
                  <h6 className="fw-bold mb-3">👨‍✈️ Thông Tin Tài Xế & Xe</h6>
                  <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Thông tin xe & tài xế</span>
                      <span className="fw-600 text-end" style={{ maxWidth: '60%' }}>{selectedConsignment.driverInfo}</span>
                    </div>
                  </div>
                </div>
              )}

              <hr />

              {/* Cargo Information */}`;

content = content.replace(target3, replacement3);

fs.writeFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', content, 'utf8');
console.log('Fixed UserHistory driver info and insurance fee');
