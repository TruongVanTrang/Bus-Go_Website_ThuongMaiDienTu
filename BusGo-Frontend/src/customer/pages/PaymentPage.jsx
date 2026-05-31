import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FiCheckCircle, FiClock, FiLock } from 'react-icons/fi'
import QRCode from 'qrcode.react'
import Stepper from '../../components/common/Stepper'
import BackButton from '../../components/common/BackButton'
import { createBookingAPI, createVNPayUrlAPI, cancelBookingAPI } from '../../services/bookingService'
import { StorageUtil } from '../../utils/helpers'
import './PaymentPage.css'

// Cấu hình phương thức thanh toán
const PAYMENT_METHODS = {
  bank_transfer: { name: 'Chuyển khoản Ngân hàng', category: 'Chuyển khoản', logo: '🏦', description: 'Quét mã VietQR để thanh toán nhanh' },
  vnpay: { name: 'VNPay', category: 'Ví điện tử', logo: '📱', description: 'Thanh toán qua ví điện tử VNPay' }
}

export default function PaymentPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { state } = location
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  
  // Read global timer
  const [expireTime] = useState(() => {
    const saved = sessionStorage.getItem('seatLockExpire');
    return saved ? parseInt(saved, 10) : Date.now() + 180000; // default 3 mins if missing
  });
  const [countdownSeconds, setCountdownSeconds] = useState(() => {
    return Math.max(0, Math.floor((expireTime - Date.now()) / 1000));
  });

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('bank_transfer')
  const [paymentQRCode, setPaymentQRCode] = useState('')

  // Get booking data from navigation state
  const bookingData = state || {
    trip: {
      from: 'Hà Nội',
      to: 'Sài Gòn',
      date: '2024-01-15',
      departureTime: '08:00',
      operator: 'BusGo Express'
    },
    selectedSeats: ['A1'],
    passengerInfo: {
      firstName: 'Nguyễn',
      lastName: 'Văn A'
    },
    cargoInfo: {
      type: 'none',
      estimatedPrice: 0
    },
    totalPrice: 250000
  }

  const [bookingId] = useState(() => 'BK' + Date.now())
  const totalAmount = bookingData.totalPrice || 250000

  // Cấu hình phương thức thanh toán
  const paymentMethods = PAYMENT_METHODS

  // Generate QR code based on payment method
  const generatePaymentQR = (method) => {
    if (method === 'none') return ''
    
    const qrData = JSON.stringify({
      bookingId: bookingId,
      amount: totalAmount,
      merchant: 'BusGo',
      method: method,
      description: `Payment for booking ${bookingId}`,
      timestamp: new Date().toISOString()
    })
    return qrData
  }

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method)
    setPaymentQRCode(generatePaymentQR(method))
  }

  // Generate QR code content
  const qrCodeContent = JSON.stringify({
    bookingId: bookingId,
    amount: totalAmount,
    merchant: 'BusGo',
    method: selectedPaymentMethod,
    description: `Payment for booking ${bookingId}`
  })

  // Countdown timer for payment confirmation
  useEffect(() => {
    if (countdownSeconds <= 0) return;
    
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expireTime - Date.now()) / 1000));
      setCountdownSeconds(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
        // Hết hạn giữ chỗ -> tự động hủy vé trên backend nếu đã tạo
        const sessionKey = `booking_${bookingData.trip?.id}_${bookingData.selectedSeats?.join('_')}`;
        const realBookingId = sessionStorage.getItem(sessionKey);
        if (realBookingId) {
          const token = StorageUtil.getToken();
          if (token) {
            cancelBookingAPI(token, realBookingId).catch(console.error);
          }
        }
        alert('Đã hết thời gian giữ chỗ! Vui lòng đặt lại vé.');
        sessionStorage.removeItem('seatLockExpire');
        navigate('/');
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [expireTime, countdownSeconds, navigate, bookingData])

  const handleConfirmPayment = async () => {
    if (selectedPaymentMethod === 'none') {
      alert('Vui lòng chọn phương thức thanh toán')
      return
    }

    const token = StorageUtil.getToken()
    if (!token) {
      alert('Bạn cần đăng nhập để thực hiện đặt vé!')
      navigate('/login')
      return
    }

    setConfirmLoading(true)
    
    try {
      const sessionKey = `booking_${bookingData.trip?.id}_${bookingData.selectedSeats?.join('_')}`;
      let realBookingId = sessionStorage.getItem(sessionKey);

      if (!realBookingId) {
        const payload = {
          maChuyenXe: bookingData.trip.id,
          selectedSeats: bookingData.selectedSeats,
          passengerQuantity: bookingData.passengerQuantity || 0,
          passengerInfo: bookingData.passengerInfo,
          cargoInfo: bookingData.cargoInfo,
          paymentMethod: selectedPaymentMethod
        }
        
        const response = await createBookingAPI(token, payload)
        realBookingId = response.bookingId || bookingId
        sessionStorage.setItem(sessionKey, realBookingId);
      }
      
      if (selectedPaymentMethod === 'vnpay') {
        sessionStorage.setItem('pendingVNPayBooking', JSON.stringify({
          ...bookingData,
          paymentMethod: selectedPaymentMethod,
          bookingId: realBookingId
        }));
        
        const vnpayRes = await createVNPayUrlAPI(totalAmount, realBookingId);
        if (vnpayRes && vnpayRes.url) {
            window.location.href = vnpayRes.url;
            return;
        }
      }

      setConfirmLoading(false)
      setIsConfirmed(true)

      // Redirect to ticket page after 2 seconds
      setTimeout(() => {
        navigate(`/ticket/${realBookingId}`, {
          state: {
            ...bookingData,
            paymentStatus: 'Da thanh toan',
            paymentMethod: selectedPaymentMethod,
            bookingId: realBookingId
          }
        })
      }, 2000)
    } catch (error) {
      setConfirmLoading(false)
      alert(error.message || 'Có lỗi xảy ra khi đặt vé. Vui lòng thử lại.')
    }
  }

  const formatMinutesSeconds = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`
  }

  if (isConfirmed) {
    return (
      <div className="payment-page payment-success">
        <div className="container-fluid px-md-5 px-3 d-flex align-items-center justify-content-center min-vh-100">
          <div className="text-center">
            <div className="success-icon mb-4">
              <FiCheckCircle size={80} className="text-success" />
            </div>
            <h2 className="fw-bold mb-3 text-neutral-900">Thanh toán thành công!</h2>
            <p className="text-muted mb-5">
              Hệ thống đang xác nhận thanh toán và chuẩn bị vé điện tử của bạn...
            </p>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Group payment methods by category
  const groupedMethods = {
    'Chuyển khoản': ['bank_transfer'],
    'Ví điện tử': ['vnpay']
  }

  return (
    <div className="payment-page">
      {/* Stepper */}
      <Stepper
        currentStep={2}
        steps={[
          { title: 'Chọn chỗ', description: 'Sơ đồ ghế' },
          { title: 'Thông tin', description: 'Hành khách' },
          { title: 'Thanh toán', description: 'Phương thức' },
          { title: 'Vé', description: 'Hoàn tất' }
        ]}
      />

      <div className="container-fluid px-md-4 px-3 py-3">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-3">
            <BackButton label="Quay lại" />
            <h2 className="fw-bold text-neutral-900 mb-0 ms-2">Thanh toán</h2>
          </div>
          <div className="text-end">
            <p className="text-muted mb-0 small">Mã đơn hàng</p>
            <p className="fw-bold text-primary mb-0">{bookingId}</p>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="row g-3">
          {/* Left Column: Trip Info & Payment Methods */}
          <div className="col-lg-7">
            {/* 1. Trip Summary */}
            <div className="card shadow-sm mb-3">
              <div className="card-header bg-white py-2">
                <h6 className="fw-bold mb-0 text-neutral-900">Thông tin chuyến xe</h6>
              </div>
              <div className="card-body p-3">
                <div className="row g-3">
                  <div className="col-md-12">
                    <div className="trip-info mb-0">
                      <div className="row g-2">
                        <div className="col-6">
                          <div className="small text-muted mb-1">Điểm đi</div>
                          <div className="fw-600">{bookingData.trip.from}</div>
                        </div>
                        <div className="col-6">
                          <div className="small text-muted mb-1">Điểm đến</div>
                          <div className="fw-600">{bookingData.trip.to}</div>
                        </div>
                      </div>

                      <hr className="my-2" />

                      <div className="row g-2">
                        <div className="col-6">
                          <div className="small text-muted mb-1">Ngày khởi hành</div>
                          <div className="fw-600">{bookingData.trip.date}</div>
                        </div>
                        <div className="col-6">
                          <div className="small text-muted mb-1">Thời gian khởi hành</div>
                          <div className="fw-600">{bookingData.trip.departureTime}</div>
                        </div>
                      </div>

                      <hr className="my-2" />

                      <div className="row g-2">
                        <div className="col-6">
                          <div className="small text-muted mb-1">Nhà xe</div>
                          <div className="fw-600">{bookingData.trip.operator}</div>
                        </div>
                        <div className="col-6">
                          <div className="small text-muted mb-1">Số ghế</div>
                          <div className="fw-600">
                            {bookingData.selectedSeats?.length > 0 
                              ? `${bookingData.selectedSeats.length} (Vị trí: ${bookingData.selectedSeats.join(', ')})` 
                              : (bookingData.passengerQuantity || 1)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Payment Methods */}
            <div className="card shadow-sm mb-3">
              <div className="card-header bg-white py-2">
                <h6 className="fw-bold mb-0 text-neutral-900">Chọn phương thức thanh toán</h6>
              </div>
              <div className="card-body p-2">
                {Object.entries(groupedMethods).map(([category, methods]) => (
                  <div key={category} className="mb-0">
                    <div className="list-group list-group-flush">
                      {methods.map(methodKey => {
                        const method = paymentMethods[methodKey]
                        return (
                          <label key={methodKey} className="list-group-item px-3 py-2 cursor-pointer border-0 rounded mb-1" style={{ cursor: 'pointer', backgroundColor: selectedPaymentMethod === methodKey ? '#f0f7ff' : 'transparent' }}>
                            <div className="d-flex align-items-center">
                              <input
                                type="radio"
                                name="paymentMethod"
                                value={methodKey}
                                checked={selectedPaymentMethod === methodKey}
                                onChange={() => handlePaymentMethodSelect(methodKey)}
                                className="me-2"
                              />
                              <span className="fs-5 me-2">{method.logo}</span>
                              <strong>{method.name}</strong>
                            </div>
                            <div className="small text-muted ms-4 ps-2">{method.description}</div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary, QR Code & Actions */}
          <div className="col-lg-5">
            <div className="card shadow-sm sticky-top" style={{ top: '20px', zIndex: 1 }}>
              <div className="card-header bg-white py-2">
                <h6 className="fw-bold mb-0 text-neutral-900">Tổng quan thanh toán</h6>
              </div>
              <div className="card-body p-3 d-flex flex-column">
                
                {/* Pricing Summary */}
                <div className="pricing-summary mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted small">Giá vé (x{bookingData.selectedSeats?.length > 0 ? bookingData.selectedSeats.length : (bookingData.passengerQuantity || 1)})</span>
                    <span className="fw-600 small">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                        totalAmount - (bookingData.cargoInfo?.estimatedPrice || 0)
                      )}
                    </span>
                  </div>
                  
                  {bookingData.cargoInfo?.type !== 'none' && bookingData.cargoInfo?.estimatedPrice > 0 && (
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted small">Tiền gửi hàng hóa</span>
                      <span className="fw-600 small">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                          bookingData.cargoInfo.estimatedPrice
                        )}
                      </span>
                    </div>
                  )}
                  
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted small">Phí dịch vụ</span>
                    <span className="fw-600 small">Miễn phí</span>
                  </div>
                  <hr className="my-2" />
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold text-neutral-900">Tổng thanh toán</span>
                    <span className="fw-bold fs-5 text-primary">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
                    </span>
                  </div>
                </div>

                {/* QR Code or Placeholder */}
                {selectedPaymentMethod !== 'none' ? (
                  <>
                    {/* QR Code Container */}
                    <div className="qr-code-container mb-3 p-2 bg-light border rounded-3 text-center d-flex flex-column align-items-center justify-content-center">
                      {selectedPaymentMethod === 'bank_transfer' ? (
                        <img 
                          src={`https://img.vietqr.io/image/BIDV-5811675947-compact2.png?amount=${totalAmount}&addInfo=${bookingId}&accountName=BUSGO`}
                          alt="VietQR"
                          style={{ width: '180px', height: '180px', objectFit: 'contain' }}
                        />
                      ) : (
                        <QRCode
                          value={qrCodeContent}
                          size={180}
                          level="H"
                          includeMargin={true}
                          renderAs="svg"
                        />
                      )}
                      <div className="small text-muted mt-2">
                        <strong>Quét mã qua {paymentMethods[selectedPaymentMethod].name}</strong>
                      </div>
                    </div>

                    {/* Countdown Timer */}
                    <div className="countdown-timer mb-2 text-center">
                      <FiClock className="me-1 text-primary" />
                      <span className="small text-muted">
                        Thời gian giữ chỗ còn <strong>{formatMinutesSeconds(countdownSeconds)}</strong>
                      </span>
                    </div>

                    {/* Confirm Button */}
                    <button
                      onClick={handleConfirmPayment}
                      disabled={confirmLoading || countdownSeconds <= 0}
                      className="btn btn-primary w-100 fw-bold py-2 shadow-sm"
                      style={{
                        backgroundColor: countdownSeconds <= 0 ? '#ccc' : '#0066cc',
                        borderColor: countdownSeconds <= 0 ? '#ccc' : '#0066cc',
                        borderRadius: '8px'
                      }}
                    >
                      {confirmLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Đang xử lý...
                        </>
                      ) : countdownSeconds <= 0 ? (
                        'Hết thời gian'
                      ) : selectedPaymentMethod === 'vnpay' ? (
                        'Thanh toán qua VNPay'
                      ) : (
                        'Xác nhận đã chuyển khoản'
                      )}
                    </button>

                    {countdownSeconds <= 0 && (
                      <div className="alert alert-warning mt-2 w-100 small text-center mb-0 py-1">
                        Thời gian chờ đã hết. Vui lòng quay lại trang trước để thử lại.
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted small">
                      Vui lòng chọn phương thức thanh toán để tiếp tục
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="row mt-5">
          <div className="col-12">
            <div className="card bg-light border-0">
              <div className="card-body p-4">
                <h6 className="fw-bold mb-3 text-neutral-900">
                  <FiLock className="me-2" />
                  Bảo mật thanh toán
                </h6>
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="d-flex align-items-center">
                      <div className="badge bg-success me-2">✓</div>
                      <div>
                        <div className="small fw-600">Chứng chỉ SSL</div>
                        <div className="small text-muted">Mã hóa 256-bit</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="d-flex align-items-center">
                      <div className="badge bg-success me-2">✓</div>
                      <div>
                        <div className="small fw-600">PCI DSS</div>
                        <div className="small text-muted">Tiêu chuẩn PCI DSS v3.2</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="d-flex align-items-center">
                      <div className="badge bg-success me-2">✓</div>
                      <div>
                        <div className="small fw-600">Cam kết bảo mật</div>
                        <div className="small text-muted">Thông tin tài chính được mã hóa</div>
                      </div>
                    </div>
                  </div>
                </div>
                <hr className="my-3" />
                <div className="small text-muted text-center">
                  BusGo cam kết bảo vệ 100% thông tin cá nhân và tài chính của bạn. 
                  Giao dịch tuân thủ các tiêu chuẩn bảo mật quốc tế.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
