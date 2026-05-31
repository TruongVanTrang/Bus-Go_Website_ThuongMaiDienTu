import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';

export default function VNPayReturnPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [bookingId, setBookingId] = useState('');

  useEffect(() => {
    // Phân tích tham số URL từ VNPay trả về bằng URLSearchParams gốc
    const searchParams = new URLSearchParams(location.search);
    const params = Object.fromEntries(searchParams.entries());
    
    if (params && params.vnp_ResponseCode) {
      setBookingId(params.vnp_TxnRef);
      if (params.vnp_ResponseCode === '00') {
        setStatus('success');
        // Tự động chuyển về trang vé sau 3 giây
        setTimeout(() => {
          const pendingBookingStr = sessionStorage.getItem('pendingVNPayBooking');
          let stateData = { paymentStatus: 'Da thanh toan', paymentMethod: 'vnpay' };
          
          if (pendingBookingStr) {
            try {
              const pendingBooking = JSON.parse(pendingBookingStr);
              stateData = { ...pendingBooking, paymentStatus: 'Da thanh toan' };
              sessionStorage.removeItem('pendingVNPayBooking');
            } catch (e) {
              console.error(e);
            }
          }

          navigate(`/ticket/${params.vnp_TxnRef}`, { state: stateData });
        }, 3000);
      } else {
        setStatus('error');
      }
    } else {
      setStatus('invalid');
    }
  }, [location.search, navigate]);

  return (
    <div className="container py-5 text-center" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      {status === 'processing' && (
        <div>
          <div className="spinner-border text-primary" role="status"></div>
          <h3 className="mt-3">Đang xử lý kết quả thanh toán...</h3>
        </div>
      )}

      {status === 'success' && (
        <div>
          <FiCheckCircle color="#10b981" size={80} className="mb-4 mx-auto" />
          <h2 className="fw-bold text-success mb-3">Thanh toán thành công!</h2>
          <p className="text-muted fs-5 mb-4">Mã đơn hàng của bạn: <strong>{bookingId}</strong></p>
          <p className="text-primary small mb-3">Hệ thống sẽ tự động chuyển đến vé của bạn trong giây lát...</p>
          <button 
            className="btn btn-primary px-4 py-2"
            onClick={() => {
              const pendingBookingStr = sessionStorage.getItem('pendingVNPayBooking');
              let stateData = { paymentStatus: 'Da thanh toan', paymentMethod: 'vnpay' };
              if (pendingBookingStr) {
                try {
                  const pendingBooking = JSON.parse(pendingBookingStr);
                  stateData = { ...pendingBooking, paymentStatus: 'Da thanh toan' };
                } catch (e) {}
              }
              navigate(`/ticket/${bookingId}`, { state: stateData });
            }}
          >
            Xem vé ngay
          </button>
        </div>
      )}

      {status === 'error' && (
        <div>
          <FiXCircle color="#ef4444" size={80} className="mb-4 mx-auto" />
          <h2 className="fw-bold text-danger mb-3">Thanh toán thất bại hoặc bị hủy</h2>
          <p className="text-muted fs-5 mb-4">Giao dịch cho đơn hàng <strong>{bookingId}</strong> không thành công.</p>
          <button 
            className="btn btn-outline-secondary px-4 py-2 me-3"
            onClick={() => navigate('/')}
          >
            Về trang chủ
          </button>
        </div>
      )}

      {status === 'invalid' && (
        <div>
          <h2 className="fw-bold text-warning mb-3">Yêu cầu không hợp lệ</h2>
          <p className="text-muted">Không tìm thấy thông tin giao dịch từ VNPay.</p>
        </div>
      )}
    </div>
  );
}
