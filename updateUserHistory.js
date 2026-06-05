const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8');

const target = `<div className="modal-footer">
              {selectedConsignment.cargoStatus === 'pending' && (
                <button
                  onClick={() => handleCancelConsignment(selectedConsignment.id)}
                  className="btn"
                  style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.75rem 1.5rem' }}
                >
                  Hủy đơn hàng
                </button>
              )}
              <button
                onClick={() => setShowConsignmentDetailModal(false)}
                className="btn"
                style={{ backgroundColor: '#e5e7eb', color: '#333', border: 'none', padding: '0.75rem 1.5rem' }}
              >
                Đóng
              </button>
            </div>`;

const replacement = `<div className="modal-footer">
              {selectedConsignment.cargoStatus === 'pending' && (
                <>
                  <button
                    onClick={() => handleCancelConsignment(selectedConsignment.id)}
                    className="btn"
                    style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.75rem 1.5rem' }}
                  >
                    Hủy đơn hàng
                  </button>
                  <button
                    onClick={() => navigate('/edit-consignment', { state: { consignment: selectedConsignment } })}
                    className="btn"
                    style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none', padding: '0.75rem 1.5rem' }}
                  >
                    Chỉnh sửa
                  </button>
                </>
              )}
              {selectedConsignment.cargoStatus === 'failed' && (
                <button
                  onClick={() => navigate('/cargo-consignment', { state: { reorderData: selectedConsignment } })}
                  className="btn"
                  style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '0.75rem 1.5rem' }}
                >
                  Đặt lại đơn
                </button>
              )}
              <button
                onClick={() => setShowConsignmentDetailModal(false)}
                className="btn"
                style={{ backgroundColor: '#e5e7eb', color: '#333', border: 'none', padding: '0.75rem 1.5rem' }}
              >
                Đóng
              </button>
            </div>`;

content = content.replace(target, replacement);

fs.writeFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', content, 'utf8');
console.log('Done replacement');
