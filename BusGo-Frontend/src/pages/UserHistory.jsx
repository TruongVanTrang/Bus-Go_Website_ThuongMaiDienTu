import { useState, useEffect } from 'react'
import { FiHeart, FiTrash2, FiMapPin, FiClock, FiDollarSign, FiX, FiDownload, FiBell, FiCheckCircle, FiLoader, FiStar, FiPackage, FiTruck, FiCheckSquare } from 'react-icons/fi'
import QRCode from 'qrcode.react'
import './UserHistory.css'

export default function UserHistory() {
  const [activeTab, setActiveTab] = useState('history')
  const [statusFilter, setStatusFilter] = useState('all') // all, upcoming, completed, cancelled
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelRequest, setCancelRequest] = useState(null)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [ratingValue, setRatingValue] = useState(0)
  const [ratingComment, setRatingComment] = useState('')
  const [bookingRatings, setBookingRatings] = useState({})
  const [consignments, setConsignments] = useState([])
  const [selectedConsignment, setSelectedConsignment] = useState(null)
  const [showConsignmentDetailModal, setShowConsignmentDetailModal] = useState(false)
  const [cargoStatusFilter, setCargoStatusFilter] = useState('all') // all, pending, confirmed, in_transit, delivered

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

  const [watchlist, setWatchlist] = useState([])

  // Load watchlist from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('busgo_favorites')
    if (savedFavorites) {
      try {
        const favorites = JSON.parse(savedFavorites)
        // Filter for trips (not routes) and set as watchlist
        const tripFavorites = favorites.filter(fav => fav.type === 'trip' || fav.busType)
        setWatchlist(tripFavorites)
      } catch (e) {
        console.error('Error loading favorites:', e)
      }
    } else {
      // Load default watchlist data from mockData if no saved favorites
      try {
        const { mockWatchlistTrips } = require('../utils/mockData')
        setWatchlist(mockWatchlistTrips)
      } catch (e) {
        console.error('Error loading mock watchlist:', e)
      }
    }

    // Load ratings from localStorage
    const savedRatings = localStorage.getItem('busgo_trip_ratings')
    if (savedRatings) {
      try {
        const ratings = JSON.parse(savedRatings)
        setBookingRatings(ratings)
      } catch (e) {
        console.error('Error loading ratings:', e)
      }
    }

    // Load consignments from localStorage
    const savedConsignments = localStorage.getItem('busgo_consignments')
    if (savedConsignments) {
      try {
        const parsedConsignments = JSON.parse(savedConsignments)
        // Add default status if not present
        const consignmentsWithStatus = parsedConsignments.map(c => ({
          ...c,
          cargoStatus: c.cargoStatus || 'pending',
          createdAt: c.timestamp || new Date().toISOString()
        }))
        setConsignments(consignmentsWithStatus)
      } catch (e) {
        console.error('Error loading consignments:', e)
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

  const removeFromWatchlist = (tripId) => {
    const updatedWatchlist = watchlist.filter(item => item.id !== tripId)
    setWatchlist(updatedWatchlist)
    
    // Also remove from localStorage
    const savedFavorites = localStorage.getItem('busgo_favorites')
    if (savedFavorites) {
      const favorites = JSON.parse(savedFavorites)
      const updatedFavorites = favorites.filter(fav => fav.id !== tripId)
      localStorage.setItem('busgo_favorites', JSON.stringify(updatedFavorites))
    }
  }

  const openRatingModal = (booking) => {
    setSelectedBooking(booking)
    setRatingValue(bookingRatings[booking.id]?.rating || 0)
    setRatingComment(bookingRatings[booking.id]?.comment || '')
    setShowRatingModal(true)
  }

  const submitRating = () => {
    if (selectedBooking && ratingValue > 0) {
      const updatedRatings = {
        ...bookingRatings,
        [selectedBooking.id]: {
          rating: ratingValue,
          comment: ratingComment,
          date: new Date().toISOString()
        }
      }
      setBookingRatings(updatedRatings)
      localStorage.setItem('busgo_trip_ratings', JSON.stringify(updatedRatings))
      setShowRatingModal(false)
      setRatingValue(0)
      setRatingComment('')
    }
  }

  // Cargo Consignment functions
  const getCargoStatusBadgeInfo = (status) => {
    const baseStyle = { padding: '0.4rem 0.8rem', borderRadius: '0.5rem', color: 'white', fontSize: '0.75rem', fontWeight: 700 }
    
    const statusMap = {
      'pending': { ...baseStyle, backgroundColor: '#f59e0b', text: 'Chờ xác nhận', icon: FiClock },
      'confirmed': { ...baseStyle, backgroundColor: '#3b82f6', text: 'Đã xác nhận', icon: FiCheckSquare },
      'in_transit': { ...baseStyle, backgroundColor: '#8b5cf6', text: 'Đang vận chuyển', icon: FiTruck },
      'delivered': { ...baseStyle, backgroundColor: '#10b981', text: 'Đã giao', icon: FiCheckCircle }
    }
    
    return statusMap[status] || statusMap['pending']
  }

  const filteredConsignments = consignments.filter(item => {
    if (cargoStatusFilter === 'all') return true
    return item.cargoStatus === cargoStatusFilter
  })

  const openConsignmentDetailModal = (consignment) => {
    setSelectedConsignment(consignment)
    setShowConsignmentDetailModal(true)
  }

  const updateConsignmentStatus = (consignmentId, newStatus) => {
    const updated = consignments.map(c => 
      c.id === consignmentId ? { ...c, cargoStatus: newStatus } : c
    )
    setConsignments(updated)
    localStorage.setItem('busgo_consignments', JSON.stringify(updated))
    // Update selected if it's the one being viewed
    if (selectedConsignment?.id === consignmentId) {
      setSelectedConsignment({ ...selectedConsignment, cargoStatus: newStatus })
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
        <h1 className="fw-bold mb-4 text-neutral-900">Lịch sử hoạt động</h1>

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
            <button
              className={`tab-button ${activeTab === 'cargo' ? 'active' : ''}`}
              onClick={() => setActiveTab('cargo')}
            >
              Theo dõi hàng hóa ({consignments.length})
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

                            {getTripStatus(booking) === 'completed' && (
                              <button
                                onClick={() => openRatingModal(booking)}
                                className="btn-action btn-rating"
                                style={{
                                  backgroundColor: bookingRatings[booking.id] ? '#fff0f5' : '#fff8f0',
                                  color: bookingRatings[booking.id] ? '#ec4899' : '#f59e0b',
                                  border: bookingRatings[booking.id] ? '1px solid #fbcfe8' : '1px solid #fed7aa'
                                }}
                              >
                                <FiStar size={16} />
                                {bookingRatings[booking.id] ? 'Cập nhật đánh giá' : 'Đánh giá'}
                              </button>
                            )}

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
                {watchlist.map(trip => (
                  <div key={trip.id} className="watchlist-card">
                    <div className="watchlist-content">
                      <div className="route-info">
                        <div className="from-to">
                          <div className="fw-bold fs-5 text-neutral-900">
                            {trip.from} <span style={{ color: '#999' }}>→</span> {trip.to}
                          </div>
                          <div className="text-muted small">Chuyến xe cụ thể • {trip.busType ? (trip.busType === 'bus' ? 'Xe Bus' : 'Xe Minibus') : 'Chuyên dụng'}</div>
                        </div>
                      </div>

                      <div className="divider"></div>

                      <div className="route-stats">
                        <div className="stat">
                          <span className="label">Thời gian:</span>
                          <span className="value">{trip.departureTime} • {trip.date}</span>
                        </div>
                        <div className="stat">
                          <span className="label">Nhà xe:</span>
                          <span className="value">{trip.operator}</span>
                        </div>
                        <div className="stat">
                          <span className="label">Giá:</span>
                          <span className="value fw-bold" style={{ color: '#0066cc' }}>
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(trip.price)}
                          </span>
                        </div>
                        {trip.averageRating && (
                          <div className="stat">
                            <span className="label">Đánh giá:</span>
                            <span className="value">⭐ {trip.averageRating}</span>
                          </div>
                        )}
                      </div>

                      <div className="divider"></div>

                      <div className="watchlist-actions">
                        <button
                          onClick={() => removeFromWatchlist(trip.id)}
                          className="btn-action"
                          style={{
                            backgroundColor: 'white',
                            color: '#ef4444',
                            border: '1px solid #fecaca'
                          }}
                        >
                          <FiTrash2 size={16} />
                          Xóa khỏi yêu thích
                        </button>
                        <a
                          href={`/search?from=${trip.from}&to=${trip.to}`}
                          className="btn-action"
                          style={{
                            backgroundColor: '#0066cc',
                            color: 'white',
                            border: 'none',
                            textDecoration: 'none'
                          }}
                        >
                          Tìm chuyến tương tự
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💔</div>
                <h5 className="fw-bold text-neutral-900 mb-2">Chưa có chuyến xe yêu thích</h5>
                <p className="text-muted mb-4">Hãy thêm các chuyến xe yêu thích của bạn để theo dõi!</p>
              </div>
            )}
          </div>
        )}

        {/* Cargo Tracking Tab */}
        {activeTab === 'cargo' && (
          <div className="tab-content">
            {/* Status Filter for Cargo */}
            <div className="status-filter-container mb-4">
              <button
                className={`filter-btn ${cargoStatusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setCargoStatusFilter('all')}
              >
                Tất cả ({consignments.length})
              </button>
              <button
                className={`filter-btn ${cargoStatusFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setCargoStatusFilter('pending')}
              >
                Chờ xác nhận ({consignments.filter(c => c.cargoStatus === 'pending').length})
              </button>
              <button
                className={`filter-btn ${cargoStatusFilter === 'confirmed' ? 'active' : ''}`}
                onClick={() => setCargoStatusFilter('confirmed')}
              >
                Đã xác nhận ({consignments.filter(c => c.cargoStatus === 'confirmed').length})
              </button>
              <button
                className={`filter-btn ${cargoStatusFilter === 'in_transit' ? 'active' : ''}`}
                onClick={() => setCargoStatusFilter('in_transit')}
              >
                Đang vận chuyển ({consignments.filter(c => c.cargoStatus === 'in_transit').length})
              </button>
              <button
                className={`filter-btn ${cargoStatusFilter === 'delivered' ? 'active' : ''}`}
                onClick={() => setCargoStatusFilter('delivered')}
              >
                Đã giao ({consignments.filter(c => c.cargoStatus === 'delivered').length})
              </button>
            </div>

            {filteredConsignments.length > 0 ? (
              <div className="consignments-list">
                {filteredConsignments.map(consignment => {
                  const statusBadge = getCargoStatusBadgeInfo(consignment.cargoStatus)
                  const cargoTypeMap = {
                    'documents': '📄 Tài liệu',
                    'fragile': '🍷 Hàng dễ vỡ',
                    'bulky': '📦 Hàng cồng kềnh',
                    'motorcycle': '🏍️ Xe máy'
                  }
                  
                  return (
                    <div key={consignment.id} className="consignment-card" style={{ border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1rem' }}>
                      {/* Status Badge */}
                      <div className="status-badge" style={statusBadge}>
                        {statusBadge.text}
                      </div>

                      {/* Card Content */}
                      <div className="consignment-card-content" style={{ marginTop: '1rem' }}>
                        {/* Consignment ID */}
                        <div className="consignment-id-section" style={{ marginBottom: '1rem' }}>
                          <div className="small text-muted">Mã ký gửi</div>
                          <div className="fw-bold">{consignment.id}</div>
                        </div>

                        {/* Route Info */}
                        <div className="route-section" style={{ marginBottom: '1rem' }}>
                          <div className="route-info">
                            <div className="stop">
                              <div className="stop-name text-muted fw-bold">{consignment.from}</div>
                            </div>
                            <div className="route-line" style={{ textAlign: 'center', color: '#0066cc', margin: '0 1rem' }}>
                              <FiMapPin size={16} />
                            </div>
                            <div className="stop">
                              <div className="stop-name text-muted fw-bold">{consignment.to}</div>
                            </div>
                          </div>
                        </div>

                        {/* Divider */}
                        <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '1rem 0' }}></div>

                        {/* Cargo Details */}
                        <div className="cargo-details" style={{ marginBottom: '1rem' }}>
                          <div style={{ marginBottom: '0.5rem' }}>
                            <span className="small text-muted">Loại hàng:</span>
                            <span className="fw-600 ms-2">{cargoTypeMap[consignment.type] || consignment.type}</span>
                          </div>
                          <div style={{ marginBottom: '0.5rem' }}>
                            <span className="small text-muted">Trọng lượng:</span>
                            <span className="fw-600 ms-2">{consignment.weight ? consignment.weight + ' kg' : 'N/A'}</span>
                          </div>
                          <div style={{ marginBottom: '0.5rem' }}>
                            <span className="small text-muted">Giá trị khai giá:</span>
                            <span className="fw-600 ms-2" style={{ color: '#0066cc' }}>
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(consignment.declaredValue || 0)}
                            </span>
                          </div>
                          <div>
                            <span className="small text-muted">Giá gửi:</span>
                            <span className="fw-bold ms-2" style={{ color: '#10b981', fontSize: '1rem' }}>
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(consignment.totalPrice || 0)}
                            </span>
                          </div>
                        </div>

                        {/* Divider */}
                        <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '1rem 0' }}></div>

                        {/* Sender/Receiver Info */}
                        <div className="sender-receiver-info" style={{ marginBottom: '1rem' }}>
                          <div style={{ marginBottom: '0.75rem' }}>
                            <div className="small fw-600 text-neutral-700">Người gửi</div>
                            <div className="small text-muted">{consignment.senderName} • {consignment.senderPhone}</div>
                          </div>
                          <div>
                            <div className="small fw-600 text-neutral-700">Người nhận</div>
                            <div className="small text-muted">{consignment.receiverName} • {consignment.receiverPhone}</div>
                          </div>
                        </div>

                        {/* Divider */}
                        <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '1rem 0' }}></div>

                        {/* Actions */}
                        <div className="action-buttons" style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => openConsignmentDetailModal(consignment)}
                          >
                            <FiPackage size={14} className="me-1" />
                            Xem chi tiết
                          </button>
                          {consignment.cargoStatus === 'pending' && (
                            <button
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => updateConsignmentStatus(consignment.id, 'confirmed')}
                            >
                              Xác nhận
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                <h5 className="fw-bold text-neutral-900 mb-2">Chưa có ký gửi hàng hóa</h5>
                <p className="text-muted mb-4">Hãy ký gửi hàng hóa để theo dõi!</p>
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

      {/* Rating Modal */}
      {showRatingModal && selectedBooking && (
        <div className="modal-overlay" onClick={() => setShowRatingModal(false)}>
          <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="fw-bold">Đánh giá chuyến xe</h3>
              <button
                className="modal-close"
                onClick={() => setShowRatingModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="rating-info mb-4 p-3 bg-light rounded">
                <div className="fw-bold mb-2">Chuyến: {selectedBooking.from} → {selectedBooking.to}</div>
                <div className="small text-muted">{selectedBooking.date} {selectedBooking.departureTime}</div>
              </div>

              <div className="rating-section mb-4">
                <label className="form-label fw-bold mb-3">Đánh giá:</label>
                <div className="stars-container" style={{ fontSize: '2.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setRatingValue(star)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: star <= ratingValue ? '#fbbf24' : '#e5e7eb',
                        transition: 'all 0.2s ease',
                        fontSize: '2.5rem',
                        padding: '0',
                        transform: star <= ratingValue ? 'scale(1.1)' : 'scale(1)'
                      }}
                      title={`${star} sao`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                {ratingValue > 0 && (
                  <div style={{ textAlign: 'center', marginTop: '1rem', color: '#f59e0b', fontWeight: 'bold' }}>
                    {ratingValue} sao
                  </div>
                )}
              </div>

              <div className="comment-section">
                <label className="form-label fw-bold">Bình luận:</label>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Chia sẻ trải nghiệm của bạn về chuyến xe này..."
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  style={{ borderColor: '#e5e7eb', borderRadius: '0.5rem' }}
                />
                <small className="text-muted mt-2" style={{ display: 'block' }}>
                  {ratingComment.length}/500 ký tự
                </small>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowRatingModal(false)}
                className="btn"
                style={{ backgroundColor: '#e5e7eb', color: '#333', border: 'none', padding: '0.75rem 1.5rem' }}
              >
                Hủy
              </button>
              <button
                onClick={submitRating}
                disabled={ratingValue === 0}
                className="btn"
                style={{
                  backgroundColor: ratingValue === 0 ? '#d1d5db' : '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  cursor: ratingValue === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                Gửi đánh giá
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

      {/* Consignment Detail Modal */}
      {showConsignmentDetailModal && selectedConsignment && (
        <div className="modal-overlay" onClick={() => setShowConsignmentDetailModal(false)}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="fw-bold">Chi tiết ký gửi hàng hóa</h3>
              <button
                className="modal-close"
                onClick={() => setShowConsignmentDetailModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {/* Header with Status */}
              <div style={{ backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h5 className="fw-bold text-neutral-900 mb-2">Mã ký gửi: {selectedConsignment.id}</h5>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <div className="small">
                        <span className="text-muted">Ngày ký gửi:</span>
                        <span className="fw-600 ms-2">{new Date(selectedConsignment.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <div className="small">
                        <span className="text-muted">Trạng thái:</span>
                        <span className="fw-600 ms-2" style={{ color: getCargoStatusBadgeInfo(selectedConsignment.cargoStatus).backgroundColor }}>
                          {getCargoStatusBadgeInfo(selectedConsignment.cargoStatus).text}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Route Information */}
              <div className="section mb-4">
                <h6 className="fw-bold mb-3">📍 Thông Tin Tuyến Đường</h6>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div className="small text-muted mb-1">Điểm gửi</div>
                    <div className="fw-600">{selectedConsignment.from}</div>
                    {selectedConsignment.pickupLocationDetail && (
                      <div className="small text-muted mt-2">{selectedConsignment.pickupLocationDetail}</div>
                    )}
                  </div>
                  <div>
                    <div className="small text-muted mb-1">Điểm nhận</div>
                    <div className="fw-600">{selectedConsignment.to}</div>
                    {selectedConsignment.deliveryLocationDetail && (
                      <div className="small text-muted mt-2">{selectedConsignment.deliveryLocationDetail}</div>
                    )}
                  </div>
                  <div>
                    <div className="small text-muted mb-1">Ngày gửi</div>
                    <div className="fw-600">{selectedConsignment.date}</div>
                  </div>
                </div>
              </div>

              <hr />

              {/* Cargo Information */}
              <div className="section mb-4">
                <h6 className="fw-bold mb-3">📦 Thông Tin Hàng Hóa</h6>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div className="small text-muted mb-1">Loại hàng</div>
                    <div className="fw-600">
                      {selectedConsignment.type === 'documents' && '📄 Tài liệu'}
                      {selectedConsignment.type === 'fragile' && '🍷 Hàng dễ vỡ'}
                      {selectedConsignment.type === 'bulky' && '📦 Hàng cồng kềnh'}
                      {selectedConsignment.type === 'motorcycle' && '🏍️ Xe máy'}
                    </div>
                  </div>
                  <div>
                    <div className="small text-muted mb-1">Trọng lượng</div>
                    <div className="fw-600">{selectedConsignment.weight ? selectedConsignment.weight + ' kg' : 'N/A'}</div>
                  </div>
                  <div>
                    <div className="small text-muted mb-1">Giá trị khai giá</div>
                    <div className="fw-600">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedConsignment.declaredValue || 0)}
                    </div>
                  </div>
                </div>
              </div>

              <hr />

              {/* Sender & Receiver Information */}
              <div className="section mb-4">
                <h6 className="fw-bold mb-3">👤 Thông Tin Người Gửi & Nhận</h6>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <div className="small fw-600 text-neutral-900 mb-2">Người Gửi</div>
                    <div className="small mb-1">
                      <span className="text-muted">Tên:</span>
                      <span className="fw-600 ms-2">{selectedConsignment.senderName}</span>
                    </div>
                    <div className="small">
                      <span className="text-muted">SĐT:</span>
                      <span className="fw-600 ms-2">{selectedConsignment.senderPhone}</span>
                    </div>
                  </div>
                  <div>
                    <div className="small fw-600 text-neutral-900 mb-2">Người Nhận</div>
                    <div className="small mb-1">
                      <span className="text-muted">Tên:</span>
                      <span className="fw-600 ms-2">{selectedConsignment.receiverName}</span>
                    </div>
                    <div className="small">
                      <span className="text-muted">SĐT:</span>
                      <span className="fw-600 ms-2">{selectedConsignment.receiverPhone}</span>
                    </div>
                  </div>
                </div>
              </div>

              <hr />

              {/* Pricing Information */}
              <div className="section mb-4">
                <h6 className="fw-bold mb-3">💰 Thông Tin Thanh Toán</h6>
                <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.5rem' }}>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Phí gửi hàng hóa</span>
                    <span className="fw-600">0đ</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Phí bảo hiểm (2%)</span>
                    <span className="fw-600">0đ</span>
                  </div>
                  <hr className="my-2" />
                  <div className="d-flex justify-content-between">
                    <span className="fw-bold">Tổng cộng</span>
                    <span className="fw-bold" style={{ color: '#0066cc', fontSize: '1.1rem' }}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedConsignment.totalPrice || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Update Section */}
              {selectedConsignment.cargoStatus !== 'delivered' && (
                <>
                  <hr />
                  <div className="section">
                    <h6 className="fw-bold mb-3">🔄 Cập Nhật Trạng Thái</h6>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {selectedConsignment.cargoStatus === 'pending' && (
                        <>
                          <button
                            className="btn btn-sm"
                            onClick={() => updateConsignmentStatus(selectedConsignment.id, 'confirmed')}
                            style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none' }}
                          >
                            <FiCheckSquare size={14} className="me-1" />
                            Xác nhận
                          </button>
                        </>
                      )}
                      {(selectedConsignment.cargoStatus === 'confirmed' || selectedConsignment.cargoStatus === 'pending') && (
                        <button
                          className="btn btn-sm"
                          onClick={() => updateConsignmentStatus(selectedConsignment.id, 'in_transit')}
                          style={{ backgroundColor: '#8b5cf6', color: 'white', border: 'none' }}
                        >
                          <FiTruck size={14} className="me-1" />
                          Bắt đầu vận chuyển
                        </button>
                      )}
                      {selectedConsignment.cargoStatus === 'in_transit' && (
                        <button
                          className="btn btn-sm"
                          onClick={() => updateConsignmentStatus(selectedConsignment.id, 'delivered')}
                          style={{ backgroundColor: '#10b981', color: 'white', border: 'none' }}
                        >
                          <FiCheckCircle size={14} className="me-1" />
                          Đã giao
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowConsignmentDetailModal(false)}
                className="btn"
                style={{ backgroundColor: '#e5e7eb', color: '#333', border: 'none', padding: '0.75rem 1.5rem' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
