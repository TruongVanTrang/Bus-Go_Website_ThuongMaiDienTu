import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FiCheckCircle, FiClock } from 'react-icons/fi'
import QRCode from 'qrcode.react'
import './PaymentPage.css'

export default function PaymentPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { state } = location
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [countdownSeconds, setCountdownSeconds] = useState(120) // 2 minutes

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
    totalPrice: 250000
  }

  const bookingId = 'BK' + Date.now()
  const totalAmount = bookingData.selectedSeats?.length ? bookingData.selectedSeats.length * (bookingData.totalPrice || 250000) : 250000

  // Generate QR code content (normally this would be a payment gateway URL)
  const qrCodeContent = JSON.stringify({
    bookingId: bookingId,
    amount: totalAmount,
    merchant: 'BusGo',
    description: `Payment for booking ${bookingId}`
  })

  // Countdown timer for payment confirmation
  useEffect(() => {
    if (countdownSeconds <= 0) {
      return
    }
    
    const timer = setInterval(() => {
      setCountdownSeconds(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [countdownSeconds])

  const handleConfirmPayment = async () => {
    setConfirmLoading(true)
    
    // Simulate API call to verify payment
    setTimeout(() => {
      setConfirmLoading(false)
      setIsConfirmed(true)
      
      // Redirect to ticket page after 2 seconds
      setTimeout(() => {
        navigate(`/ticket/${bookingId}`, {
          state: {
            ...bookingData,
            paymentStatus: 'Da thanh toan'
          }
        })
      }, 2000)
    }, 1500)
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

  return (
    <div className="payment-page">
      <div className="container-fluid px-md-5 px-3 py-5">
        {/* Header */}
        <div className="row mb-5">
          <div className="col-12">
            <h1 className="fw-bold text-neutral-900 mb-2">Thanh toán</h1>
            <p className="text-muted">Mã đơn hàng: <strong>{bookingId}</strong></p>
          </div>
        </div>

        {/* Main Payment Section */}
        <div className="row justify-content-center">
          {/* Left: Trip Summary */}
          <div className="col-lg-6 mb-4 mb-lg-0 order-lg-1 order-2">
            <div className="card h-100 shadow-sm">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-4 text-neutral-900">Thông tin chuyến xe</h5>

                {/* Trip Details */}
                <div className="trip-info mb-4">
                  <div className="row g-3">
                    <div className="col-6">
                      <div className="small text-muted mb-1">Điểm đi</div>
                      <div className="fw-600">{bookingData.trip.from}</div>
                    </div>
                    <div className="col-6">
                      <div className="small text-muted mb-1">Điểm đến</div>
                      <div className="fw-600">{bookingData.trip.to}</div>
                    </div>
                  </div>

                  <hr className="my-3" />

                  <div className="row g-3">
                    <div className="col-6">
                      <div className="small text-muted mb-1">Ngày khởi hành</div>
                      <div className="fw-600">{bookingData.trip.date}</div>
                    </div>
                    <div className="col-6">
                      <div className="small text-muted mb-1">Thời gian khởi hành</div>
                      <div className="fw-600">{bookingData.trip.departureTime}</div>
                    </div>
                  </div>

                  <hr className="my-3" />

                  <div className="row g-3">
                    <div className="col-6">
                      <div className="small text-muted mb-1">Nhà xe</div>
                      <div className="fw-600">{bookingData.trip.operator}</div>
                    </div>
                    <div className="col-6">
                      <div className="small text-muted mb-1">Số ghế</div>
                      <div className="fw-600">{bookingData.selectedSeats?.length || 1}</div>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="pricing-summary">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Giá vé (x{bookingData.selectedSeats?.length || 1})</span>
                    <span className="fw-600">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Phí dịch vụ</span>
                    <span className="fw-600">Miễn phí</span>
                  </div>
                  <hr className="my-3" />
                  <div className="d-flex justify-content-between">
                    <span className="fw-bold text-neutral-900">Tổng cộng</span>
                    <span className="fw-bold fs-5" style={{ color: '#0066cc' }}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: QR Code Payment */}
          <div className="col-lg-6 order-lg-2 order-1">
            <div className="card shadow-sm h-100">
              <div className="card-body p-5 d-flex flex-column align-items-center justify-content-center">
                <h5 className="fw-bold mb-4 text-neutral-900 text-center">Quét mã QR để thanh toán</h5>

                {/* QR Code Container */}
                <div className="qr-code-container mb-4 p-4 bg-white border border-primary rounded-3">
                  <QRCode
                    value={qrCodeContent}
                    size={250}
                    level="H"
                    includeMargin={true}
                    renderAs="svg"
                  />
                </div>

                {/* Amount */}
                <div className="text-center mb-4">
                  <div className="small text-muted mb-1">Số tiền cần thanh toán</div>
                  <div className="fs-2 fw-bold text-primary">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
                  </div>
                </div>

                {/* Instructions */}
                <div className="alert alert-info mb-4 w-100 text-center">
                  <div className="small mb-2">
                    <strong>Hướng dẫn thanh toán</strong>
                  </div>
                  <div className="small">
                    Sử dụng ứng dụng ngân hàng hoặc ví điện tử để quét mã QR trên để chuyển khoản
                  </div>
                </div>

                {/* Countdown Timer */}
                <div className="countdown-timer mb-4">
                  <FiClock className="me-2" />
                  <span className="small text-muted">
                    Còn <strong>{formatMinutesSeconds(countdownSeconds)}</strong> để hoàn tất thanh toán
                  </span>
                </div>

                {/* Confirm Button */}
                <button
                  onClick={handleConfirmPayment}
                  disabled={confirmLoading || countdownSeconds <= 0}
                  className="btn btn-primary w-100 fw-600 py-2 px-4"
                  style={{
                    backgroundColor: countdownSeconds <= 0 ? '#ccc' : '#0066cc',
                    borderColor: countdownSeconds <= 0 ? '#ccc' : '#0066cc'
                  }}
                >
                  {confirmLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Đang xác nhận...
                    </>
                  ) : countdownSeconds <= 0 ? (
                    'Hết thời gian'
                  ) : (
                    'Xác nhận đã chuyển khoản'
                  )}
                </button>

                {countdownSeconds <= 0 && (
                  <div className="alert alert-warning mt-3 w-100 small text-center">
                    Thời gian chờ đã hết. Vui lòng quay lại trang trước để thử lại.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="row mt-5">
          <div className="col-12">
            <div className="alert alert-light border border-neutral-200 text-center">
              <div className="small text-muted">
                BusGo chỉ hỗ trợ thanh toán qua mã QR nội bộ. 
                <br />
                Giao dịch của bạn được bảo vệ 100% và tuân thủ các tiêu chuẩn bảo mật quốc tế.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
