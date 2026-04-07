import { useLocation, useParams, useNavigate } from 'react-router-dom'
import { FiDownload, FiPrinter, FiShare2, FiCheckCircle } from 'react-icons/fi'
import TicketCard from '../components/ticket/TicketCard'
import './ETicketPage.css'

export default function ETicketPage() {
  const { bookingId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { state } = location

  // Mock ticket data if not coming from booking page
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
    const qrElement = document.querySelector('.ticket-qr svg')
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

  return (
    <div className="eticket-page">
      <div className="container-fluid px-md-5 px-3 py-5">
        {/* Success Message */}
        <div className="alert alert-success mb-4 d-flex align-items-center gap-3" role="alert">
          <FiCheckCircle size={28} />
          <div>
            <div className="fw-bold">Đặt chỗ thành công!</div>
            <div className="small">Mã đặt chỗ của bạn: <strong>{bookingId}</strong></div>
          </div>
        </div>

        {/* Main Ticket */}
        <div className="row gap-4 mb-5">
          <div className="col-lg-8">
            <TicketCard bookingId={bookingId} ticketData={ticketData} />
          </div>

          {/* Actions */}
          <div className="col-lg-4">
            <div className="card sticky-top" style={{ top: '100px', backgroundColor: 'white' }}>
              <div className="card-body">
                <h5 className="fw-bold mb-4">Thao tác</h5>

                <button
                  onClick={handleDownload}
                  className="btn w-100 mb-3 d-flex align-items-center justify-content-center gap-2"
                  style={{
                    backgroundColor: 'var(--color-primary-600)',
                    color: 'white',
                    padding: '0.75rem'
                  }}
                >
                  <FiDownload size={20} />
                  Tải vé
                </button>

                <button
                  onClick={handlePrint}
                  className="btn w-100 mb-3 d-flex align-items-center justify-content-center gap-2"
                  style={{
                    backgroundColor: 'white',
                    color: 'var(--color-primary-600)',
                    border: '2px solid var(--color-primary-600)',
                    padding: '0.75rem'
                  }}
                >
                  <FiPrinter size={20} />
                  In vé
                </button>

                <button
                  className="btn w-100 mb-3 d-flex align-items-center justify-content-center gap-2"
                  style={{
                    backgroundColor: 'white',
                    color: 'var(--color-secondary-600)',
                    border: '2px solid var(--color-secondary-600)',
                    padding: '0.75rem'
                  }}
                >
                  <FiShare2 size={20} />
                  Chia sẻ
                </button>

                <div className="alert alert-info small mt-4 mb-0">
                  <div className="fw-bold mb-2">💡 Gợi ý:</div>
                  <ul className="mb-0 ps-3">
                    <li>Lưu mã QR trên điện thoại</li>
                    <li>Xuất trình vé trước 30 phút</li>
                    <li>Mang CMND khi lên xe</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="row">
          <div className="col-lg-8">
            <div className="card" style={{ backgroundColor: 'white' }}>
              <div className="card-body">
                <h5 className="fw-bold mb-4">Những bước tiếp theo</h5>

                <div className="timeline">
                  <div className="timeline-item mb-4">
                    <div className="timeline-number active">1</div>
                    <div className="timeline-content">
                      <div className="fw-bold">Lưu vé</div>
                      <p className="text-muted small mb-0">
                        Vui lòng lưu mã QR code của vé hoặc in vé trước 24 giờ khởi hành.
                      </p>
                    </div>
                  </div>

                  <div className="timeline-item mb-4">
                    <div className="timeline-number">2</div>
                    <div className="timeline-content">
                      <div className="fw-bold">Xuất trình tại quầy</div>
                      <p className="text-muted small mb-0">
                        Đến quầy làm thủ tục 30 phút trước giờ khởi hành để xuất trình vé.
                      </p>
                    </div>
                  </div>

                  <div className="timeline-item">
                    <div className="timeline-number">3</div>
                    <div className="timeline-content">
                      <div className="fw-bold">Lên xe</div>
                      <p className="text-muted small mb-0">
                        Mang theo CMND hoặc hộ chiếu khi lên xe, ghế ngồi của bạn đã được đặt trước.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Back to Home Button */}
            <button
              onClick={() => navigate('/')}
              className="btn w-100 mt-4"
              style={{
                backgroundColor: 'var(--color-secondary-600)',
                color: 'white',
                padding: '0.875rem',
                fontWeight: 600
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
