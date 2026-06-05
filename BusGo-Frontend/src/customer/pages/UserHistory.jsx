import { useState, useEffect } from 'react'
import { FiHeart, FiTrash2, FiMapPin, FiClock, FiDollarSign, FiX, FiDownload, FiBell, FiCheckCircle, FiLoader, FiStar, FiPackage, FiTruck, FiCheckSquare, FiAlertTriangle, FiArrowRight } from 'react-icons/fi'
import { MdLocalShipping, MdCreditCard } from 'react-icons/md'
import { useNavigate, useLocation } from 'react-router-dom'
import QRCode from 'qrcode.react'
import { StorageUtil } from '../../utils/helpers'
import { getMyTicketsAPI, cancelBookingAPI, submitFeedbackAPI, getFeedbackAPI } from '../../services/bookingService'
import { requestTicketCancellationAPI } from '../../services/customerService'
import { getMyConsignmentsAPI } from '../../services/cargoService'
import './UserHistory.css'

export default function UserHistory() {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(location.state?.defaultTab || 'history')
  const [statusFilter, setStatusFilter] = useState('all') // all, upcoming, completed, cancelled
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelRequest, setCancelRequest] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
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
      setWatchlist([])
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
        const mappedConsignments = data
          .filter(item => item.trangThaiThanhToan === 'paid')
          .map(item => {
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
    // If vé is pending cancellation, don't return upcoming
    if (booking.status === 'Cho xu ly huy') return 'pending_cancellation'
    
    if (booking.status === 'Da huy') return 'cancelled'
    
    // Tự động chuyển thành completed nếu đã qua giờ khởi hành
    const departureDate = parseDateTimeUTC(booking.date, booking.departureTime)
    const now = new Date()
    if (departureDate < now) {
      return 'completed'
    }
    
    if (booking.tripStatus === 'da_len_lich') return 'upcoming'
    if (booking.tripStatus === 'dang_khoi_hanh') return 'in_transit'
    if (booking.tripStatus === 'da_hoan_thanh') return 'completed'
    
    return 'upcoming'
  }

  // Filter bookings by status
  const filteredBookings = bookings.filter(booking => {
    if (statusFilter === 'all') return true
    return getTripStatus(booking) === statusFilter
  })

  // Check if cancellation is allowed
  const canCancelBooking = (booking) => {
    // Nếu vé đã có yêu cầu hủy pending hoặc approved → không được hủy tiếp
    if (booking.cancellationRequest && (booking.cancellationRequest.trangThai === 'pending' || booking.cancellationRequest.trangThai === 'approved')) {
      return false;
    }

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
        await requestTicketCancellationAPI(cancelRequest.id, cancelReason || 'Khách hàng yêu cầu hủy')
        alert('Đã gửi yêu cầu hủy vé thành công. Vui lòng đợi nhân viên xác nhận.')
        
        // Update local state to show it's pending (we add a temporary flag)
        setBookings(prev =>
          prev.map(b =>
            b.id === cancelRequest.id
              ? { ...b, status: 'Cho xu ly huy' }
              : b
          )
        )
        setShowCancelModal(false)
        setCancelRequest(null)
        setCancelReason('')
      } catch (err) {
        console.error('Lỗi khi hủy đặt vé:', err)
        alert(err.response?.data?.message || err.message || 'Lỗi khi hủy đặt vé. Vui lòng thử lại.')
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
      'pending':    { ...baseStyle, backgroundColor: '#fef3c7', color: '#d97706', text: 'Chờ xác nhận', icon: FiClock },
      'confirmed':  { ...baseStyle, backgroundColor: '#dbeafe', color: '#2563eb', text: 'Đã xác nhận', icon: FiCheckSquare },
      'in_transit': { ...baseStyle, backgroundColor: '#ede9fe', color: '#7c3aed', text: 'Đang vận chuyển', icon: FiTruck },
      'delivered':  { ...baseStyle, backgroundColor: '#d1fae5', color: '#059669', text: 'Đã giao', icon: FiCheckCircle },
      'cancelled':  { ...baseStyle, backgroundColor: '#fee2e2', color: '#dc2626', text: 'Đã hủy', icon: FiX }
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
    
    // Check if vé status is "Cho xu ly huy"
    if (booking.status === 'Cho xu ly huy') {
      return { ...baseStyle, backgroundColor: '#f59e0b', text: 'Chờ xử lý hủy', icon: <FiAlertTriangle size={14} /> }
    }
    
    // Check cancellation request status
    if (booking.cancellationRequest) {
      if (booking.cancellationRequest.trangThai === 'pending') {
        return { ...baseStyle, backgroundColor: '#f59e0b', text: 'Chờ xử lý hủy', icon: <FiAlertTriangle size={14} /> }
      }
      if (booking.cancellationRequest.trangThai === 'approved') {
        return { ...baseStyle, backgroundColor: '#ef4444', text: 'Đã hủy', icon: <FiX size={14} /> }
      }
      if (booking.cancellationRequest.trangThai === 'rejected') {
        return { ...baseStyle, backgroundColor: '#f59e0b', text: 'Yêu cầu hủy bị từ chối', icon: <FiAlertTriangle size={14} /> }
      }
    }
    
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1 className="fw-bold text-neutral-900" style={{ marginInlineStart: 20 }}>Lịch sử hoạt động</h1>
          <button
            onClick={() => {
              setLoading(true)
              const token = StorageUtil.getToken()
              if (token) {
                getMyTicketsAPI(token)
                  .then(tickets => {
                    setBookings(tickets)
                    setError(null)
                  })
                  .catch(err => {
                    console.error('Lỗi refresh:', err)
                    setError(err.message || 'Lỗi khi tải lịch sử vé')
                  })
                  .finally(() => setLoading(false))
              }
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#004b87',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            title="Refresh lịch sử"
          >
            🔄 Làm mới
          </button>
        </div>

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
                className={`filter-btn ${statusFilter === 'pending_cancellation' ? 'active' : ''}`}
                onClick={() => setStatusFilter('pending_cancellation')}
              >
                Chờ xử lý hủy ({bookings.filter(b => getTripStatus(b) === 'pending_cancellation').length})
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
                            {booking.cancellationRequest ? 
                              `Đã gửi yêu cầu (${booking.cancellationRequest.trangThai})` 
                              : 'Yêu cầu hủy'}
                          </button>
                        )}
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
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💔</div>
                <h5 className="fw-bold text-neutral-900 mb-2">Chưa có chuyến xe yêu thích</h5>
                <p className="text-muted mb-4">Hãy thêm các chuyến xe yêu thích của bạn để theo dõi!</p>
              </div>
            )}
          </div>
        )}

        {/* Cargo Tracking Tab */}
        {activeTab === 'cargo' && (
          <div className="animate-fade-in">
            {/* Status Filter for Cargo */}
            <div className="flex flex-wrap gap-2 mb-8 bg-slate-50 p-2 rounded-2xl border border-slate-200">
              <button
                className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${cargoStatusFilter === 'all' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
                onClick={() => setCargoStatusFilter('all')}
              >
                Tất cả ({consignments.length})
              </button>
              <button
                className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${cargoStatusFilter === 'pending' ? 'bg-white text-orange-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
                onClick={() => setCargoStatusFilter('pending')}
              >
                Chờ xác nhận ({consignments.filter(c => c.cargoStatus === 'pending').length})
              </button>
              <button
                className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${cargoStatusFilter === 'confirmed' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
                onClick={() => setCargoStatusFilter('confirmed')}
              >
                Đã xác nhận ({consignments.filter(c => c.cargoStatus === 'confirmed').length})
              </button>
              <button
                className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${cargoStatusFilter === 'in_transit' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
                onClick={() => setCargoStatusFilter('in_transit')}
              >
                Đang vận chuyển ({consignments.filter(c => c.cargoStatus === 'in_transit').length})
              </button>
              <button
                className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${cargoStatusFilter === 'delivered' ? 'bg-white text-emerald-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
                onClick={() => setCargoStatusFilter('delivered')}
              >
                Đã giao ({consignments.filter(c => c.cargoStatus === 'delivered').length})
              </button>
            </div>

            {filteredConsignments.length > 0 ? (
              <div className="grid gap-6">
                {filteredConsignments.map(consignment => {
                  const statusBadge = getCargoStatusBadgeInfo(consignment.cargoStatus)
                  const cargoTypeMap = {
                    'documents': '📄 Tài liệu',
                    'fragile': '🍷 Hàng dễ vỡ',
                    'bulky': '📦 Hàng cồng kềnh',
                    'motorcycle': '🏍️ Xe máy'
                  }
                  
                  return (
                    <div key={consignment.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 transition-all hover:shadow-md relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: statusBadge.color }}></div>
                      
                      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                        {/* Left Side: Route and Status */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 text-xs font-bold rounded-full" style={{ backgroundColor: statusBadge.backgroundColor, color: statusBadge.color }}>
                              {statusBadge.text}
                            </span>
                            <span className="text-slate-500 text-sm font-bold">Mã Ký Gửi: <span className="text-slate-800">{consignment.id}</span></span>
                            <span className="text-slate-400 text-xs">• {new Date(consignment.date).toLocaleDateString('vi-VN')}</span>
                          </div>

                          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4 w-full max-w-md">
                            <div className="flex-1">
                              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Điểm gửi</span>
                              <strong className="text-slate-800">{consignment.from}</strong>
                            </div>
                            <div className="text-slate-300 flex-shrink-0">
                              <FiArrowRight size={20} />
                            </div>
                            <div className="flex-1 text-right">
                              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Điểm nhận</span>
                              <strong className="text-slate-800">{consignment.to}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Right Side: Cargo Details */}
                        <div className="flex-1 md:border-l md:border-slate-100 md:pl-6 w-full">
                          <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm mb-6">
                            <div>
                              <span className="text-slate-400 block text-xs mb-1">Loại hàng</span>
                              <strong className="text-slate-700">{cargoTypeMap[consignment.type] || consignment.type}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-xs mb-1">Trọng lượng</span>
                              <strong className="text-slate-700">{consignment.weight ? consignment.weight + ' kg' : 'N/A'}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-xs mb-1">Khai giá bảo hiểm</span>
                              <strong className="text-blue-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(consignment.declaredValue || 0)}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-xs mb-1">Cước vận chuyển</span>
                              <strong className="text-emerald-600 text-lg font-black">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(consignment.totalPrice || 0)}</strong>
                            </div>
                          </div>

                          <div className="flex justify-end pt-4 border-t border-slate-100">
                            <button
                              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 transform hover:-translate-y-0.5"
                              onClick={() => openConsignmentDetailModal(consignment)}
                            >
                              <FiPackage size={16} /> Xem chi tiết
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                <span className="text-6xl mb-4 block">📦</span>
                <h5 className="text-xl font-bold text-slate-800 mb-2">Chưa có ký gửi hàng hóa</h5>
                <p className="text-slate-500 mb-6">Bạn chưa có đơn hàng ký gửi nào. Đặt giao hàng ngay để theo dõi!</p>
                <button
                  onClick={() => navigate('/cargo-consignment')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all"
                >
                  Tạo Đơn Gửi Hàng
                </button>
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

              <div className="form-group mb-3">
                <label className="fw-bold mb-2">Lý do hủy vé (Bắt buộc):</label>
                <textarea 
                  className="form-control" 
                  rows="3"
                  placeholder="Vui lòng nhập lý do hủy vé..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                ></textarea>
              </div>
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
        <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-4xl animate-fade-in-up max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-wider">Chi Tiết Hợp Đồng Ký Gửi</h3>
              <button
                className="text-slate-400 hover:text-slate-700 transition-colors p-2 rounded-full hover:bg-slate-200"
                onClick={() => setShowConsignmentDetailModal(false)}
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Side: General Info */}
                <div className="w-full lg:w-1/2">
                  {/* Header with Status */}
                  <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 mb-6">
                    <h5 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">Mã vận đơn: <span className="font-black text-blue-600 ml-2">{selectedConsignment.id}</span></h5>
                    <div className="flex gap-4">
                      <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 text-xs">
                        <span className="text-slate-500 block mb-1">Ngày gửi:</span>
                        <strong className="text-slate-800">{new Date(selectedConsignment.createdAt).toLocaleDateString('vi-VN')}</strong>
                      </div>
                      <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 text-xs">
                        <span className="text-slate-500 block mb-1">Trạng thái:</span>
                        <strong style={{ color: getCargoStatusBadgeInfo(selectedConsignment.cargoStatus).color }}>
                          {getCargoStatusBadgeInfo(selectedConsignment.cargoStatus).text}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Route Information */}
                  <div className="mb-6">
                    <h6 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <span className="text-blue-500">📍</span> Hành Trình
                    </h6>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Điểm gửi</span>
                        <strong className="text-slate-800 block">{selectedConsignment.from}</strong>
                        {selectedConsignment.pickupLocationDetail && (
                          <span className="text-xs text-slate-500 mt-1 block">{selectedConsignment.pickupLocationDetail}</span>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Điểm nhận</span>
                        <strong className="text-slate-800 block">{selectedConsignment.to}</strong>
                        {selectedConsignment.deliveryLocationDetail && (
                          <span className="text-xs text-slate-500 mt-1 block">{selectedConsignment.deliveryLocationDetail}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cargo Information */}
                  <div className="mb-6">
                    <h6 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <span className="text-orange-500">📦</span> Thông Tin Hàng Hóa
                    </h6>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Loại hàng</span>
                        <strong className="text-slate-800">
                          {selectedConsignment.type === 'documents' && '📄 Tài liệu'}
                          {selectedConsignment.type === 'fragile' && '🍷 Hàng dễ vỡ'}
                          {selectedConsignment.type === 'bulky' && '📦 Hàng cồng kềnh'}
                          {selectedConsignment.type === 'motorcycle' && '🏍️ Xe máy'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Trọng lượng</span>
                        <strong className="text-slate-800">{selectedConsignment.weight ? selectedConsignment.weight + ' kg' : 'N/A'}</strong>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Khai giá tài sản</span>
                        <strong className="text-blue-600">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedConsignment.declaredValue || 0)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Sender & Receiver Information */}
                  <div className="mb-6">
                    <h6 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <span className="text-teal-500">👤</span> Liên Hệ
                    </h6>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 grid grid-cols-2 gap-4">
                      <div>
                        <strong className="text-xs text-teal-600 block mb-2 uppercase tracking-wider">Người gửi</strong>
                        <span className="text-sm font-bold text-slate-800 block mb-1">{selectedConsignment.senderName}</span>
                        <span className="text-xs text-slate-500 block">{selectedConsignment.senderPhone}</span>
                      </div>
                      <div>
                        <strong className="text-xs text-teal-600 block mb-2 uppercase tracking-wider">Người nhận</strong>
                        <span className="text-sm font-bold text-slate-800 block mb-1">{selectedConsignment.receiverName}</span>
                        <span className="text-xs text-slate-500 block">{selectedConsignment.receiverPhone}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Timeline and Timeline */}
                <div className="w-full lg:w-1/2 flex flex-col">
                  {/* Timeline */}
                  <div className="flex-grow">
                    <h6 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <span className="text-indigo-500">🕒</span> Tiến Độ Vận Chuyển
                    </h6>
                    <div className="relative pl-6 ml-4 border-l-2 border-slate-200 space-y-8">
                      
                      {/* Step 1: Pending */}
                      <div className={`relative ${['pending', 'confirmed', 'in_transit', 'delivered'].includes(selectedConsignment.cargoStatus) ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                        <div className={`absolute -left-[35px] top-0 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-sm ${selectedConsignment.cargoStatus === 'pending' ? 'bg-orange-500 text-white animate-pulse' : 'bg-slate-200 text-slate-500'}`}>
                          {selectedConsignment.cargoStatus === 'pending' ? <FiLoader size={14} className="animate-spin" /> : <FiCheckCircle size={14} />}
                        </div>
                        <strong className="text-sm text-slate-800 block mb-1">Yêu cầu đã tiếp nhận</strong>
                        <span className="text-xs text-slate-500 block">Đang chờ tài xế/trạm điều hành xác nhận</span>
                      </div>

                      {/* Step 2: Confirmed */}
                      <div className={`relative ${['confirmed', 'in_transit', 'delivered'].includes(selectedConsignment.cargoStatus) ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                        <div className={`absolute -left-[35px] top-0 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-sm ${selectedConsignment.cargoStatus === 'confirmed' ? 'bg-blue-500 text-white animate-pulse' : (['in_transit', 'delivered'].includes(selectedConsignment.cargoStatus) ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500')}`}>
                          {selectedConsignment.cargoStatus === 'confirmed' ? <FiLoader size={14} className="animate-spin" /> : <FiCheckCircle size={14} />}
                        </div>
                        <strong className="text-sm text-slate-800 block mb-1">Đã phê duyệt</strong>
                        <span className="text-xs text-slate-500 block">Tài xế đã nhận yêu cầu. Khách hàng đã thanh toán. Chờ lấy hàng.</span>
                      </div>

                      {/* Step 3: In Transit */}
                      <div className={`relative ${['in_transit', 'delivered'].includes(selectedConsignment.cargoStatus) ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                        <div className={`absolute -left-[35px] top-0 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-sm ${selectedConsignment.cargoStatus === 'in_transit' ? 'bg-indigo-500 text-white animate-pulse' : (['delivered'].includes(selectedConsignment.cargoStatus) ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500')}`}>
                          <MdLocalShipping size={14} />
                        </div>
                        <strong className="text-sm text-slate-800 block mb-1">Đang vận chuyển</strong>
                        <span className="text-xs text-slate-500 block">Hàng hóa đang trên đường giao.</span>
                        {selectedConsignment.images?.[0] && ['in_transit', 'delivered'].includes(selectedConsignment.cargoStatus) && (
                          <div className="mt-3">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Ảnh lấy hàng (Tài xế chụp)</span>
                            <img src={selectedConsignment.images[0]} alt="Lấy hàng" className="w-full h-32 object-cover rounded-xl border border-slate-200 shadow-sm" />
                          </div>
                        )}
                      </div>

                      {/* Step 4: Delivered */}
                      <div className={`relative ${['delivered'].includes(selectedConsignment.cargoStatus) ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                        <div className={`absolute -left-[35px] top-0 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-sm ${selectedConsignment.cargoStatus === 'delivered' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                          <FiCheckCircle size={14} />
                        </div>
                        <strong className="text-sm text-slate-800 block mb-1">Đã giao thành công</strong>
                        <span className="text-xs text-slate-500 block">Người nhận đã nhận được hàng.</span>
                        {selectedConsignment.images?.[1] && selectedConsignment.cargoStatus === 'delivered' && (
                          <div className="mt-3">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Ảnh giao hàng (Tài xế chụp)</span>
                            <img src={selectedConsignment.images[1]} alt="Giao hàng" className="w-full h-32 object-cover rounded-xl border border-slate-200 shadow-sm" />
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Pricing Summary Bottom Right */}
                  <div className="mt-8 bg-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                    <div className="absolute -right-6 -bottom-6 text-slate-800 opacity-50 transform rotate-12">
                      <MdCreditCard size={100} />
                    </div>
                    <div className="relative z-10">
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-2">Thanh toán cước phí</span>
                      <div className="flex justify-between items-end">
                        <strong className="text-2xl font-black text-emerald-400">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedConsignment.totalPrice || 0)}
                        </strong>
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-500/30">
                          ĐÃ THANH TOÁN
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
              <button
                className="bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300 font-bold px-8 py-2.5 rounded-xl transition-all"
                onClick={() => setShowConsignmentDetailModal(false)}
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
