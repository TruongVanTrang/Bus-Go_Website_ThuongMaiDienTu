import { useState } from 'react'
import { FiHeart, FiTrash2, FiMapPin, FiClock, FiDollarSign, FiX } from 'react-icons/fi'
import './UserHistory.css'

export default function UserHistory() {
  const [activeTab, setActiveTab] = useState('history')
  const [bookings, setBookings] = useState([
    {
      id: 'BK2024001',
      from: 'Hà Nội',
      to: 'Sài Gòn',
      date: '2024-01-15',
      departureTime: '08:00',
      seats: ['A1'],
      price: 250000,
      status: 'Da thanh toan',
      operator: 'BusGo Express',
      bookingDate: '2024-01-10'
    },
    {
      id: 'BK2024002',
      from: 'Hà Nội',
      to: 'Hải Phòng',
      date: '2024-01-20',
      departureTime: '10:00',
      seats: ['B5'],
      price: 180000,
      status: 'Da thanh toan',
      operator: 'Hải Phòng Express',
      bookingDate: '2024-01-12'
    },
    {
      id: 'BK2024003',
      from: 'Sài Gòn',
      to: 'Đà Nẵng',
      date: '2024-02-28',
      departureTime: '14:00',
      seats: ['C2', 'C3'],
      price: 400000,
      status: 'Da thanh toan',
      operator: 'Premium Transport',
      bookingDate: '2024-01-15'
    }
  ])

  const [watchlist, setWatchlist] = useState([
    {
      id: 'RTE001',
      from: 'Hà Nội',
      to: 'Sài Gòn',
      operator: 'BusGo Express',
      averageRating: 4.5,
      tripCount: 12
    },
    {
      id: 'RTE002',
      from: 'Hà Nội',
      to: 'Đà Nẵng',
      operator: 'Sunshine Express',
      averageRating: 4.3,
      tripCount: 8
    }
  ])

  const [cancelRequest, setCancelRequest] = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(false)

  // Check if cancellation is allowed
  const canCancelBooking = (booking) => {
    const departureDate = new Date(booking.date + ' ' + booking.departureTime)
    const now = new Date()
    return departureDate > now && booking.status === 'Da thanh toan'
  }

  // Calculate refund amount
  const calculateRefund = (booking) => {
    const departureDate = new Date(booking.date + ' ' + booking.departureTime)
    const now = new Date()
    const hoursUntilDeparture = (departureDate - now) / (1000 * 60 * 60)
    
    if (hoursUntilDeparture > 24) {
      return Math.floor(booking.price * 0.9) // 90% refund
    } else if (hoursUntilDeparture > 6) {
      return Math.floor(booking.price * 0.8) // 80% refund
    } else {
      return Math.floor(booking.price * 0.7) // 70% refund
    }
  }

  const handleCancelRequest = (booking) => {
    setCancelRequest(booking)
    setShowCancelModal(true)
  }

  const confirmCancel = () => {
    if (cancelRequest) {
      setBookings(prev =>
        prev.map(b =>
          b.id === cancelRequest.id
            ? { ...b, status: 'Da huy' }
            : b
        )
      )
      setShowCancelModal(false)
      setCancelRequest(null)
    }
  }

  const removeFromWatchlist = (routeId) => {
    setWatchlist(prev => prev.filter(item => item.id !== routeId))
  }

  return (
    <div className="user-history-page">
      <div className="container-fluid px-md-5 px-3 py-5">
        <h1 className="fw-bold mb-4 text-neutral-900">Tài khoản của tôi</h1>

        {/* Tabs */}
        <div className="tabs-container mb-4">
          <div className="tabs-header">
            <button
              className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Lịch sử đặt vé ({bookings.length})
            </button>
            <button
              className={`tab-button ${activeTab === 'watchlist' ? 'active' : ''}`}
              onClick={() => setActiveTab('watchlist')}
            >
              Tuyến xe yêu thích ({watchlist.length})
            </button>
          </div>
        </div>

        {/* Booking History Tab */}
        {activeTab === 'history' && (
          <div className="tab-content">
            {bookings.length > 0 ? (
              <div className="bookings-list">
                {bookings.map(booking => (
                  <div key={booking.id} className="booking-card">
                    {/* Status Badge */}
                    <div className="status-badge" style={{
                      backgroundColor: booking.status === 'Da huy' ? '#ef4444' : '#10b981'
                    }}>
                      {booking.status === 'Da huy' ? 'Đã hủy' : 'Đã thanh toán'}
                    </div>

                    {/* Card Content */}
                    <div className="booking-card-content">
                      {/* Route Info */}
                      <div className="route-section">
                        <div className="route-info">
                          <div className="stop">
                            <div className="stop-time fw-bold">{booking.departureTime}</div>
                            <div className="stop-name text-muted">{booking.from}</div>
                          </div>
                          <div className="route-line">
                            <FiMapPin size={16} style={{ color: '#0066cc' }} />
                          </div>
                          <div className="stop">
                            <div className="stop-time fw-bold">~12:00</div>
                            <div className="stop-name text-muted">{booking.to}</div>
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div style={{ borderLeft: '1px solid #e5e7eb', margin: '0 1.5rem' }}></div>

                      {/* Trip Details */}
                      <div className="trip-details">
                        <div className="detail-row">
                          <span className="label">Ngày:</span>
                          <span className="value fw-600">{booking.date}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Ghế:</span>
                          <span className="value fw-600">{booking.seats.join(', ')}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Nhà xe:</span>
                          <span className="value fw-600">{booking.operator}</span>
                        </div>
                      </div>

                      {/* Divider */}
                      <div style={{ borderLeft: '1px solid #e5e7eb', margin: '0 1.5rem' }}></div>

                      {/* Price & Actions */}
                      <div className="price-action">
                        <div className="price-section">
                          <div className="text-muted small">Giá vé</div>
                          <div className="fw-bold fs-5" style={{ color: '#0066cc' }}>
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.price)}
                          </div>
                        </div>

                        <div className="action-buttons">
                          {canCancelBooking(booking) && booking.status === 'Da thanh toan' && (
                            <button
                              onClick={() => handleCancelRequest(booking)}
                              className="btn-cancel"
                              style={{
                                backgroundColor: '#fee2e2',
                                color: '#dc2626',
                                border: '1px solid #fecaca'
                              }}
                            >
                              <FiX size={16} />
                              Yêu cầu hủy vé
                            </button>
                          )}
                          {!canCancelBooking(booking) && booking.status === 'Da thanh toan' && (
                            <div className="text-muted small" style={{ padding: '0.5rem 0' }}>
                              Không thể hủy (chuyến sắp khởi hành hoặc đã qua)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                <h5 className="fw-bold text-neutral-900 mb-2">Chưa có vé đặt</h5>
                <p className="text-muted mb-4">
                  Bạn chưa đặt vé nào. Hãy bắt đầu tìm kiếm chuyến xe ngay!
                </p>
                <a href="/" className="btn btn-primary" style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}>
                  Tìm chuyến xe
                </a>
              </div>
            )}
          </div>
        )}

        {/* Watchlist Tab */}
        {activeTab === 'watchlist' && (
          <div className="tab-content">
            {watchlist.length > 0 ? (
              <div className="watchlist">
                {watchlist.map(route => (
                  <div key={route.id} className="watchlist-card">
                    <div className="watchlist-content">
                      <div className="route-info">
                        <div className="from-to">
                          <div className="fw-bold fs-5 text-neutral-900">
                            {route.from} <span style={{ color: '#999' }}>→</span> {route.to}
                          </div>
                          <div className="text-muted small">Tuyến xe thường xuyên</div>
                        </div>
                      </div>

                      <div style={{ borderLeft: '1px solid #e5e7eb', margin: '0 1.5rem' }}></div>

                      <div className="route-stats">
                        <div className="stat">
                          <span className="label">Nhà xe:</span>
                          <span className="value">{route.operator}</span>
                        </div>
                        <div className="stat">
                          <span className="label">Đánh giá:</span>
                          <span className="value">⭐ {route.averageRating}</span>
                        </div>
                        <div className="stat">
                          <span className="label">Chuyến:</span>
                          <span className="value">{route.tripCount} chuyến/tháng</span>
                        </div>
                      </div>

                      <div style={{ borderLeft: '1px solid #e5e7eb', margin: '0 1.5rem' }}></div>

                      <div className="watchlist-actions">
                        <button
                          onClick={() => removeFromWatchlist(route.id)}
                          className="btn-remove"
                          style={{
                            backgroundColor: 'white',
                            color: '#ef4444',
                            border: '1px solid #fecaca',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <FiTrash2 size={16} />
                          Xóa khỏi yêu thích
                        </button>
                        <a
                          href={`/search?from=${route.from}&to=${route.to}`}
                          className="btn btn-search"
                          style={{
                            backgroundColor: '#0066cc',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1.5rem',
                            borderRadius: '0.5rem',
                            fontWeight: 600,
                            textDecoration: 'none'
                          }}
                        >
                          Tìm chuyến
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❤️</div>
                <h5 className="fw-bold text-neutral-900 mb-2">Chưa có tuyến yêu thích</h5>
                <p className="text-muted mb-4">
                  Bạn chưa lưu tuyến đường nào vào danh sách yêu thích.
                </p>
                <a href="/" className="btn btn-primary" style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}>
                  Khám phá tuyến đường
                </a>
              </div>
            )}
          </div>
        )}

        {/* Cancel Modal */}
        {showCancelModal && cancelRequest && (
          <div className="cancel-modal-overlay" onClick={() => setShowCancelModal(false)}>
            <div className="cancel-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h5 className="fw-bold text-neutral-900 mb-0">Xác nhận hủy vé</h5>
                <button
                  className="btn-close"
                  onClick={() => setShowCancelModal(false)}
                  style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="booking-summary mb-4">
                  <div className="summary-row">
                    <span>Tuyến đường:</span>
                    <span className="fw-600">{cancelRequest.from} → {cancelRequest.to}</span>
                  </div>
                  <div className="summary-row">
                    <span>Ngày khởi hành:</span>
                    <span className="fw-600">{cancelRequest.date}</span>
                  </div>
                  <div className="summary-row">
                    <span>Số vé:</span>
                    <span className="fw-600">{cancelRequest.seats.join(', ')}</span>
                  </div>
                </div>

                <div className="refund-info" style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #10b981',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div className="fw-bold mb-2 text-neutral-900">Bạn sẽ nhận lại:</div>
                  <div className="fs-5 fw-bold text-success">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                      calculateRefund(cancelRequest)
                    )}
                  </div>
                  <div className="small text-muted mt-2">
                    Chính sách hoàn tiền: Hoàn 90% trước 24h, 80% trong 6-24h, 70% trong 6h cuối
                  </div>
                </div>

                <div className="alert alert-warning p-3 small mb-4" style={{
                  backgroundColor: '#fffbea',
                  border: '1px solid #fde047',
                  borderRadius: '0.5rem'
                }}>
                  ⚠️ Lưu ý: Hành động này không thể hoàn tác. Quá trình hoàn tiền sẽ được xử lý trong 3-5 ngày làm việc.
                </div>
              </div>

              <div className="modal-footer">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="btn btn-outline"
                  style={{
                    backgroundColor: 'white',
                    color: '#666',
                    border: '1px solid #d1d5db',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    fontWeight: 600
                  }}
                >
                  Để lại vé
                </button>
                <button
                  onClick={confirmCancel}
                  className="btn btn-danger"
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    fontWeight: 600
                  }}
                >
                  Xác nhận hủy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
