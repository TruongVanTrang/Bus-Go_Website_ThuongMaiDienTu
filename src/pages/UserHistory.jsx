import { useState, useEffect } from 'react'
import { FiHeart, FiTrash2, FiMapPin, FiClock, FiDollarSign, FiX, FiDownload, FiBell, FiCheckCircle, FiLoader } from 'react-icons/fi'
import QRCode from 'qrcode.react'
import './UserHistory.css'

export default function UserHistory() {
  const [activeTab, setActiveTab] = useState('history')
  const [statusFilter, setStatusFilter] = useState('all') // all, upcoming, completed, cancelled
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelRequest, setCancelRequest] = useState(null)

  const [bookings, setBookings] = useState([
    {
      id: 'BK2024001',
      from: 'Hà Nội',
      to: 'Sài Gòn',
      date: '2026-04-15',
      departureTime: '08:00',
      seats: ['A1'],
      price: 250000,
      status: 'Da thanh toan',
      operator: 'BusGo Express',
      bookingDate: '2026-04-01',
      passengerName: 'Nguyễn Văn A',
      email: 'nguyenvana@email.com',
      phone: '0912345678',
      cargoInfo: {
        type: 'light',
        description: 'Hàng nhẹ/Tài liệu (<10kg)',
        weight: 5,
        price: 40000
      },
      trackingStatus: 'delivered',
      trackingInfo: {
        accepted: { time: '08:30', location: 'Bến xe Giáp Bát, Hà Nội' },
        in_transit: { time: '10:45', location: 'Trạm Phú Thọ' },
        delivered: { time: '18:20', location: 'Bến xe Miền Đông, TP.HCM' }
      },
      notifications: [
        { type: 'info', message: 'Hàng đã được nhà xe giao nhận lúc 08:30', time: '08:30' },
        { type: 'info', message: 'Hàng đang trong quá trình vận chuyển, dự kiến về đích 18:00', time: '10:45' }
      ]
    },
    {
      id: 'BK2024002',
      from: 'Hà Nội',
      to: 'Hải Phòng',
      date: '2026-04-20',
      departureTime: '10:00',
      seats: ['B5'],
      price: 180000,
      status: 'Da thanh toan',
      operator: 'Hải Phòng Express',
      bookingDate: '2026-04-10',
      passengerName: 'Trần Thị B',
      email: 'tranthib@email.com',
      phone: '0987654321',
      cargoInfo: {
        type: 'motorcycle',
        description: 'Gửi xe máy thông thường',
        weight: null,
        price: 300000
      },
      trackingStatus: 'in_transit',
      trackingInfo: {
        accepted: { time: '10:30', location: 'Bến xe Giáp Bát, Hà Nội' },
        in_transit: { time: '12:00', location: 'Đang vận chuyển...' }
      },
      notifications: [
        { type: 'warning', message: 'Xe máy của bạn sắp tới điểm đích', time: '12:00' }
      ]
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
      bookingDate: '2024-02-15',
      passengerName: 'Lê Văn C',
      email: 'levanc@email.com',
      phone: '0922333444',
      cargoInfo: {
        type: 'none',
        description: 'Không có',
        weight: null,
        price: 0
      },
      trackingStatus: 'completed',
      notifications: [
        { type: 'success', message: 'Chuyến xe đã hoàn tất, cảm ơn đã sử dụng dịch vụ của BusGo', time: '20:45' }
      ]
    },
    {
      id: 'BK2024004',
      from: 'Đà Nẵng',
      to: 'Hà Nội',
      date: '2026-04-25',
      departureTime: '06:00',
      seats: ['D1', 'D2'],
      price: 350000,
      status: 'Da huy',
      operator: 'BusGo Express',
      bookingDate: '2026-04-15',
      passengerName: 'Phạm Minh D',
      email: 'phamminihd@email.com',
      phone: '0933444555',
      cargoInfo: {
        type: 'none',
        description: 'Không có',
        weight: null,
        price: 0
      },
      refundAmount: 175000,
      notifications: [
        { type: 'info', message: 'Yêu cầu hủy vé đã được phê duyệt', time: '16:30' },
        { type: 'info', message: 'Tiền hoàn lại: 175.000đ sẽ chuyển về tài khoản trong 2-3 ngày', time: '16:31' }
      ]
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

  // Load watchlist from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('busgo_favorites')
    if (savedFavorites) {
      try {
        const favorites = JSON.parse(savedFavorites)
        // Convert favorites to unique routes for watchlist
        const uniqueRoutes = []
        const routeSet = new Set()
        
        favorites.forEach(fav => {
          const routeKey = `${fav.from}-${fav.to}`
          if (!routeSet.has(routeKey)) {
            routeSet.add(routeKey)
            uniqueRoutes.push({
              id: fav.id,
              from: fav.from,
              to: fav.to,
              operator: fav.operator,
              averageRating: fav.averageRating,
              tripCount: fav.tripCount
            })
          }
        })
        
        if (uniqueRoutes.length > 0) {
          setWatchlist(uniqueRoutes)
        }
      } catch (e) {
        console.error('Error loading favorites:', e)
      }
    }
  }, [])

  // Get trip status (upcoming, completed, cancelled)
  const getTripStatus = (booking) => {
    if (booking.status === 'Da huy') return 'cancelled'
    
    const departureDate = new Date(booking.date + ' ' + booking.departureTime)
    const now = new Date()
    
    if (departureDate > now) return 'upcoming'
    return 'completed'
  }

  // Filter bookings by status
  const filteredBookings = bookings.filter(booking => {
    if (statusFilter === 'all') return true
    return getTripStatus(booking) === statusFilter
  })

  // Check if cancellation is allowed
  const canCancelBooking = (booking) => {
    const departureDate = new Date(booking.date + ' ' + booking.departureTime)
    const now = new Date()
    return departureDate > now && booking.status === 'Da thanh toan'
  }

  // Calculate refund amount based on cancellation policy
  const calculateRefund = (booking) => {
    const departureDate = new Date(booking.date + ' ' + booking.departureTime)
    const now = new Date()
    const hoursUntilDeparture = (departureDate - now) / (1000 * 60 * 60)
    const totalPrice = booking.price + (booking.cargoInfo?.price || 0)
    
    if (hoursUntilDeparture > 24) {
      return Math.floor(totalPrice * 1.0) // 100% refund
    } else if (hoursUntilDeparture > 12) {
      return Math.floor(totalPrice * 0.5) // 50% refund
    } else {
      return 0 // No refund
    }
  }

  // Get time until departure
  const getTimeUntilDeparture = (booking) => {
    const departureDate = new Date(booking.date + ' ' + booking.departureTime)
    const now = new Date()
    const diff = departureDate - now
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days} ngày ${hours} giờ`
    if (hours > 0) return `${hours} giờ`
    return 'Sắp khởi hành'
  }

  const openDetailModal = (booking) => {
    setSelectedBooking(booking)
    setShowDetailModal(true)
  }

  const handleCancelRequest = (booking) => {
    setCancelRequest(booking)
    setShowCancelModal(true)
  }

  const confirmCancel = () => {
    if (cancelRequest) {
      const refundAmount = calculateRefund(cancelRequest)
      setBookings(prev =>
        prev.map(b =>
          b.id === cancelRequest.id
            ? { ...b, status: 'Da huy', refundAmount }
            : b
        )
      )
      setShowCancelModal(false)
      setCancelRequest(null)
    }
  }

  const removeFromWatchlist = (routeId) => {
    const updatedWatchlist = watchlist.filter(item => item.id !== routeId)
    setWatchlist(updatedWatchlist)
    
    // Also remove from localStorage
    const savedFavorites = localStorage.getItem('busgo_favorites')
    if (savedFavorites) {
      const favorites = JSON.parse(savedFavorites)
      const routeToRemove = watchlist.find(w => w.id === routeId)
      if (routeToRemove) {
        const updatedFavorites = favorites.filter(
          fav => !(fav.from === routeToRemove.from && fav.to === routeToRemove.to)
        )
        localStorage.setItem('busgo_favorites', JSON.stringify(updatedFavorites))
      }
    }
  }

  // Get status badge info
  const getStatusBadgeInfo = (booking) => {
    const status = getTripStatus(booking)
    const baseStyle = { padding: '0.4rem 0.8rem', borderRadius: '0.5rem', color: 'white', fontSize: '0.75rem', fontWeight: 700 }
    
    if (booking.status === 'Da huy') {
      return { ...baseStyle, backgroundColor: '#ef4444', text: 'Đã hủy' }
    }
    
    if (status === 'upcoming') {
      return { ...baseStyle, backgroundColor: '#f59e0b', text: 'Sắp khởi hành' }
    }
    
    return { ...baseStyle, backgroundColor: '#10b981', text: 'Đã hoàn thành' }
  }

  return (
    <div className="user-history-page">
      <div className="container-fluid px-md-5 px-3 py-5">
        <h1 className="fw-bold mb-4 text-neutral-900">Lịch sử đặt vé</h1>

        {/* Tabs */}
        <div className="tabs-container mb-4">
          <div className="tabs-header">
            <button
              className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Chuyến xe ({bookings.length})
            </button>
            <button
              className={`tab-button ${activeTab === 'watchlist' ? 'active' : ''}`}
              onClick={() => setActiveTab('watchlist')}
            >
              Tuyến yêu thích ({watchlist.length})
            </button>
          </div>
        </div>

        {/* Booking History Tab */}
        {activeTab === 'history' && (
          <div className="tab-content">
            {/* Status Filter */}
            <div className="status-filter-container mb-4">
              <button
                className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                Tất cả ({bookings.length})
              </button>
              <button
                className={`filter-btn ${statusFilter === 'upcoming' ? 'active' : ''}`}
                onClick={() => setStatusFilter('upcoming')}
              >
                Sắp khởi hành ({bookings.filter(b => getTripStatus(b) === 'upcoming').length})
              </button>
              <button
                className={`filter-btn ${statusFilter === 'completed' ? 'active' : ''}`}
                onClick={() => setStatusFilter('completed')}
              >
                Đã hoàn thành ({bookings.filter(b => getTripStatus(b) === 'completed').length})
              </button>
              <button
                className={`filter-btn ${statusFilter === 'cancelled' ? 'active' : ''}`}
                onClick={() => setStatusFilter('cancelled')}
              >
                Đã hủy ({bookings.filter(b => getTripStatus(b) === 'cancelled').length})
              </button>
            </div>

            {filteredBookings.length > 0 ? (
              <div className="bookings-list">
                {filteredBookings.map(booking => {
                  const statusBadge = getStatusBadgeInfo(booking)
                  const totalPrice = booking.price + (booking.cargoInfo?.price || 0)
                  
                  return (
                    <div key={booking.id} className="booking-card">
                      {/* Status Badge */}
                      <div className="status-badge" style={statusBadge}>
                        {statusBadge.text}
                      </div>

                      {/* Card Content */}
                      <div className="booking-card-content">
                        {/* Booking ID */}
                        <div className="booking-id-section">
                          <div className="small text-muted">Mã vé</div>
                          <div className="fw-bold">{booking.id}</div>
                        </div>

                        {/* Divider */}
                        <div className="divider"></div>

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
                        <div className="divider"></div>

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
                          {booking.cargoInfo?.type !== 'none' && (
                            <div className="detail-row">
                              <span className="label">Hàng:</span>
                              <span className="value fw-600 badge bg-info">{booking.cargoInfo.description}</span>
                            </div>
                          )}
                        </div>

                        {/* Divider */}
                        <div className="divider"></div>

                        {/* Price & Actions */}
                        <div className="price-action">
                          <div className="price-section">
                            <div className="text-muted small">Tổng tiền</div>
                            <div className="fw-bold fs-5" style={{ color: '#0066cc' }}>
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}
                            </div>
                            {getTripStatus(booking) === 'upcoming' && (
                              <div className="time-remaining">
                                <FiClock size={12} />
                                {getTimeUntilDeparture(booking)}
                              </div>
                            )}
                          </div>

                          <div className="action-buttons">
                            <button
                              onClick={() => openDetailModal(booking)}
                              className="btn-action btn-detail"
                              style={{
                                backgroundColor: '#f0f7ff',
                                color: '#0066cc',
                                border: '1px solid #0066cc'
                              }}
                            >
                              <FiDownload size={16} />
                              Chi tiết & Hóa đơn
                            </button>

                            {canCancelBooking(booking) && (
                              <button
                                onClick={() => handleCancelRequest(booking)}
                                className="btn-action btn-cancel"
                                style={{
                                  backgroundColor: '#fee2e2',
                                  color: '#dc2626',
                                  border: '1px solid #fecaca'
                                }}
                              >
                                <FiX size={16} />
                                Hủy vé
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                <h5 className="fw-bold text-neutral-900 mb-2">Không có vé</h5>
                <p className="text-muted mb-4">Chưa có chuyến xe nào với trạng thái này.</p>
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

                      <div className="divider"></div>

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

                      <div className="divider"></div>

                      <div className="watchlist-actions">
                        <button
                          onClick={() => removeFromWatchlist(route.id)}
                          className="btn-action"
                          style={{
                            backgroundColor: 'white',
                            color: '#ef4444',
                            border: '1px solid #fecaca'
                          }}
                        >
                          <FiTrash2 size={16} />
                          Xóa
                        </button>
                        <a
                          href={`/search?from=${route.from}&to=${route.to}`}
                          className="btn-action"
                          style={{
                            backgroundColor: '#0066cc',
                            color: 'white',
                            border: 'none',
                            textDecoration: 'none'
                          }}
                        >
                          Tìm chuyến xe
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💔</div>
                <h5 className="fw-bold text-neutral-900 mb-2">Chưa có tuyến yêu thích</h5>
                <p className="text-muted mb-4">Hãy thêm tuyến xe yêu thích của bạn để theo dõi!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedBooking && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="fw-bold">Chi tiết vé & Hóa đơn</h3>
              <button
                className="modal-close"
                onClick={() => setShowDetailModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {/* QR Code Section */}
              <div className="qr-section text-center mb-4">
                <h6 className="fw-bold mb-3">Mã QR vé di động</h6>
                <div className="qr-container p-3 bg-light rounded">
                  <QRCode
                    value={JSON.stringify({
                      bookingId: selectedBooking.id,
                      passenger: selectedBooking.passengerName,
                      from: selectedBooking.from,
                      to: selectedBooking.to,
                      date: selectedBooking.date,
                      time: selectedBooking.departureTime
                    })}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="small text-muted mt-2">Sử dụng khi lên xe hoặc nhận hàng</div>
              </div>

              {/* Invoice Information */}
              <div className="invoice-section">
                <h6 className="fw-bold mb-3 border-bottom pb-2">Thông tin hóa đơn</h6>
                
                <div className="invoice-grid">
                  <div className="invoice-item">
                    <span className="label">Mã vận đơn:</span>
                    <span className="value">{selectedBooking.id}</span>
                  </div>
                  <div className="invoice-item">
                    <span className="label">Hành khách:</span>
                    <span className="value">{selectedBooking.passengerName}</span>
                  </div>
                  <div className="invoice-item">
                    <span className="label">Email:</span>
                    <span className="value">{selectedBooking.email}</span>
                  </div>
                  <div className="invoice-item">
                    <span className="label">Điện thoại:</span>
                    <span className="value">{selectedBooking.phone}</span>
                  </div>
                  <div className="invoice-item">
                    <span className="label">Tuyến đường:</span>
                    <span className="value">{selectedBooking.from} → {selectedBooking.to}</span>
                  </div>
                  <div className="invoice-item">
                    <span className="label">Ngày khởi hành:</span>
                    <span className="value">{selectedBooking.date} {selectedBooking.departureTime}</span>
                  </div>
                  <div className="invoice-item">
                    <span className="label">Nhà xe:</span>
                    <span className="value">{selectedBooking.operator}</span>
                  </div>
                  <div className="invoice-item">
                    <span className="label">Ghế:</span>
                    <span className="value">{selectedBooking.seats.join(', ')}</span>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="cost-breakdown mt-4 p-3 bg-light rounded">
                  <h6 className="fw-bold mb-3">Chi tiết chi phí</h6>
                  <div className="cost-row">
                    <span>Giá vé ({selectedBooking.seats.length} ghế):</span>
                    <span className="fw-bold">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedBooking.price)}
                    </span>
                  </div>
                  {selectedBooking.cargoInfo?.type !== 'none' && (
                    <>
                      <div className="cost-row">
                        <span>Loại hàng:</span>
                        <span className="fw-bold">{selectedBooking.cargoInfo.description}</span>
                      </div>
                      {selectedBooking.cargoInfo.weight && (
                        <div className="cost-row">
                          <span>Cân nặng:</span>
                          <span className="fw-bold">{selectedBooking.cargoInfo.weight} kg</span>
                        </div>
                      )}
                      <div className="cost-row">
                        <span>Cước hàng hóa:</span>
                        <span className="fw-bold">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedBooking.cargoInfo.price)}
                        </span>
                      </div>
                    </>
                  )}
                  <hr className="my-2" />
                  <div className="cost-row fw-bold">
                    <span>Tổng cộng:</span>
                    <span style={{ color: '#0066cc', fontSize: '1.1rem' }}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                        selectedBooking.price + (selectedBooking.cargoInfo?.price || 0)
                      )}
                    </span>
                  </div>
                </div>

                {/* Cargo Tracking Timeline - Chỉ hiển thị khi chuyến đã hoàn thành hoặc đã hủy */}
                {selectedBooking.cargoInfo?.type !== 'none' && getTripStatus(selectedBooking) !== 'upcoming' && (
                  <div className="cargo-tracking mt-4">
                    <h6 className="fw-bold mb-3">Theo dõi hàng hóa</h6>
                    <div className="timeline">
                      <div className="timeline-item completed">
                        <div className="timeline-marker">
                          <FiCheckCircle size={20} />
                        </div>
                        <div className="timeline-content">
                          <div className="fw-bold">Nhà xe đã nhận hàng</div>
                          <div className="small text-muted">{selectedBooking.trackingInfo.accepted.time}</div>
                          <div className="small text-muted">{selectedBooking.trackingInfo.accepted.location}</div>
                        </div>
                      </div>

                      {selectedBooking.trackingInfo.in_transit && (
                        <div className={`timeline-item ${selectedBooking.trackingStatus === 'in_transit' ? 'in-progress' : 'completed'}`}>
                          <div className="timeline-marker">
                            {selectedBooking.trackingStatus === 'in_transit' ? <FiLoader size={20} /> : <FiCheckCircle size={20} />}
                          </div>
                          <div className="timeline-content">
                            <div className="fw-bold">Đang giao hàng</div>
                            <div className="small text-muted">{selectedBooking.trackingInfo.in_transit.time}</div>
                            <div className="small text-muted">{selectedBooking.trackingInfo.in_transit.location}</div>
                          </div>
                        </div>
                      )}

                      {selectedBooking.trackingInfo.delivered && (
                        <div className={`timeline-item ${selectedBooking.trackingStatus === 'delivered' ? 'completed' : ''}`}>
                          <div className="timeline-marker">
                            <FiCheckCircle size={20} />
                          </div>
                          <div className="timeline-content">
                            <div className="fw-bold">Đã giao thành công</div>
                            <div className="small text-muted">{selectedBooking.trackingInfo.delivered.time}</div>
                            <div className="small text-muted">{selectedBooking.trackingInfo.delivered.location}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notifications */}
                {selectedBooking.notifications && selectedBooking.notifications.length > 0 && (
                  <div className="notifications-section mt-4">
                    <h6 className="fw-bold mb-3">
                      <FiBell size={18} className="me-2" />
                      Thông báo từ nhà xe
                    </h6>
                    <div className="notifications-list">
                      {selectedBooking.notifications.map((notif, idx) => (
                        <div key={idx} className={`notification-item notification-${notif.type}`}>
                          <div className="notification-time small">{notif.time}</div>
                          <div className="notification-message">{notif.message}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowDetailModal(false)}
                className="btn"
                style={{ backgroundColor: '#0066cc', color: 'white', border: 'none', padding: '0.75rem 1.5rem' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {showCancelModal && cancelRequest && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="fw-bold">Xác nhận hủy vé</h3>
              <button
                className="modal-close"
                onClick={() => setShowCancelModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="alert alert-info mb-3">
                <strong>Chính sách hoàn tiền:</strong>
                <ul className="mb-0 mt-2">
                  <li>Trước 24h: Hoàn 100%</li>
                  <li>Trước 12h: Hoàn 50%</li>
                  <li>Sau đó: Không hoàn</li>
                </ul>
              </div>

              <div className="refund-info p-3 bg-light rounded mb-3">
                <div className="refund-row">
                  <span>Tổng giá vé:</span>
                  <span className="fw-bold">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                      cancelRequest.price + (cancelRequest.cargoInfo?.price || 0)
                    )}
                  </span>
                </div>
                <div className="refund-row">
                  <span>Số tiền hoàn lại:</span>
                  <span className="fw-bold" style={{ color: '#10b981', fontSize: '1.1rem' }}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculateRefund(cancelRequest))}
                  </span>
                </div>
              </div>

              <p className="text-muted small mb-3">
                Tiền hoàn lại sẽ được chuyển về tài khoản trong 2-3 ngày làm việc.
              </p>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowCancelModal(false)}
                className="btn"
                style={{ backgroundColor: '#e5e7eb', color: '#333', border: 'none', padding: '0.75rem 1.5rem' }}
              >
                Hủy
              </button>
              <button
                onClick={confirmCancel}
                className="btn"
                style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.75rem 1.5rem' }}
              >
                Xác nhận hủy vé
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
