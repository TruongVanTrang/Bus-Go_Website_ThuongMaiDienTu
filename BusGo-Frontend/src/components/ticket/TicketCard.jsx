import QRCode from 'qrcode.react'
import { FiMapPin, FiClock, FiCalendar, FiUser } from 'react-icons/fi'
import './TicketCard.css'

export default function TicketCard({ bookingId, ticketData }) {
  const qrValue = JSON.stringify({
    bookingId,
    trip: ticketData.trip,
    seats: ticketData.selectedSeats,
    passenger: ticketData.passengerInfo
  })

  return (
    <div className="ticket-card-wrapper">
      <div className="ticket-card">
        {/* Ticket Header */}
        <div className="ticket-header">
          <div>
            <div className="ticket-brand">
              <span className="brand-primary">Bus</span>
              <span className="brand-secondary">Go</span>
            </div>
            <div className="ticket-subtitle">VÉ XE ĐIỆN TỬ</div>
          </div>
          <div className="ticket-code">Mã: <strong>{bookingId}</strong></div>
        </div>

        {/* Ticket Body */}
        <div className="ticket-body">
          {/* Route Info */}
          <div className="route-info">
            <div className="route-item">
              <div className="stop-name">{ticketData.trip.from}</div>
              <div className="stop-time">08:00</div>
            </div>
            <div className="route-divider">
              <div className="route-line"></div>
              <div className="route-duration">9h 30m</div>
            </div>
            <div className="route-item">
              <div className="stop-name">{ticketData.trip.to}</div>
              <div className="stop-time">17:30</div>
            </div>
          </div>

          {/* Divider */}
          <div className="ticket-divider"></div>

          {/* Details Grid */}
          <div className="details-grid">
            <div className="detail-item">
              <div className="detail-label">Ngày đi</div>
              <div className="detail-value">{ticketData.trip.date}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Hãng xe</div>
              <div className="detail-value">{ticketData.trip.operator}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Ghế</div>
              <div className="detail-value">{ticketData.selectedSeats.join(', ')}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Hành khách</div>
              <div className="detail-value">
                {ticketData.passengerInfo.firstName} {ticketData.passengerInfo.lastName}
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="qr-section">
            <div className="qr-label">Quét mã QR để nhập xe</div>
            <div className="ticket-qr">
              <QRCode
                value={qrValue}
                size={180}
                level="H"
                includeMargin={true}
                fgColor="#0284c7"
                bgColor="#ffffff"
              />
            </div>
            <div className="qr-info">
              Quét mã này tại quầy làm thủ tục hoặc trên xe
            </div>
          </div>
        </div>

        {/* Ticket Footer */}
        <div className="ticket-footer">
          <div className="footer-text">
            BusGo - Nền tảng tìm kiếm và đặt vé xe bus hiện đại
          </div>
          <div className="footer-info">
            📧 support@busgo.vn | 📱 1900 123 456
          </div>
        </div>
      </div>

      {/* Instruction */}
      <div className="ticket-instruction">
        <div className="instruction-item">
          <div className="instruction-number">1</div>
          <div className="instruction-text">
            <div className="fw-bold">Lưu mã QR</div>
            <div className="small text-muted">Chụp ảnh hoặc sao chép mã QR này</div>
          </div>
        </div>
        <div className="instruction-item">
          <div className="instruction-number">2</div>
          <div className="instruction-text">
            <div className="fw-bold">Xuất trình tại quầy</div>
            <div className="small text-muted">Đến30 phút trước khởi hành</div>
          </div>
        </div>
        <div className="instruction-item">
          <div className="instruction-number">3</div>
          <div className="instruction-text">
            <div className="fw-bold">Lên xe</div>
            <div className="small text-muted">Mang theo CMND hoặc hộ chiếu</div>
          </div>
        </div>
      </div>
    </div>
  )
}
