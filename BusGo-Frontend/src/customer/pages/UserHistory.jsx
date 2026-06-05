import { useState, useEffect } from 'react'
import { FiHeart, FiTrash2, FiMapPin, FiClock, FiDollarSign, FiX, FiDownload, FiBell, FiCheckCircle, FiLoader, FiStar, FiPackage, FiTruck, FiCheckSquare, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import QRCode from 'qrcode.react'
import { StorageUtil } from '../../utils/helpers'
import { getMyTicketsAPI, cancelBookingAPI, submitFeedbackAPI, getFeedbackAPI } from '../../services/bookingService'
import { getMyConsignmentsAPI, cancelConsignmentAPI } from '../../services/cargoService'
import './UserHistory.css'

export default function UserHistory() {
  const navigate = useNavigate()
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

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [watchlist, setWatchlist] = useState([])

  // Load bookings and watchlist on mount
  useEffect(() => {
    const token = StorageUtil.getToken()
    if (!token) {
      navigate('/login')
      return
    }

    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        const tickets = await getMyTicketsAPI(token)
        setBookings(tickets)
      } catch (err) {
        console.error('Lỗi khi tải lịch sử vé:', err)
        setError(err.message || 'Lỗi khi tải lịch sử vé')
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Tải danh sách yêu thích từ localStorage (UX state cục bộ)
    const savedFavorites = localStorage.getItem('busgo_favorites')
    if (savedFavorites) {
      try {
        const favorites = JSON.parse(savedFavorites)
        const tripFavorites = favorites.filter(fav => fav.type === 'trip' || fav.busType)
        setWatchlist(tripFavorites)
      } catch (e) {
        console.error('Error loading favorites:', e)
        setWatchlist([])
      }
    } else {
      setWatchlist([]) // Không dùng dữ liệu mầu
    }

    // Tải ratings từ localStorage (UX state cục bộ)
    const savedRatings = localStorage.getItem('busgo_trip_ratings')
    if (savedRatings) {
      try {
        const ratings = JSON.parse(savedRatings)
        setBookingRatings(ratings)
      } catch (e) {
        console.error('Error loading ratings:', e)
      }
    }

    // Dữ liệu ký gửi hàng sẽ được lấy từ backend
    const loadConsignments = async () => {
      try {
        const data = await getMyConsignmentsAPI(token)
        const mappedConsignments = data.map(item => {
          let mappedStatus = 'pending'
          if (item.trangThaiKyGui === 'da_xac_nhan') mappedStatus = 'confirmed'
          if (item.trangThaiKyGui === 'in_transit') mappedStatus = 'in_transit'
          if (item.trangThaiKyGui === 'delivered') mappedStatus = 'delivered'
          if (item.trangThaiKyGui === 'failed' || item.trangThaiKyGui === 'da_huy') mappedStatus = 'cancelled'

          return {
            id: item.consignmentId,
            from: item.diemGui,
            to: item.diemNhan,
            type: item.loaiHangHoa,
            weight: item.trongLuong,
            declaredValue: item.giaTrucDeclare,
            totalPrice: item.tongTien,
            senderName: item.tenNguoiGui,
            senderPhone: item.soDienThoaiNguoiGui,
            receiverName: item.tenNguoiNhan,
            receiverPhone: item.soDienThoaiNguoiNhan,
            cargoStatus: mappedStatus,
            date: item.ngayGui,
            images: item.hinhAnh || []
          }
        })
        setConsignments(mappedConsignments)
      } catch (err) {
        console.error('Lỗi khi tải lịch sử ký gửi:', err)
      }
    }
    
    loadConsignments()
  }, [navigate])

  // Helper function to parse datetime correctly (handle timezone)
  const parseDateTimeUTC = (dateStr, timeStr) => {
    // Format: dateStr = "YYYY-MM-DD", timeStr = "HH:mm"
    // Create ISO string to avoid timezone issues
    const isoString = `${dateStr}T${timeStr}:00Z`
    return new Date(isoString)
  }

  // Get trip status based on DB tripStatus
  const getTripStatus = (booking) => {
    if (booking.status === 'Da huy') return 'cancelled'
    
    if (booking.tripStatus === 'da_len_lich') return 'upcoming'
    if (booking.tripStatus === 'dang_khoi_hanh') return 'in_transit'
    if (booking.tripStatus === 'da_hoan_thanh') return 'completed'
    
    // Fallback if tripStatus is missing - use UTC parsing
    const departureDate = parseDateTimeUTC(booking.date, booking.departureTime)
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
    const departureDate = parseDateTimeUTC(booking.date, booking.departureTime)
    const now = new Date()
    return departureDate > now && booking.status === 'Da thanh toan'
  }

  // Calculate refund amount based on cancellation policy
  const calculateRefund = (booking) => {
    const departureDate = parseDateTimeUTC(booking.date, booking.departureTime)
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
    const departureDate = parseDateTimeUTC(booking.date, booking.departureTime)
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

  const confirmCancel = async () => {
    if (cancelRequest) {
      try {
        const token = StorageUtil.getToken()
        if (!token) {
          navigate('/login')
          return
        }
        await cancelBookingAPI(token, cancelRequest.id)
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
      } catch (err) {
        console.error('Lỗi khi hủy đặt vé:', err)
        alert(err.message || 'Lỗi khi hủy đặt vé. Vui lòng thử lại.')
      }
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

  const openRatingModal = async (booking) => {
    setSelectedBooking(booking)
    
    // Load existing feedback from backend
    try {
      const token = StorageUtil.getToken()
      if (token) {
        const feedbackData = await getFeedbackAPI(token, booking.id)
        if (feedbackData.hasFeedback) {
          setRatingValue(feedbackData.rating)
          setRatingComment(feedbackData.comments)
        } else {
          setRatingValue(0)
          setRatingComment('')
        }
      }
    } catch (err) {
      console.error('Lỗi khi tải đánh giá:', err)
      // Reset if error
      setRatingValue(0)
      setRatingComment('')
    }
    
    setShowRatingModal(true)
  }

  const submitRating = async () => {
    if (selectedBooking && ratingValue > 0) {
      try {
        const token = StorageUtil.getToken()
        if (!token) {
          navigate('/login')
          return
        }
        await submitFeedbackAPI(token, selectedBooking.id, ratingValue, ratingComment)
        
        // Update local state
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
        alert('Cảm ơn bạn đã đánh giá chuyến xe!')
      } catch (err) {
        console.error('Lỗi khi gửi đánh giá:', err)
        alert(err.message || 'Lỗi khi gửi đánh giá. Vui lòng thử lại.')
      }
    } else {
      alert('Vui lòng chọn số sao để đánh giá')
    }
  }

  // Cargo Consignment functions
  const getCargoStatusBadgeInfo = (status) => {
    const baseStyle = { padding: '0.4rem 0.8rem', borderRadius: '0.5rem', color: 'white', fontSize: '0.75rem', fontWeight: 700 }
    
    const statusMap = {
      'pending': { ...baseStyle, backgroundColor: '#f59e0b', text: 'Chờ xác nhận', icon: FiClock },
      'confirmed': { ...baseStyle, backgroundColor: '#3b82f6', text: 'Đã xác nhận', icon: FiCheckSquare },
      'in_transit': { ...baseStyle, backgroundColor: '#8b5cf6', text: 'Đang vận chuyển', icon: FiTruck },
      'delivered': { ...baseStyle, backgroundColor: '#10b981', text: 'Đã giao', icon: FiCheckCircle },
      'cancelled': { ...baseStyle, backgroundColor: '#ef4444', text: 'Đã hủy', icon: FiX }
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
    const baseStyle = { padding: '0.4rem 0.8rem', borderRadius: '0.5rem', color: 'white', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }
    
    if (booking.status === 'Da huy') {
      return { ...baseStyle, backgroundColor: '#ef4444', text: 'Đã hủy', icon: <FiX size={14} /> }
    }
    
    if (status === 'upcoming') {
      return { ...baseStyle, backgroundColor: '#f59e0b', text: 'Sắp khởi hành', icon: <FiClock size={14} /> }
    }
    
    if (status === 'in_transit') {
      return { ...baseStyle, backgroundColor: '#3b82f6', text: 'Đang di chuyển', icon: <FiTruck size={14} /> }
    }
    
    return { ...baseStyle, backgroundColor: '#10b981', text: 'Đã hoàn thành', icon: <FiCheckCircle size={14} /> }
  }

  const handleCancelConsignment = async (consignmentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) return;
    
    try {
      const token = StorageUtil.getToken()
      if (!token) {
        navigate('/login')
        return
      }
      
      await cancelConsignmentAPI(consignmentId, token)
      
      // Update local state
      updateConsignmentStatus(consignmentId, 'da_huy')
      alert('Hủy đơn hàng thành công!')
      setShowConsignmentDetailModal(false)
    } catch (err) {
      console.error('Lỗi khi hủy đơn hàng:', err)
      alert(err.message || 'Lỗi khi hủy đơn hàng. Vui lòng thử lại.')
    }
  }

  if (loading) {
    return (
      <div className="user-history-page">
        <div className="container px-md-5 px-3 py-5">
          <div className="history-loading">
            <div className="spinner"></div>
            <p className="text-muted mt-3">Đang tải lịch sử hoạt động...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && bookings.length === 0) {
    return (
      <div className="user-history-page">
        <div className="container px-md-5 px-3 py-5">
          <div className="history-error">
            <FiAlertTriangle className="history-error-icon" />
            <h3 className="fw-bold text-neutral-900 mt-3">Đã xảy ra lỗi</h3>
            <p className="text-muted">{error}</p>
            <button className="btn-retry" onClick={() => window.location.reload()}>Thử lại</button>
          </div>
        </div>
      </div>
    )
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
                className={`filter-btn ${statusFilter === 'in_transit' ? 'active' : ''}`}
                onClick={() => setStatusFilter('in_transit')}
              >
                Đang di chuyển ({bookings.filter(b => getTripStatus(b) === 'in_transit').length})
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
                        {statusBadge.icon} {statusBadge.text}
                      </div>

                      {/* Booking ID */}
                      <div className="booking-id-section">
                        <div className="small">Mã vé</div>
                        <div className="fw-bold">{booking.id}</div>
                      </div>

                      {/* Route Info */}
                      <div className="route-section">
                        <div className="route-info">
                          <div className="stop">
                            <div className="stop-time">{booking.departureTime}</div>
                            <div className="stop-name">{booking.from}</div>
                          </div>
                          <div className="route-line">
                            <FiMapPin size={14} style={{ color: '#0066cc' }} />
                          </div>
                          <div className="stop">
                            <div className="stop-time">{booking.arrivalTime}</div>
                            <div className="stop-name">{booking.to}</div>
                          </div>
                        </div>
                      </div>

                      {/* Trip Details */}
                      <div className="trip-details">
                        <div className="detail-row">
                          <span className="label">Ngày:</span>
                          <span className="value">{booking.date}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Ghế:</span>
                          <span className="value">{booking.seats.join(', ')}</span>
                        </div>
                        {booking.cargoInfo?.type !== 'none' && (
                          <div className="detail-row">
                            <span className="label">Hàng:</span>
                            <span className="value badge">{booking.cargoInfo.description}</span>
                          </div>
                        )}
                      </div>

                      {/* Price Section */}
                      <div className="price-action">
                        <div className="price-section">
                          <div className="text-muted">Tổng tiền</div>
                          <div className="fw-bold fs-5">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}
                          </div>
                          {getTripStatus(booking) === 'upcoming' && (
                            <div className="time-remaining">
                              <FiClock size={12} />
                              {getTimeUntilDeparture(booking)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="action-buttons">
                        <button
                          onClick={() => openDetailModal(booking)}
                          className="btn-action btn-detail"
                        >
                          <FiDownload size={14} />
                          Chi tiết
                        </button>

                        {getTripStatus(booking) === 'completed' && (
                          <button
                            onClick={() => openRatingModal(booking)}
                            className="btn-action btn-rating"
                          >
                            <FiStar size={14} />
                            Đánh giá
                          </button>
                        )}

                        {canCancelBooking(booking) && (
                          <button
                            onClick={() => handleCancelRequest(booking)}
                            className="btn-action btn-cancel"
                          >
                            <FiX size={14} />
                            Hủy
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div style={{ fontSize: '3rem', }}>📋</div>
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
                    {/* Heart Icon Badge */}
                    <div className="watchlist-heart-badge">
                      <FiHeart size={20} className="text-danger" fill="currentColor" />
                    </div>

                    {/* Route Section */}
                    <div className="watchlist-route">
                      <div className="route-from">
                        <div className="route-label">Từ</div>
                        <div className="route-city">{trip.from}</div>
                      </div>
                      <div className="route-arrow">
                        <FiMapPin size={20} style={{ color: '#0066cc' }} />
                      </div>
                      <div className="route-to">
                        <div className="route-label">Đến</div>
                        <div className="route-city">{trip.to}</div>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="watchlist-details">
                      <div className="detail-item">
                        <div className="detail-icon">
                          <FiClock size={16} />
                        </div>
                        <div className="detail-content">
                          <div className="detail-label">Thời gian</div>
                          <div className="detail-value">{trip.departureTime}</div>
                          <div className="detail-subtext">{trip.date}</div>
                        </div>
                      </div>

                      <div className="detail-item">
                        <div className="detail-icon">
                          <FiTruck size={16} />
                        </div>
                        <div className="detail-content">
                          <div className="detail-label">Loại xe</div>
                          <div className="detail-value">{trip.busType ? (trip.busType === 'bus' ? 'Xe Bus' : 'Xe Minibus') : 'Chuyên dụng'}</div>
                        </div>
                      </div>

                      <div className="detail-item">
                        <div className="detail-icon">
                          <FiDollarSign size={16} />
                        </div>
                        <div className="detail-content">
                          <div className="detail-label">Giá vé</div>
                          <div className="detail-value price-highlight">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(trip.price)}
                          </div>
                        </div>
                      </div>

                      {trip.averageRating && (
                        <div className="detail-item">
                          <div className="detail-icon">
                            <FiStar size={16} />
                          </div>
                          <div className="detail-content">
                            <div className="detail-label">Đánh giá</div>
                            <div className="detail-value rating-highlight">{trip.averageRating} ⭐</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="watchlist-actions">
                      <button
                        onClick={() => removeFromWatchlist(trip.id)}
                        className="btn-watchlist btn-remove"
                      >
                        <FiTrash2 size={16} />
                        Xóa
                      </button>
                      <button
                        onClick={() => navigate(`/search?from=${trip.from}&to=${trip.to}`)}
                        className="btn-watchlist btn-search"
                      >
                        Tìm chuyến
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div style={{ fontSize: '3rem', }}>💔</div>
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
              <div className="consignments-list row g-4 mt-2">
                {filteredConsignments.map(consignment => {
                  const statusBadge = getCargoStatusBadgeInfo(consignment.cargoStatus)
                  const cargoTypeMap = {
                    'documents': '📄 Tài liệu',
                    'fragile': '🍷 Hàng dễ vỡ',
                    'bulky': '📦 Hàng cồng kềnh',
                    'motorcycle': '🏍️ Xe máy'
                  }
                  
                  return (
                    <div key={consignment.id} className="col-12 col-md-6 col-lg-4">
                      <div className={`consignment-card ${consignment.isEdited ? 'edited-glow' : ''}`} style={{ border: consignment.cargoStatus === 'cancelled' ? '2px solid #ef4444' : consignment.isEdited ? '2px solid #f59e0b' : '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1rem', height: '100%' }}>
                      {/* Status Badge */}
                      <div className="status-badge" style={statusBadge}>
                        {statusBadge.text}
                      </div>

                      {/* Card Content */}
                      <div className="consignment-card-content" style={{ marginTop: '1rem' }}>
                        {/* Consignment ID */}
                        <div className="consignment-id-section" style={{ }}>
                          <div className="small text-muted">Mã ký gửi</div>
                          <div className="fw-bold">{consignment.id}</div>
                        </div>

                        {/* Route Info */}
                        <div className="route-section" style={{ }}>
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
                        <div className="cargo-details" style={{ }}>
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
                        <div className="sender-receiver-info" style={{ }}>
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
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              navigate('/cargo-consignment', { 
                                state: { 
                                  reorderData: {
                                    loaiDichVu: 'van_tai',
                                    diemGui: consignment.from,
                                    diemNhan: consignment.to,
                                    tenNguoiGui: consignment.senderName,
                                    soDienThoaiNguoiGui: consignment.senderPhone,
                                    tenNguoiNhan: consignment.receiverName,
                                    soDienThoaiNguoiNhan: consignment.receiverPhone,
                                    loaiHangHoa: consignment.type,
                                    trongLuong: consignment.weight,
                                    giaTriKhaiGia: consignment.declaredValue,
                                  } 
                                } 
                              })
                            }}
                          >
                            <FiRefreshCw size={14} className="me-1" />
                            Đặt lại
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  )
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div style={{ fontSize: '3rem', }}>📦</div>
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
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="fw-bold mb-1">Chi tiết vé & Hóa đơn</h3>
                <p className="text-muted small mb-0">Mã vé: {selectedBooking.id}</p>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowDetailModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {/* Trip Header */}
              <div className="trip-header-section mb-4">
                <div className="trip-route">
                  <div className="route-item">
                    <div className="route-time">{selectedBooking.departureTime}</div>
                    <div className="route-location">{selectedBooking.from}</div>
                  </div>
                  <div className="route-arrow">
                    <FiMapPin size={18} style={{ color: '#0066cc' }} />
                  </div>
                  <div className="route-item">
                    <div className="route-time">{selectedBooking.arrivalTime}</div>
                    <div className="route-location">{selectedBooking.to}</div>
                  </div>
                </div>
                <div className="trip-date-operator">
                  <span className="badge-date">{selectedBooking.date}</span>
                  <span className="badge-operator">{selectedBooking.operator}</span>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="qr-section mb-4">
                <h6 className="fw-bold mb-3">📱 Mã QR vé di động</h6>
                <div className="qr-container">
                  <QRCode
                    value={JSON.stringify({
                      bookingId: selectedBooking.id,
                      passenger: selectedBooking.passengerName,
                      from: selectedBooking.from,
                      to: selectedBooking.to,
                      date: selectedBooking.date,
                      time: selectedBooking.departureTime
                    })}
                    size={180}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="text-muted small mt-2 text-center">Sử dụng khi lên xe hoặc nhận hàng</p>
              </div>

              {/* Passenger Information */}
              <div className="info-section mb-4">
                <h6 className="fw-bold mb-3">👤 Thông tin hành khách</h6>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Tên:</span>
                    <span className="info-value">{selectedBooking.passengerName}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{selectedBooking.email}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Điện thoại:</span>
                    <span className="info-value">{selectedBooking.phone}</span>
                  </div>
                </div>
              </div>

              {/* Booking Information */}
              <div className="info-section mb-4">
                <h6 className="fw-bold mb-3">🎫 Thông tin đặt vé</h6>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Ghế:</span>
                    <span className="info-value">{selectedBooking.seats.join(', ')}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Số lượng:</span>
                    <span className="info-value">{selectedBooking.seats.length} ghế</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Trạng thái:</span>
                    <span className="info-value">
                      <span className="badge" style={{
                        backgroundColor: selectedBooking.status === 'Da thanh toan' ? '#d1fae5' : '#fee2e2',
                        color: selectedBooking.status === 'Da thanh toan' ? '#065f46' : '#991b1b',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}>
                        {selectedBooking.status}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="cost-section mb-4">
                <h6 className="fw-bold mb-3">💰 Chi tiết chi phí</h6>
                <div className="cost-table">
                  <div className="cost-row">
                    <span className="cost-label">Giá vé ({selectedBooking.seats.length} ghế)</span>
                    <span className="cost-value">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedBooking.price)}
                    </span>
                  </div>
                  {selectedBooking.cargoInfo?.type !== 'none' && (
                    <>
                      <div className="cost-row">
                        <span className="cost-label">Loại hàng</span>
                        <span className="cost-value">{selectedBooking.cargoInfo.description}</span>
                      </div>
                      {selectedBooking.cargoInfo.weight && (
                        <div className="cost-row">
                          <span className="cost-label">Cân nặng</span>
                          <span className="cost-value">{selectedBooking.cargoInfo.weight} kg</span>
                        </div>
                      )}
                      <div className="cost-row">
                        <span className="cost-label">Cước hàng hóa</span>
                        <span className="cost-value">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedBooking.cargoInfo.price)}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="cost-row-total">
                    <span className="cost-label">Tổng cộng</span>
                    <span className="cost-value-total">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                        selectedBooking.price + (selectedBooking.cargoInfo?.price || 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cargo Tracking Timeline */}
              {selectedBooking.cargoInfo?.type !== 'none' && getTripStatus(selectedBooking) !== 'upcoming' && selectedBooking.trackingInfo && (
                <div className="tracking-section mb-4">
                  <h6 className="fw-bold mb-3">📦 Theo dõi hàng hóa</h6>
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
                <div className="notifications-section">
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

            <div className="modal-footer">
              <button
                onClick={() => setShowDetailModal(false)}
                className="btn btn-secondary"
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

              {/* Timeline & Images Section */}
              <div className="section mb-4 mt-4">
                {(() => {
                  const imgs = selectedConsignment.images || [];
                  let customerImages = imgs;
                  let pickupImage = null;
                  let deliveryImage = null;

                  if (selectedConsignment.cargoStatus === 'delivered' && imgs.length >= 2) {
                    deliveryImage = imgs[imgs.length - 1];
                    pickupImage = imgs[imgs.length - 2];
                    customerImages = imgs.slice(0, imgs.length - 2);
                  } else if (selectedConsignment.cargoStatus === 'delivered' && imgs.length === 1) {
                    deliveryImage = imgs[0];
                    customerImages = [];
                  } else if (['in_transit', 'received_at_station'].includes(selectedConsignment.cargoStatus) && imgs.length >= 1) {
                    pickupImage = imgs[imgs.length - 1];
                    customerImages = imgs.slice(0, imgs.length - 1);
                  }

                  return (
                    <>
                      <div className="mb-4">
                        <h6 className="fw-bold mb-3">📦 Hình Ảnh Của Bạn (Lúc Gửi)</h6>
                        {customerImages.length > 0 ? (
                          <div className="d-flex flex-wrap gap-2">
                            {customerImages.map((img, i) => (
                              <img key={i} src={img} alt={"Hình ảnh khách gửi " + (i+1)} style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '0.5rem', border: '1px solid #e5e7eb', objectFit: 'cover' }} />
                            ))}
                          </div>
                        ) : (
                          <div className="text-muted small italic">Không có hình ảnh đính kèm</div>
                        )}
                      </div>

                      <h6 className="fw-bold mb-3">🕒 Lịch Trình & Hình Ảnh (Tài xế)</h6>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingLeft: '0.5rem', borderLeft: '2px solid #e5e7eb', marginLeft: '0.5rem' }}>
                        
                        <div style={{ display: 'flex', gap: '1rem', opacity: ['pending', 'confirmed', 'received_at_station', 'in_transit', 'delivered'].includes(selectedConsignment.cargoStatus) ? 1 : 0.5 }}>
                          <div style={{ marginLeft: '-1.15rem', backgroundColor: 'white', padding: '0.2rem' }}>⏳</div>
                          <div>
                            <div className="fw-600">Đã gửi yêu cầu</div>
                            <div className="small text-muted">Đang chờ tài xế duyệt</div>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1rem', opacity: ['confirmed', 'received_at_station', 'in_transit', 'delivered'].includes(selectedConsignment.cargoStatus) ? 1 : 0.5 }}>
                          <div style={{ marginLeft: '-1.15rem', backgroundColor: 'white', padding: '0.2rem' }}>✅</div>
                          <div>
                            <div className="fw-600">Đã duyệt (Chờ nhận hàng)</div>
                            <div className="small text-muted">Tài xế đã đồng ý và đang chờ lấy hàng</div>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1rem', opacity: ['in_transit', 'delivered'].includes(selectedConsignment.cargoStatus) ? 1 : 0.5 }}>
                          <div style={{ marginLeft: '-1.15rem', backgroundColor: 'white', padding: '0.2rem' }}>🚚</div>
                          <div>
                            <div className="fw-600">Đã lấy hàng & Đang vận chuyển</div>
                            <div className="small text-muted">Tài xế đã xác nhận nhận hàng</div>
                            {pickupImage && ['in_transit', 'delivered'].includes(selectedConsignment.cargoStatus) && (
                              <div className="mt-2">
                                <img src={pickupImage} alt="Hình ảnh nhận hàng" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '0.5rem', border: '1px solid #e5e7eb', objectFit: 'cover' }} />
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', opacity: ['delivered'].includes(selectedConsignment.cargoStatus) ? 1 : 0.5 }}>
                          <div style={{ marginLeft: '-1.15rem', backgroundColor: 'white', padding: '0.2rem' }}>🎉</div>
                          <div>
                            <div className="fw-600">Đã giao thành công</div>
                            <div className="small text-muted">Hàng đã đến tay người nhận</div>
                            {deliveryImage && selectedConsignment.cargoStatus === 'delivered' && (
                              <div className="mt-2">
                                <img src={deliveryImage} alt="Hình ảnh giao hàng" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '0.5rem', border: '1px solid #e5e7eb', objectFit: 'cover' }} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="modal-footer">
              {selectedConsignment.cargoStatus === 'pending' && (
                <button
                  onClick={() => handleCancelConsignment(selectedConsignment.id)}
                  className="btn"
                  style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.75rem 1.5rem' }}
                >
                  Hủy đơn hàng
                </button>
              )}
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
