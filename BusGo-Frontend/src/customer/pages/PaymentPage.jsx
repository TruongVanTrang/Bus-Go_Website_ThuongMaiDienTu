import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FiCheckCircle, FiClock, FiLock, FiArrowLeft, FiShield, FiMapPin, FiCalendar, FiUsers, FiCheck } from 'react-icons/fi'
import QRCode from 'qrcode.react'
import { createBookingAPI, createVNPayUrlAPI, cancelBookingAPI } from '../../services/bookingService'
import { StorageUtil } from '../../utils/helpers'

// Cấu hình phương thức thanh toán
const PAYMENT_METHODS = {
  bank_transfer: {
    name: 'Chuyển khoản ngân hàng',
    category: 'Chuyển khoản',
    logo: '🏦',
    description: 'Quét mã VietQR để thanh toán nhanh chóng',
    badge: 'Phổ biến'
  },
  vnpay: {
    name: 'VNPay',
    category: 'Ví điện tử',
    logo: '📱',
    description: 'Thanh toán qua cổng VNPay an toàn, tiện lợi',
    badge: null
  }
}

export default function PaymentPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { state } = location
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [showTimeoutModal, setShowTimeoutModal] = useState(false)

  // Read global timer
  const [expireTime] = useState(() => {
    const saved = sessionStorage.getItem('seatLockExpire')
    return saved ? parseInt(saved, 10) : Date.now() + 180000
  })
  const [countdownSeconds, setCountdownSeconds] = useState(() => {
    return Math.max(0, Math.floor((expireTime - Date.now()) / 1000))
  })

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('bank_transfer')

  // Get booking data from navigation state
  const bookingData = state || {
    trip: { from: 'Hà Nội', to: 'Sài Gòn', date: '2024-01-15', departureTime: '08:00', operator: 'BusGo Express' },
    selectedSeats: ['A1'],
    passengerInfo: { firstName: 'Nguyễn', lastName: 'Văn A' },
    cargoInfo: { type: 'none', estimatedPrice: 0 },
    totalPrice: 250000
  }

  const [bookingId] = useState(() => 'BK' + Date.now())
  const totalAmount = bookingData.totalPrice || 250000

  const qrCodeContent = JSON.stringify({
    bookingId,
    amount: totalAmount,
    merchant: 'BusGo',
    method: selectedPaymentMethod,
    description: `Payment for booking ${bookingId}`
  })

  // Countdown timer
  useEffect(() => {
    if (countdownSeconds <= 0) return
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expireTime - Date.now()) / 1000))
      setCountdownSeconds(remaining)
      if (remaining <= 0) {
        clearInterval(timer)
        const sessionKey = `booking_${bookingData.trip?.id}_${bookingData.selectedSeats?.join('_')}`
        const realBookingId = sessionStorage.getItem(sessionKey)
        if (realBookingId) {
          const token = StorageUtil.getToken()
          if (token) cancelBookingAPI(token, realBookingId).catch(console.error)
        }
        sessionStorage.removeItem('seatLockExpire')
        sessionStorage.removeItem('bookingDraft')
        setShowTimeoutModal(true)
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
      const sessionKey = `booking_${bookingData.trip?.id}_${bookingData.selectedSeats?.join('_')}`
      let realBookingId = sessionStorage.getItem(sessionKey)

      // Nếu đã có bookingId cũ đang chờ thanh toán nhưng người dùng ấn thanh toán lại (hoặc đổi phương thức), 
      // ta hủy booking cũ để tránh bị treo ghế và dính sai paymentMethod ở Backend.
      if (realBookingId) {
        try {
          await cancelBookingAPI(token, realBookingId)
        } catch (err) {}
        sessionStorage.removeItem(sessionKey)
        sessionStorage.removeItem('pendingVNPayBooking')
      }

      // Luôn tạo booking mới với paymentMethod hiện tại
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
      sessionStorage.setItem(sessionKey, realBookingId)

      if (selectedPaymentMethod === 'vnpay') {
        sessionStorage.setItem('pendingVNPayBooking', JSON.stringify({
          ...bookingData,
          paymentMethod: selectedPaymentMethod,
          bookingId: realBookingId
        }))
        const vnpayRes = await createVNPayUrlAPI(totalAmount, realBookingId)
        if (vnpayRes?.url) {
          window.location.href = vnpayRes.url
          return
        }
      }

      setConfirmLoading(false)
      setIsConfirmed(true)
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

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const seatCount = bookingData.selectedSeats?.length > 0
    ? bookingData.selectedSeats.length
    : (bookingData.passengerQuantity || 1)

  // ── Success Screen ──
  if (isConfirmed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheckCircle className="text-green-500" size={52} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">Thanh toán thành công!</h2>
          <p className="text-slate-500 font-medium mb-8">
            Hệ thống đang xác nhận và chuẩn bị vé điện tử của bạn...
          </p>
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    )
  }

  const handleGoBack = () => {
    // Lưu lại draft để BookingPage không bị mất dữ liệu
    sessionStorage.setItem('bookingDraft', JSON.stringify({
      tripId: bookingData.trip.id,
      selectedSeats: bookingData.selectedSeats,
      passengerQuantity: bookingData.passengerQuantity,
      passengerInfo: bookingData.passengerInfo,
      cargoInfo: bookingData.cargoInfo
    }))
    
    // Nếu có đơn hàng VNPay đang dở dang thì hủy luôn để nhả ghế
    const pendingBookingStr = sessionStorage.getItem('pendingVNPayBooking')
    if (pendingBookingStr) {
      try {
        const pendingBooking = JSON.parse(pendingBookingStr)
        if (pendingBooking.bookingId) {
          const token = StorageUtil.getToken()
          if (token) cancelBookingAPI(token, pendingBooking.bookingId).catch(console.error)
        }
      } catch (e) {}
      sessionStorage.removeItem('pendingVNPayBooking')
    }

    navigate(-1)
  }

  // ── Main Page ──
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-8 md:px-16">

      {/* Sticky Timer Banner */}
      {countdownSeconds > 0 && countdownSeconds <= 60 && (
        <div className="fixed top-20 left-0 right-0 z-50 flex justify-center px-4">
          <div className="flex items-center gap-3 px-6 py-3 rounded-full shadow-xl font-bold text-base bg-red-500 text-white border-2 border-red-400">
            <FiClock size={20} />
            <span>Thời gian giữ chỗ còn:</span>
            <span className="text-xl font-black">{formatTime(countdownSeconds)}</span>
          </div>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-semibold mb-6 transition-colors group"
          >
            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            Quay lại
          </button>

          {/* Steps */}
          <div className="flex items-center gap-2 mb-6">
            {[
              { n: 1, label: 'Chọn ghế' },
              { n: 2, label: 'Thông tin' },
              { n: 3, label: 'Thanh toán' },
              { n: 4, label: 'Hoàn tất' }
            ].map((step, i) => (
              <div key={step.n} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm ${i === 2 ? 'bg-blue-600 text-white shadow-md' : i < 2 ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-white text-slate-400 border border-slate-200'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black ${i === 2 ? 'bg-white text-blue-600' : i < 2 ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {i < 2 ? <FiCheck size={10} /> : step.n}
                  </span>
                  {step.label}
                </div>
                {i < 3 && <div className="w-6 h-px bg-slate-300"></div>}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-slate-900">Thanh toán đặt vé</h1>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mã đơn hàng</div>
              <div className="text-sm font-black text-blue-600">{bookingId}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">

            {/* Trip Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FiMapPin className="text-blue-500" /> Thông tin chuyến xe
                </h2>
              </div>
              <div className="p-6">
                {/* Route */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="text-2xl font-black text-slate-900">{bookingData.trip.from}</div>
                    <div className="text-xs font-bold text-slate-400 mt-0.5 uppercase">{bookingData.trip.departureTime}</div>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-slate-400">
                    <div className="text-xs font-bold">✈ Chuyến xe</div>
                    <div className="w-24 h-px bg-slate-200 relative">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-400"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-slate-900">{bookingData.trip.to}</div>
                    <div className="text-xs font-bold text-slate-400 mt-0.5 uppercase">Điểm đến</div>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <div className="text-xs font-bold text-slate-400 mb-1 flex items-center gap-1"><FiCalendar size={11} /> Ngày đi</div>
                    <div className="text-sm font-bold text-slate-800">{new Date(bookingData.trip.date).toLocaleDateString('vi-VN')}</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <div className="text-xs font-bold text-slate-400 mb-1 flex items-center gap-1"><FiUsers size={11} /> Số ghế</div>
                    <div className="text-sm font-bold text-slate-800">
                      {bookingData.selectedSeats?.length > 0
                        ? `${seatCount} ghế (${bookingData.selectedSeats.join(', ')})`
                        : `${seatCount} hành khách`}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <div className="text-xs font-bold text-slate-400 mb-1">Nhà xe</div>
                    <div className="text-sm font-bold text-slate-800">{bookingData.trip.operator || 'BusGo'}</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <div className="text-xs font-bold text-slate-400 mb-1">Hành khách</div>
                    <div className="text-sm font-bold text-slate-800">
                      {bookingData.passengerInfo?.firstName} {bookingData.passengerInfo?.lastName}
                    </div>
                  </div>
                  {bookingData.cargoInfo?.type !== 'none' && (
                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                      <div className="text-xs font-bold text-orange-400 mb-1">Hàng hóa</div>
                      <div className="text-sm font-bold text-orange-700 capitalize">{bookingData.cargoInfo.type}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-indigo-50 rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-indigo-100 bg-indigo-100/60">
                <h2 className="text-base font-bold text-indigo-900 flex items-center gap-2">
                  <FiLock className="text-indigo-500" /> Chọn phương thức thanh toán
                </h2>
              </div>
              <div className="p-6 space-y-3">
                {Object.entries(PAYMENT_METHODS).map(([key, method]) => (
                  <label
                    key={key}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedPaymentMethod === key
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={key}
                      checked={selectedPaymentMethod === key}
                      onChange={() => setSelectedPaymentMethod(key)}
                      className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-2xl">{method.logo}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{method.name}</span>
                        {method.badge && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full uppercase tracking-wider">
                            {method.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-medium text-slate-500 mt-0.5">{method.description}</div>
                    </div>
                    {selectedPaymentMethod === key && (
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center shrink-0">
                        <FiCheck size={14} />
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Security Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <FiShield className="text-green-500" size={18} />
                <h3 className="font-bold text-slate-800">Bảo mật thanh toán</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: '🔐', title: 'Chứng chỉ SSL', desc: 'Mã hóa 256-bit' },
                  { icon: '🏅', title: 'PCI DSS', desc: 'Tiêu chuẩn v3.2' },
                  { icon: '🛡️', title: 'Bảo mật tuyệt đối', desc: 'Thông tin được mã hóa' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-green-50 rounded-xl p-3">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <div className="text-sm font-bold text-slate-800">{item.title}</div>
                      <div className="text-xs text-slate-500">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary + QR + Action */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-4">

              {/* Price Summary */}
              <div className="bg-amber-50 rounded-2xl shadow-sm border border-amber-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-amber-100 bg-amber-100/60">
                  <h2 className="text-base font-bold text-amber-900">Tóm tắt thanh toán</h2>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Giá vé (×{seatCount})</span>
                    <span className="font-bold text-slate-800">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                        totalAmount - (bookingData.cargoInfo?.estimatedPrice || 0)
                      )}
                    </span>
                  </div>
                  {bookingData.cargoInfo?.type !== 'none' && bookingData.cargoInfo?.estimatedPrice > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Phí hàng hóa</span>
                      <span className="font-bold text-orange-600">
                        +{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(bookingData.cargoInfo.estimatedPrice)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Phí dịch vụ</span>
                    <span className="font-bold text-green-600">Miễn phí</span>
                  </div>
                  <div className="h-px bg-slate-100"></div>
                  <div className="flex justify-between items-center">
                    <span className="font-black text-slate-900">Tổng thanh toán</span>
                    <span className="text-2xl font-black text-blue-600">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex flex-col items-center">
                  <div className="text-sm font-bold text-slate-600 mb-4 text-center">
                    Quét mã để thanh toán qua <span className="text-blue-600">{PAYMENT_METHODS[selectedPaymentMethod]?.name}</span>
                  </div>

                  <div className="p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-sm">
                    {selectedPaymentMethod === 'bank_transfer' ? (
                      <img
                        src={`https://img.vietqr.io/image/BIDV-5811675947-compact2.png?amount=${totalAmount}&addInfo=${bookingId}&accountName=BUSGO`}
                        alt="VietQR"
                        className="w-48 h-48 object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'inline-block'
                        }}
                      />
                    ) : null}
                    <div 
                      className="bg-white p-4 rounded-xl border border-slate-200"
                      style={{ display: selectedPaymentMethod !== 'bank_transfer' ? 'inline-block' : 'none' }}
                    >
                      <QRCode
                        value={qrCodeContent}
                        size={200}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                  </div>
                </div>

                {/* Countdown Timer */}
                <div className={`mt-4 flex items-center justify-center gap-2 text-sm font-bold py-2 rounded-xl ${
                  countdownSeconds <= 60 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  <FiClock />
                  <span>Giữ chỗ còn:</span>
                  <span className="text-base font-black">{formatTime(countdownSeconds)}</span>
                </div>

                {/* Confirm Button */}
                <button
                  onClick={handleConfirmPayment}
                  disabled={confirmLoading || countdownSeconds <= 0}
                  className={`mt-4 w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all ${
                    countdownSeconds <= 0 || confirmLoading
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-900 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
                  }`}
                >
                  {confirmLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang xử lý...
                    </>
                  ) : countdownSeconds <= 0 ? (
                    '⏰ Hết thời gian giữ chỗ'
                  ) : selectedPaymentMethod === 'vnpay' ? (
                    <><FiCheck /> Thanh toán qua VNPay</>
                  ) : (
                    <><FiCheck /> Xác nhận đã chuyển khoản</>
                  )}
                </button>

                {countdownSeconds <= 0 && (
                  <p className="text-center text-xs font-medium text-red-500 mt-2">
                    Vui lòng quay lại và đặt vé lại từ đầu
                  </p>
                )}

                <p className="text-center text-xs text-slate-400 font-medium mt-3">
                  🔒 Giao dịch được bảo mật bởi SSL 256-bit
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Timeout Modal */}
      {showTimeoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-center animate-fade-in-up">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <FiClock className="text-amber-500" size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3">Hết thời gian giữ chỗ</h3>
            <p className="text-slate-600 font-medium mb-8">
              Đã hết thời hạn khóa ghế cho quý khách. Xin quý khách vui lòng đặt vé lại.
            </p>
            <button
              onClick={() => {
                setShowTimeoutModal(false)
                window.location.href = `/booking/${bookingData.trip?.id}`
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-colors"
            >
              Xác nhận quay về Booking
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
