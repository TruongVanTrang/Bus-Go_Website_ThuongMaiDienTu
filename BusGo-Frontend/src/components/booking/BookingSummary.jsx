import { FiMapPin, FiCalendar, FiClock, FiUsers } from 'react-icons/fi'
import './BookingSummary.css'

export default function BookingSummary({ trip, selectedSeats, onConfirm }) {
  const totalPrice = trip.price * selectedSeats.length

  return (
    <div className="booking-summary">
      <div className="card sticky-top" style={{ top: '100px', backgroundColor: 'white' }}>
        <div className="card-body">
          <h5 className="fw-bold mb-4">Tóm tắt đặt chỗ</h5>

          {/* Trip Details */}
          <div className="summary-section mb-4 pb-4 border-bottom border-neutral-200">
            <div className="d-flex align-items-start gap-3 mb-3">
              <FiMapPin size={20} style={{ color: 'var(--color-primary-600)', marginTop: '4px' }} />
              <div>
                <div className="small text-muted">Tuyến đường</div>
                <div className="fw-600">{trip.from} → {trip.to}</div>
              </div>
            </div>

            <div className="d-flex align-items-start gap-3 mb-3">
              <FiCalendar size={20} style={{ color: 'var(--color-primary-600)', marginTop: '4px' }} />
              <div>
                <div className="small text-muted">Ngày đi</div>
                <div className="fw-600">{trip.date}</div>
              </div>
            </div>

            <div className="d-flex align-items-start gap-3">
              <FiClock size={20} style={{ color: 'var(--color-primary-600)', marginTop: '4px' }} />
              <div>
                <div className="small text-muted">Giờ khởi hành</div>
                <div className="fw-600">{trip.departureTime}</div>
              </div>
            </div>
          </div>

          {/* Selected Seats */}
          <div className="summary-section mb-4 pb-4 border-bottom border-neutral-200">
            <div className="d-flex align-items-center gap-2 mb-3">
              <FiUsers size={20} style={{ color: 'var(--color-primary-600)' }} />
              <div className="fw-600">Ghế đã chọn</div>
            </div>

            {selectedSeats.length > 0 ? (
              <div className="selected-seats">
                {selectedSeats.sort((a, b) => a - b).map((seat, idx) => (
                  <span key={idx} className="seat-badge">
                    {seat}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-muted small alert alert-warning">
                Chưa chọn ghế
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="summary-section mb-4 pb-4 border-bottom border-neutral-200">
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Giá vé ({selectedSeats.length} ghế)</span>
              <span className="fw-600">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(trip.price * selectedSeats.length)}
              </span>
            </div>
            <div className="d-flex justify-content-between mb-3">
              <span className="text-muted">Phí dịch vụ</span>
              <span className="fw-600">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(0)}
              </span>
            </div>
          </div>

          {/* Total */}
          <div className="summary-total mb-4 p-3 rounded" style={{ backgroundColor: 'var(--color-primary-50)' }}>
            <div className="d-flex justify-content-between align-items-center">
              <span className="fw-bold text-neutral-700">Tổng cộng</span>
              <span
                className="fs-5 fw-bold"
                style={{ color: 'var(--color-primary-600)' }}
              >
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}
              </span>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            onClick={onConfirm}
            disabled={selectedSeats.length === 0}
            className="btn w-100 fw-bold"
            style={{
              backgroundColor: selectedSeats.length > 0 ? 'var(--color-primary-600)' : 'var(--color-neutral-300)',
              color: 'white',
              padding: '0.875rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: selectedSeats.length > 0 ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (selectedSeats.length > 0) {
                e.target.style.backgroundColor = 'var(--color-primary-700)'
                e.target.style.transform = 'translateY(-2px)'
              }
            }}
            onMouseLeave={(e) => {
              if (selectedSeats.length > 0) {
                e.target.style.backgroundColor = 'var(--color-primary-600)'
                e.target.style.transform = 'translateY(0)'
              }
            }}
          >
            Xác nhận đặt chỗ
          </button>

          {/* Info Text */}
          <div className="alert alert-info small mt-3 mb-0">
            Bạn sẽ nhận được mã QR code có thể quét tại quầy làm thủ tục hoặc trên xe.
          </div>
        </div>
      </div>
    </div>
  )
}
