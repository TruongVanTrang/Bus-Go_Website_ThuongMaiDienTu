// 1. Lấy useState và useEffect từ 'react'
import { useState, useEffect } from 'react'

// 2. Lấy các hook điều hướng từ 'react-router-dom'
import { useLocation, useParams, useNavigate } from "react-router-dom"

// 3. Các thư viện icon và component, CSS giữ nguyên
import { FiDownload, FiPrinter, FiShare2, FiCheckCircle, FiAlertCircle } from 'react-icons/fi'
import TicketCard from '../components/ticket/TicketCard'
import './ETicketPage.css'

export default function ETicketPage() {
  const { bookingId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { state } = location
  const [paymentVerified, setPaymentVerified] = useState(false)
  const [verifying, setVerifying] = useState(true)

  // Check payment status on component mount
  useEffect(() => {
    // In a real app, this would be an API call to verify payment status
    if (state?.paymentStatus === 'Da thanh toan') {
      setPaymentVerified(true)
    }
    
    // Simulate payment verification delay
    const timer = setTimeout(() => {
      setVerifying(false)
      if (!state?.paymentStatus || state?.paymentStatus !== 'Da thanh toan') {
        // Payment not verified, redirect to payment page
        navigate('/payment', { state })
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [state, navigate])

  // Mock ticket data if not coming from payment page
  const ticketData = state || {
    trip: {
      from: 'Hà Nội',
      to: 'Sài Gòn',
      date: '2024-01-15',
      departureTime: '08:00',
      operator: 'BusGo Express'
    },
    selectedSeats: ['A1', 'A2'],
    passengerInfo: {
      firstName: 'Nguyễn',
      lastName: 'Văn A'
    }
  }

  const handleDownload = () => {
    const canvas = document.querySelector('.ticket-qr canvas')
    
    if (canvas) {
      const url = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = url
      link.download = `ticket-${bookingId}.png`
      link.click()
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BusGo Ticket',
          text: `Vé xe bus từ ${ticketData.trip.from} đến ${ticketData.trip.to}`,
          url: window.location.href
        })
      } catch (err) {
        console.log('Share cancelled:', err)
      }
    } else {
      // Fallback: Copy booking ID to clipboard
      navigator.clipboard.writeText(bookingId)
      alert('Mã đặt chỗ đã được sao chép!')
    }
  }

  if (verifying) {
    return (
      <div className="eticket-page">
        <div className="container-fluid px-md-5 px-3 d-flex align-items-center justify-content-center min-vh-100">
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <h5 className="fw-bold text-neutral-900 mb-2">Đang xác thực vé...</h5>
            <p className="text-muted small">Vui lòng chờ trong giây lát</p>
          </div>
        </div>
      </div>
    )
  }

  if (!paymentVerified) {
    return (
      <div className="eticket-page">
        <div className="container-fluid px-md-5 px-3 d-flex align-items-center justify-content-center min-vh-100">
          <div className="text-center">
            <FiAlertCircle size={60} className="text-danger mb-3" />
            <h5 className="fw-bold text-neutral-900 mb-2">Thanh toán chưa xác nhận</h5>
            <p className="text-muted mb-4">
              Vé của bạn chưa được kích hoạt. Vui lòng hoàn tất thanh toán để nhận vé điện tử.
            </p>
            <button
              onClick={() => navigate('/payment', { state })}
              className="btn btn-primary"
              style={{
                backgroundColor: '#0066cc',
                borderColor: '#0066cc',
                padding: '0.75rem 2rem'
              }}
            >
              Tiếp tục thanh toán
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="eticket-page">
      
      {/* =========================================================
          STYLE IN ẤN: CHO PHÉP IN VÉ + HƯỚNG DẪN 3 BƯỚC
      ========================================================== */}
      <style media="print">{`
        @page {
          size: auto;
          margin: 10mm 15mm; /* Lề trên/dưới 10mm, lề trái/phải 15mm */
        }
        
        /* 1. RESET TOÀN BỘ CHIỀU CAO VÀ KHOẢNG TRỐNG CỦA TRANG */
        html, body, #root, .eticket-page {
          height: auto !important;
          min-height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          background-color: white !important;
        }

        /* 2. ẨN CÁC PHẦN RÂU RIA */
        .alert-success, 
        .col-lg-3, 
        button,
        header, 
        nav, 
        footer,
        .navbar {
          display: none !important;
        }

        /* 3. PHÁ VỠ FLEXBOX: Chuyển thẻ bọc thành Block để không bị đẩy trang */
        .container-fluid, .row, .col-lg-9 {
          display: block !important; 
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        /* 4. CĂN GIỮA VÉ VÀ HƯỚNG DẪN */
        .ticket-card-wrapper, .card {
          display: block !important;
          width: 100% !important;
          max-width: 650px !important;
          margin: 15px auto 20px auto !important; /* Căn giữa tuyệt đối, cách đỉnh 15px để không bị lẹm */
          page-break-before: avoid !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        /* 5. TỐI ƯU MỰC IN */
        .ticket-card, .card {
          box-shadow: none !important;
          border: 2px solid #000 !important;
        }
        .text-muted, .text-neutral-900 {
          color: #222 !important;
        }
        .bg-primary {
          background-color: #fff !important;
          color: #000 !important;
          border: 2px solid #000 !important;
        }
        .text-white {
          color: #000 !important;
        }
      `}</style>
      {/* ========================================================= */}

      <div className="container-fluid px-md-5 px-3 py-5">
        {/* Success Message */}
        <div className="alert alert-success mb-5 d-flex align-items-center gap-3" role="alert" style={{ borderRadius: '0.75rem' }}>
          <div style={{ flexShrink: 0 }}>
            <FiCheckCircle size={32} style={{ color: '#10b981' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="fw-bold text-neutral-900">Thanh toán thành công - Vé đã kích hoạt!</div>
            <div className="small text-muted">Mã đặt chỗ: <strong>{bookingId}</strong></div>
          </div>
        </div>

        {/* Main Ticket + Actions Layout */}
        <div className="row g-3 mb-4">
          {/* Main Ticket - 70% */}
          <div className="col-lg-9">
            <TicketCard bookingId={bookingId} ticketData={ticketData} />
          </div>

          {/* Action Sidebar - 30% */}
          <div className="col-lg-3">
            <div className="card h-100 sticky-top actions" style={{ top: '100px', borderRadius: '0.75rem' }}>
              <div className="card-body p-4">
                <h5 className="fw-bold mb-4 text-neutral-900">Thao tác với vé</h5>

                <button
                  onClick={handleDownload}
                  className="btn btn-action w-100 mb-3 d-flex align-items-center justify-content-center gap-2"
                  style={{
                    backgroundColor: '#0066cc',
                    color: 'white',
                    padding: '0.85rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    fontWeight: 600,
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#0052a3'
                    e.target.style.boxShadow = '0 4px 12px rgba(0, 102, 204, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#0066cc'
                    e.target.style.boxShadow = 'none'
                  }}
                >
                  <FiDownload size={20} />
                  Tải vé
                </button>

                <button
                  onClick={handlePrint}
                  className="btn btn-action-outline w-100 mb-3 d-flex align-items-center justify-content-center gap-2"
                  style={{
                    backgroundColor: 'white',
                    color: '#0066cc',
                    border: '2px solid #0066cc',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    fontWeight: 600,
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f0f7ff'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'white'
                  }}
                >
                  <FiPrinter size={20} />
                  In vé
                </button>

                <button
                  onClick={handleShare}
                  className="btn btn-action-secondary w-100 mb-4 d-flex align-items-center justify-content-center gap-2"
                  style={{
                    backgroundColor: 'white',
                    color: '#666666',
                    border: '2px solid #e5e7eb',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    fontWeight: 600,
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f9fafb'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'white'
                  }}
                >
                  <FiShare2 size={20} />
                  Chia sẻ
                </button>

                <div className="alert alert-info small p-3" style={{ backgroundColor: '#f0f7ff', border: '1px solid #0066cc', borderRadius: '0.5rem' }}>
                  <div className="fw-bold mb-2 text-neutral-900">💡 Hướng dẫn quan trọng:</div>
                  <ul className="mb-0 ps-3 text-neutral-700">
                    <li>Lưu mã QR trên điện thoại</li>
                    <li>Xuất trình vé trước 30 phút</li>
                    <li>Mang theo CMND khi lên xe</li>
                    <li>Kiểm tra thời gian khởi hành</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps - HƯỚNG DẪN ĐƯỢC IN KÈM THEO VÉ */}
        <div className="row">
          <div className="col-lg-9">
            <div className="card" style={{ borderRadius: '0.75rem', border: '1px solid #e5e7eb' }}>
              <div className="card-body p-4">
                <h5 className="fw-bold mb-4 text-neutral-900">Quy trình tiếp theo</h5>

                {/* Lưới 3 cột ngang */}
                <div className="row g-4">
                  {/* Bước 1 */}
                  <div className="col-md-4">
                    <div className="d-flex flex-column align-items-center text-center">
                      <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mb-3 shadow-sm" style={{ width: '45px', height: '45px', fontSize: '1.2rem', fontWeight: 'bold' }}>1</div>
                      <div className="fw-bold text-neutral-900 mb-2">Lưu hoặc in vé</div>
                      <p className="text-muted small mb-0 px-2">
                        Lưu vé trên điện thoại hoặc in vé từ bây giờ. Bạn có thể lấy bất cứ lúc nào trước chuyến xe.
                      </p>
                    </div>
                  </div>

                  {/* Bước 2 */}
                  <div className="col-md-4">
                    <div className="d-flex flex-column align-items-center text-center">
                      <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mb-3 shadow-sm" style={{ width: '45px', height: '45px', fontSize: '1.2rem', fontWeight: 'bold' }}>2</div>
                      <div className="fw-bold text-neutral-900 mb-2">Xuất trình tại quầy</div>
                      <p className="text-muted small mb-0 px-2">
                        Đến bến xe 30 phút trước giờ khởi hành. Xuất trình mã QR hoặc vé in tại quầy làm thủ tục.
                      </p>
                    </div>
                  </div>

                  {/* Bước 3 */}
                  <div className="col-md-4">
                    <div className="d-flex flex-column align-items-center text-center">
                      <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mb-3 shadow-sm" style={{ width: '45px', height: '45px', fontSize: '1.2rem', fontWeight: 'bold' }}>3</div>
                      <div className="fw-bold text-neutral-900 mb-2">Lên xe</div>
                      <p className="text-muted small mb-0 px-2">
                        Mang theo CMND/Hộ chiếu để xác nhận và lên xe. Ghế đã được đặt sẵn cho bạn.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Back to Home Button */}
            <button
              onClick={() => navigate('/')}
              className="btn w-100 mt-4 shadow-sm"
              style={{
                backgroundColor: '#0066cc',
                color: 'white',
                padding: '0.85rem',
                fontWeight: 600,
                borderRadius: '0.5rem',
                border: 'none',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#0052a3'
                e.target.style.boxShadow = '0 4px 12px rgba(0, 102, 204, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#0066cc'
                e.target.style.boxShadow = 'none'
              }}
            >
              ← Quay về trang chủ
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}