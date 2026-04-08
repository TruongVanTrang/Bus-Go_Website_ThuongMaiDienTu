import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FiCheckCircle, FiClock, FiLock } from 'react-icons/fi'
import QRCode from 'qrcode.react'
import './PaymentPage.css'

export default function PaymentPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { state } = location
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [countdownSeconds, setCountdownSeconds] = useState(120) // 2 minutes
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('none')
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

  const bookingId = 'BK' + Date.now()
  const totalAmount = bookingData.selectedSeats?.length ? 
    (bookingData.selectedSeats.length * (bookingData.totalPrice || 250000)) + (bookingData.cargoInfo?.estimatedPrice || 0) : 
    250000 + (bookingData.cargoInfo?.estimatedPrice || 0)

  // Payment methods configuration
  const paymentMethods = {
    visa: {
      name: 'Visa',
      category: 'Thẻ quốc tế',
      logo: '💳',
      description: 'Thanh toán qua thẻ Visa quốc tế'
    },
    mastercard: {
      name: 'Mastercard',
      category: 'Thẻ quốc tế',
      logo: '💳',
      description: 'Thanh toán qua thẻ Mastercard quốc tế'
    },
    jcb: {
      name: 'JCB',
      category: 'Thẻ quốc tế',
      logo: '💳',
      description: 'Thanh toán qua thẻ JCB quốc tế'
    },
    atm_napas: {
      name: 'ATM Napas',
      category: 'Thẻ nội địa',
      logo: '🏦',
      description: 'Thanh toán qua thẻ ATM nội địa qua cổng Napas'
    },
    momo: {
      name: 'Momo',
      category: 'Ví điện tử',
      logo: '📱',
      description: 'Thanh toán qua ví điện tử Momo'
    },
    zalopay: {
      name: 'ZaloPay',
      category: 'Ví điện tử',
      logo: '📱',
      description: 'Thanh toán qua ví điện tử ZaloPay'
    },
    vnpay: {
      name: 'VNPay',
      category: 'Ví điện tử',
      logo: '📱',
      description: 'Thanh toán qua ví điện tử VNPay'
    }
  }

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
    if (countdownSeconds <= 0) {
      return
    }
    
    const timer = setInterval(() => {
      setCountdownSeconds(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [countdownSeconds])

  const handleConfirmPayment = async () => {
    if (selectedPaymentMethod === 'none') {
      alert('Vui lòng chọn phương thức thanh toán')
      return
    }

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
            paymentStatus: 'Da thanh toan',
            paymentMethod: selectedPaymentMethod,
            bookingId: bookingId
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

  // Group payment methods by category
  const groupedMethods = {
    'Thẻ quốc tế': ['visa', 'mastercard', 'jcb'],
    'Thẻ nội địa': ['atm_napas'],
    'Ví điện tử': ['momo', 'zalopay', 'vnpay']
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
        <div className="row g-4">
          {/* Left: Trip Summary & Payment Methods */}
          <div className="col-lg-6">
            {/* Trip Summary */}
            <div className="card shadow-sm mb-4">
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
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                        (bookingData.selectedSeats?.length || 1) * (bookingData.totalPrice || 250000)
                      )}
                    </span>
                  </div>
                  
                  {bookingData.cargoInfo?.type !== 'none' && bookingData.cargoInfo?.estimatedPrice > 0 && (
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Tiền gửi hàng hóa</span>
                      <span className="fw-600">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                          bookingData.cargoInfo.estimatedPrice
                        )}
                      </span>
                    </div>
                  )}
                  
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

            {/* Payment Methods */}
            <div className="card shadow-sm">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-4 text-neutral-900">Chọn phương thức thanh toán</h5>

                {Object.entries(groupedMethods).map(([category, methods]) => (
                  <div key={category} className="mb-4">
                    <h6 className="text-muted small fw-600 mb-3">{category}</h6>
                    <div className="list-group">
                      {methods.map(methodKey => {
                        const method = paymentMethods[methodKey]
                        return (
                          <label key={methodKey} className="list-group-item px-3 py-3 cursor-pointer" style={{ cursor: 'pointer' }}>
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
                            <div className="small text-muted ms-5">{method.description}</div>
                          </label>
                        )
                      })}
                    </div>
                    {category !== 'Ví điện tử' && <hr className="my-4" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: QR Code Payment */}
          <div className="col-lg-6">
            <div className="card shadow-sm h-100">
              <div className="card-body p-5 d-flex flex-column">
                {selectedPaymentMethod !== 'none' ? (
                  <>
                    <h5 className="fw-bold mb-4 text-neutral-900 text-center">Quét mã QR để thanh toán</h5>

                    {/* QR Code Container */}
                    <div className="qr-code-container mb-4 p-4 bg-light border border-primary rounded-3 text-center flex-grow-1">
                      <QRCode
                        value={qrCodeContent}
                        size={280}
                        level="H"
                        includeMargin={true}
                        renderAs="svg"
                      />
                      <div className="small text-muted mt-3">
                        <strong>{paymentMethods[selectedPaymentMethod].name}</strong><br />
                        {paymentMethods[selectedPaymentMethod].description}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-center mb-4 p-3 bg-light rounded">
                      <div className="small text-muted mb-2">Số tiền cần thanh toán</div>
                      <div className="fs-2 fw-bold text-primary">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="alert alert-info mb-4">
                      <div className="small mb-2">
                        <strong>Hướng dẫn thanh toán</strong>
                      </div>
                      <div className="small">
                        Sử dụng ứng dụng {paymentMethods[selectedPaymentMethod].name} để quét mã QR trên để chuyển khoản
                      </div>
                    </div>

                    {/* Countdown Timer */}
                    <div className="countdown-timer mb-4 text-center">
                      <FiClock className="me-2" />
                      <span className="small text-muted">
                        Còn <strong>{formatMinutesSeconds(countdownSeconds)}</strong> để hoàn tất thanh toán
                      </span>
                    </div>

                    {/* Confirm Button */}
                    <button
                      onClick={handleConfirmPayment}
                      disabled={confirmLoading || countdownSeconds <= 0}
                      className="btn btn-primary w-100 fw-600 py-3"
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
                      <div className="alert alert-warning mt-3 w-100 small text-center mb-0">
                        Thời gian chờ đã hết. Vui lòng quay lại trang trước để thử lại.
                      </div>
                    )}
                  </>
                ) : (
                  <div className="d-flex flex-column align-items-center justify-content-center h-100">
                    <div className="text-center">
                      <div className="display-1 mb-3">👈</div>
                      <h5 className="fw-bold text-neutral-900 mb-2">Chọn phương thức thanh toán</h5>
                      <p className="text-muted small">
                        Vui lòng chọn phương thức thanh toán ở bên trái để tiếp tục
                      </p>
                    </div>
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
