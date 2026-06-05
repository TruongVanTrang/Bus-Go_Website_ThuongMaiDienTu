const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8');

// Add states
const stateInsertPoint = '  const [showConsignmentDetailModal, setShowConsignmentDetailModal] = useState(false)';
const stateVars = `  const [showConsignmentDetailModal, setShowConsignmentDetailModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentConsignment, setPaymentConsignment] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paymentLoading, setPaymentLoading] = useState(false)`;

content = content.replace(stateInsertPoint, stateVars);

// Add Modal JSX
const modalInsertPoint = `      {/* Consignment Detail Modal */}`;
const modalJSX = `      {/* Payment Modal */}
      {showPaymentModal && paymentConsignment && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header border-bottom pb-3 mb-3">
              <h5 className="fw-bold mb-0">Thanh Toán Ký Gửi</h5>
              <button className="btn-close" onClick={() => setShowPaymentModal(false)}></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info" style={{ borderRadius: '0.5rem', backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}>
                Đơn hàng <strong>{paymentConsignment.id}</strong> đã được xác nhận. Vui lòng thanh toán để tiếp tục vận chuyển.
              </div>
              <div className="d-flex justify-content-between mb-3 border-bottom pb-3">
                <span className="text-muted fw-bold">Tổng tiền thanh toán:</span>
                <span className="text-danger fw-bold fs-5">{paymentConsignment.totalPrice?.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="mb-4">
                <label className="form-label fw-bold">Phương thức thanh toán</label>
                <div className="d-flex flex-column gap-2">
                  <label className="d-flex align-items-center p-3 border rounded" style={{ cursor: 'pointer', backgroundColor: paymentMethod === 'cash' ? '#f8fafc' : 'white', borderColor: paymentMethod === 'cash' ? '#3b82f6' : '#e2e8f0' }}>
                    <input type="radio" name="paymentMethod" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} className="me-3" />
                    <div>
                      <div className="fw-bold">Thanh toán tiền mặt</div>
                      <div className="small text-muted">Thanh toán tại quầy khi gửi hoặc nhận hàng</div>
                    </div>
                  </label>
                  <label className="d-flex align-items-center p-3 border rounded" style={{ cursor: 'pointer', backgroundColor: paymentMethod === 'vnpay' ? '#f8fafc' : 'white', borderColor: paymentMethod === 'vnpay' ? '#3b82f6' : '#e2e8f0' }}>
                    <input type="radio" name="paymentMethod" value="vnpay" checked={paymentMethod === 'vnpay'} onChange={() => setPaymentMethod('vnpay')} className="me-3" />
                    <div>
                      <div className="fw-bold">Thanh toán VNPay</div>
                      <div className="small text-muted">Thanh toán trực tuyến an toàn</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer pt-3 border-top d-flex gap-2 justify-content-end">
              <button className="btn btn-light" onClick={() => setShowPaymentModal(false)}>Hủy</button>
              <button 
                className="btn btn-primary" 
                onClick={async () => {
                  setPaymentLoading(true);
                  try {
                    const response = await fetch(\`http://localhost:5000/api/cargo/consignment/\${paymentConsignment.id}/pay\`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ paymentMethod })
                    });
                    if (response.ok) {
                      setShowPaymentModal(false);
                      alert('Thanh toán thành công! Trạng thái đơn hàng sẽ được cập nhật.');
                      window.location.reload();
                    }
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setPaymentLoading(false);
                  }
                }}
                disabled={paymentLoading}
              >
                {paymentLoading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Consignment Detail Modal */}`;

content = content.replace(modalInsertPoint, modalJSX);

fs.writeFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', content, 'utf8');
console.log('Added Payment Modal rendering and logic directly in click handler');
