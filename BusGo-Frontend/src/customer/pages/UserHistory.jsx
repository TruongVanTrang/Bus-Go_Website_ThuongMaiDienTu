import { useState, useEffect } from 'react'
import { FiHeart, FiTrash2, FiMapPin, FiClock, FiDollarSign, FiX, FiDownload, FiBell, FiCheckCircle, FiLoader, FiStar, FiPackage, FiTruck, FiCheckSquare, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi'
import { useNavigate, useLocation } from 'react-router-dom'
import QRCode from 'qrcode.react'
import { StorageUtil } from '../../utils/helpers'
import { getMyTicketsAPI, cancelBookingAPI, submitFeedbackAPI, getFeedbackAPI } from '../../services/bookingService'
import { getMyConsignmentsAPI, cancelConsignmentAPI } from '../../services/cargoService'
import './UserHistory.css'

export default function UserHistory() {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(location.state?.defaultTab || 'history')

  useEffect(() => {
    if (location.state?.defaultTab) {
      setActiveTab(location.state.defaultTab)
    }
  }, [location.state?.defaultTab])
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
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentConsignment, setPaymentConsignment] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paymentLoading, setPaymentLoading] = useState(false)
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
            images: item.hinhAnh || [],
            rawBackendData: item
          }
        })
        setConsignments(mappedConsignments)
      } catch (err) {
        console.error('Lỗi khi tải lịch sử ký gửi:', err)
      }
    }
    loadConsignments()
  }, [navigate, location.key])

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

  // ── status chip helpers ───────────────────────────────────────────────────
  const cargoStatusChip = (status) => {
    const map = {
      pending:    { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500',   label: 'Chờ duyệt' },
      confirmed:  { bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500',    label: 'Đã xác nhận' },
      in_transit: { bg: 'bg-violet-100',  text: 'text-violet-700',  dot: 'bg-violet-500',  label: 'Đang vận chuyển' },
      delivered:  { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Đã giao' },
      cancelled:  { bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500',     label: 'Đã hủy' },
    }
    return map[status] || map.pending
  }

  const tripStatusChip = (booking) => {
    const s = getTripStatus(booking)
    if (booking.status === 'Da huy')        return { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Đã hủy' }
    if (booking.status === 'Cho xu ly huy') return { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Chờ xử lý hủy' }
    if (s === 'upcoming')   return { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'Sắp khởi hành' }
    if (s === 'in_transit') return { bg: 'bg-blue-100',    text: 'text-blue-700',    label: 'Đang di chuyển' }
    return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Hoàn thành' }
  }

  const cargoTypeMap = {
    documents:  '📄 Tài liệu',
    fragile:    '🍷 Hàng dễ vỡ',
    bulky:      '📦 Hàng cồng kềnh',
    motorcycle: '🏍️ Xe máy',
  }

  const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0)

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium text-sm">Đang tải lịch sử hoạt động...</p>
        </div>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error && bookings.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-sm">
          <FiAlertTriangle className="text-red-400 mx-auto mb-4" size={48} />
          <h3 className="font-bold text-slate-800 text-xl mb-2">Đã xảy ra lỗi</h3>
          <p className="text-slate-500 text-sm mb-5">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm">
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  const tabs = [
    { key: 'history',   icon: '🎫', label: 'Chuyến xe',         count: bookings.length },
    { key: 'watchlist', icon: '❤️',  label: 'Tuyến yêu thích',  count: watchlist.length },
    { key: 'cargo',     icon: '📦', label: 'Theo dõi hàng hóa', count: consignments.length },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30">

      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#004e92] to-[#0066cc] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <p className="text-blue-200 text-sm font-medium uppercase tracking-widest mb-1">Tài khoản của bạn</p>
          <h1 className="text-3xl font-extrabold tracking-tight">Lịch sử hoạt động</h1>
          <p className="text-blue-200 text-sm mt-1">Quản lý chuyến xe, tuyến yêu thích và đơn hàng ký gửi</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-5 pb-16">

        {/* Tab Bar */}
        <div className="bg-white rounded-2xl shadow-md shadow-slate-200/60 p-1.5 flex gap-1 mb-8">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === t.key
                  ? 'bg-gradient-to-r from-[#004e92] to-[#0066cc] text-white shadow-md shadow-blue-200'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === t.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── TAB 1: CHUYẾN XE ─────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <div>
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { key: 'all',        label: `Tất cả (${bookings.length})` },
                { key: 'upcoming',   label: `Sắp khởi hành (${bookings.filter(b => getTripStatus(b) === 'upcoming').length})` },
                { key: 'in_transit', label: `Đang di chuyển (${bookings.filter(b => getTripStatus(b) === 'in_transit').length})` },
                { key: 'completed',  label: `Hoàn thành (${bookings.filter(b => getTripStatus(b) === 'completed').length})` },
                { key: 'cancelled',  label: `Đã hủy (${bookings.filter(b => getTripStatus(b) === 'cancelled').length})` },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    statusFilter === f.key
                      ? 'bg-[#0066cc] text-white border-[#0066cc] shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {filteredBookings.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredBookings.map(booking => {
                  const chip = tripStatusChip(booking)
                  const totalPrice = booking.price + (booking.cargoInfo?.price || 0)
                  return (
                    <div key={booking.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md hover:shadow-blue-100/60 transition-all duration-200 flex flex-col">
                      <div className="h-1 bg-gradient-to-r from-[#004e92] to-[#0066cc]" />
                      <div className="p-5 flex flex-col flex-1">
                        {/* Status + ID */}
                        <div className="flex items-start justify-between mb-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${chip.bg} ${chip.text}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                            {chip.label}
                          </span>
                          <div className="text-right">
                            <p className="text-[10px] text-slate-400 font-medium">Mã vé</p>
                            <p className="text-xs font-bold text-slate-700">{booking.id}</p>
                          </div>
                        </div>

                        {/* Route */}
                        <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 mb-4">
                          <div className="text-center flex-1">
                            <p className="text-base font-extrabold text-slate-800 leading-tight">{booking.departureTime}</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">{booking.from}</p>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-12 h-px bg-slate-300" />
                            <FiMapPin size={12} className="text-[#0066cc]" />
                          </div>
                          <div className="text-center flex-1">
                            <p className="text-base font-extrabold text-slate-800 leading-tight">{booking.arrivalTime}</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">{booking.to}</p>
                          </div>
                        </div>

                        {/* Meta */}
                        <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                          <div className="bg-slate-50 rounded-lg px-3 py-2">
                            <p className="text-slate-400 font-medium">Ngày</p>
                            <p className="text-slate-700 font-bold">{booking.date}</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg px-3 py-2">
                            <p className="text-slate-400 font-medium">Ghế</p>
                            <p className="text-slate-700 font-bold">{booking.seats?.join(', ')}</p>
                          </div>
                        </div>

                        {/* Price + Actions */}
                        <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100">
                          <div>
                            <p className="text-[10px] text-slate-400 font-medium">Tổng tiền</p>
                            <p className="text-lg font-extrabold text-[#0066cc]">{fmt(totalPrice)}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => openDetailModal(booking)} className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors" title="Xem chi tiết">
                              <FiDownload size={15} />
                            </button>
                            {getTripStatus(booking) === 'completed' && (
                              <button onClick={() => openRatingModal(booking)} className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-600 transition-colors" title="Đánh giá">
                                <FiStar size={15} />
                              </button>
                            )}
                            {canCancelBooking(booking) && (
                              <button onClick={() => handleCancelRequest(booking)} className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition-colors" title="Hủy vé">
                                <FiX size={15} />
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
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                <div className="text-5xl mb-4">📋</div>
                <h5 className="font-bold text-slate-700 text-lg mb-1">Không có vé nào</h5>
                <p className="text-slate-400 text-sm">Chưa có chuyến xe nào với trạng thái này.</p>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: TUYẾN YÊU THÍCH ──────────────────────────────────── */}
        {activeTab === 'watchlist' && (
          <div>
            {watchlist.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {watchlist.map(trip => (
                  <div key={trip.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col">
                    <div className="h-1 bg-gradient-to-r from-pink-500 to-rose-500" />
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-600">
                          <FiHeart size={11} fill="currentColor" /> Yêu thích
                        </span>
                        {trip.averageRating && <span className="text-xs font-bold text-amber-600">⭐ {trip.averageRating}</span>}
                      </div>
                      <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 mb-4">
                        <div className="flex-1 text-center">
                          <p className="text-sm font-bold text-slate-800">{trip.from}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Điểm đi</p>
                        </div>
                        <FiMapPin size={14} className="text-[#0066cc] flex-shrink-0" />
                        <div className="flex-1 text-center">
                          <p className="text-sm font-bold text-slate-800">{trip.to}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Điểm đến</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                        <div className="bg-slate-50 rounded-lg px-3 py-2">
                          <p className="text-slate-400">Giờ khởi hành</p>
                          <p className="font-bold text-slate-700">{trip.departureTime || '—'}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg px-3 py-2">
                          <p className="text-slate-400">Loại xe</p>
                          <p className="font-bold text-slate-700">{trip.busType === 'bus' ? 'Xe Bus' : 'Minibus'}</p>
                        </div>
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100">
                        <div>
                          <p className="text-[10px] text-slate-400">Giá vé từ</p>
                          <p className="text-base font-extrabold text-emerald-600">{fmt(trip.price)}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => removeFromWatchlist(trip.id)} className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition-colors" title="Xóa khỏi yêu thích">
                            <FiTrash2 size={15} />
                          </button>
                          <button onClick={() => navigate(`/search?from=${trip.from}&to=${trip.to}`)} className="px-4 py-2 rounded-xl bg-[#0066cc] hover:bg-[#004e92] text-white text-xs font-bold transition-colors">
                            Tìm chuyến
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                <div className="text-5xl mb-4">💔</div>
                <h5 className="font-bold text-slate-700 text-lg mb-1">Chưa có tuyến yêu thích</h5>
                <p className="text-slate-400 text-sm">Hãy thêm các chuyến xe yêu thích để theo dõi!</p>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: THEO DÕI HÀNG HÓA ───────────────────────────────── */}
        {activeTab === 'cargo' && (
          <div>
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { key: 'all',        label: `Tất cả (${consignments.length})` },
                { key: 'pending',    label: `Chờ duyệt (${consignments.filter(c => c.cargoStatus === 'pending').length})` },
                { key: 'confirmed',  label: `Đã xác nhận (${consignments.filter(c => c.cargoStatus === 'confirmed').length})` },
                { key: 'in_transit', label: `Đang vận chuyển (${consignments.filter(c => c.cargoStatus === 'in_transit').length})` },
                { key: 'delivered',  label: `Đã giao (${consignments.filter(c => c.cargoStatus === 'delivered').length})` },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setCargoStatusFilter(f.key)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    cargoStatusFilter === f.key
                      ? 'bg-[#0066cc] text-white border-[#0066cc] shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {filteredConsignments.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredConsignments.map(consignment => {
                  const chip = cargoStatusChip(consignment.cargoStatus)
                  return (
                    <div key={consignment.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col ${consignment.cargoStatus === 'cancelled' ? 'border-red-200' : consignment.isEdited ? 'border-amber-300' : 'border-slate-100'}`}>
                      <div className={`h-1 ${
                        consignment.cargoStatus === 'delivered'  ? 'bg-gradient-to-r from-emerald-400 to-teal-500' :
                        consignment.cargoStatus === 'in_transit' ? 'bg-gradient-to-r from-violet-500 to-purple-600' :
                        consignment.cargoStatus === 'confirmed'  ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                        consignment.cargoStatus === 'cancelled'  ? 'bg-gradient-to-r from-red-400 to-rose-500' :
                        'bg-gradient-to-r from-amber-400 to-orange-500'
                      }`} />
                      <div className="p-5 flex flex-col flex-1">
                        {/* Status + ID */}
                        <div className="flex items-start justify-between mb-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${chip.bg} ${chip.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${chip.dot}`} />
                            {chip.label}
                          </span>
                          <div className="text-right">
                            <p className="text-[10px] text-slate-400 font-medium">Mã ký gửi</p>
                            <p className="text-xs font-bold text-slate-700">{consignment.id}</p>
                          </div>
                        </div>

                        {/* Route */}
                        <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 mb-4">
                          <div className="flex-1 text-center">
                            <p className="text-sm font-extrabold text-slate-800">{consignment.from}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Điểm gửi</p>
                          </div>
                          <div className="flex flex-col items-center gap-0.5">
                            <div className="w-8 h-px bg-slate-300" />
                            <FiMapPin size={11} className="text-[#0066cc]" />
                          </div>
                          <div className="flex-1 text-center">
                            <p className="text-sm font-extrabold text-slate-800">{consignment.to}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Điểm nhận</p>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div className="bg-slate-50 rounded-lg px-3 py-2">
                            <p className="text-slate-400">Loại hàng</p>
                            <p className="font-bold text-slate-700">{cargoTypeMap[consignment.type] || consignment.type}</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg px-3 py-2">
                            <p className="text-slate-400">Trọng lượng</p>
                            <p className="font-bold text-slate-700">{consignment.weight ? consignment.weight + ' kg' : 'N/A'}</p>
                          </div>
                        </div>

                        {/* Sender/Receiver */}
                        <div className="text-xs text-slate-500 mb-3 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-600 shrink-0">Người gửi:</span>
                            <span>{consignment.senderName} • {consignment.senderPhone}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-600 shrink-0">Người nhận:</span>
                            <span>{consignment.receiverName} • {consignment.receiverPhone}</span>
                          </div>
                        </div>

                        {/* Price + Actions */}
                        <div className="mt-auto pt-3 border-t border-slate-100">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-[10px] text-slate-400">Phí gửi</p>
                              <p className="text-base font-extrabold text-[#0066cc]">{fmt(consignment.totalPrice)}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openConsignmentDetailModal(consignment)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-colors"
                            >
                              <FiPackage size={13} /> Xem chi tiết
                            </button>

                            {consignment.cargoStatus === 'delivered' && (
                              <span className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-bold cursor-default">
                                <FiCheckCircle size={13} /> Đã giao
                              </span>
                            )}
                            {consignment.cargoStatus === 'in_transit' && (
                              <span className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-violet-50 text-violet-600 text-xs font-bold cursor-default">
                                <FiTruck size={13} /> Đang vận chuyển
                              </span>
                            )}
                            {consignment.cargoStatus === 'pending' && (
                              <span className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-50 text-amber-600 text-xs font-bold cursor-default">
                                <FiClock size={13} /> Chờ duyệt
                              </span>
                            )}
                            {consignment.cargoStatus === 'confirmed' && consignment.rawBackendData?.trangThaiThanhToan !== 'paid' && (
                              <button
                                onClick={() => navigate('/cargo-payment', { state: { activeConsignment: { id: consignment.rawBackendData?.consignmentId || consignment.id, ...consignment.rawBackendData } } })}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors"
                              >
                                <FiDollarSign size={13} /> Thanh toán
                              </button>
                            )}
                            {consignment.rawBackendData?.trangThaiThanhToan === 'paid' && !['delivered', 'in_transit'].includes(consignment.cargoStatus) && (
                              <span className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-bold cursor-default">
                                <FiCheckCircle size={13} /> Đã thanh toán
                              </span>
                            )}
                            {consignment.cargoStatus === 'cancelled' && (
                              <button
                                onClick={() => navigate('/cargo-consignment', { state: { reorderData: { loaiDichVu: 'gui_kem', diemGui: consignment.from, diemNhan: consignment.to, tenNguoiGui: consignment.senderName, soDienThoaiNguoiGui: consignment.senderPhone, tenNguoiNhan: consignment.receiverName, soDienThoaiNguoiNhan: consignment.receiverPhone, loaiHangHoa: consignment.type, trongLuong: consignment.weight, giaTriKhaiGia: consignment.declaredValue } } })}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold transition-colors"
                              >
                                <FiRefreshCw size={13} /> Đặt lại
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
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                <div className="text-5xl mb-4">📦</div>
                <h5 className="font-bold text-slate-700 text-lg mb-1">Chưa có ký gửi hàng hóa</h5>
                <p className="text-slate-400 text-sm mb-5">Hãy ký gửi hàng hóa để theo dõi!</p>
                <button onClick={() => navigate('/cargo-consignment')} className="px-6 py-2.5 bg-[#0066cc] hover:bg-[#004e92] text-white font-semibold rounded-xl text-sm transition-colors">
                  Gửi hàng ngay
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ MODAL: Chi tiết vé ════════════════════════════════════════════ */}
      {showDetailModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowDetailModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-800 text-xl">Chi tiết vé &amp; Hóa đơn</h3>
                <p className="text-slate-400 text-xs mt-0.5">Mã vé: {selectedBooking.id}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"><FiX size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 flex items-center gap-4">
                <div className="flex-1 text-center">
                  <p className="text-2xl font-extrabold text-slate-800">{selectedBooking.departureTime}</p>
                  <p className="text-sm text-slate-500 font-medium">{selectedBooking.from}</p>
                </div>
                <FiMapPin size={20} className="text-[#0066cc]" />
                <div className="flex-1 text-center">
                  <p className="text-2xl font-extrabold text-slate-800">{selectedBooking.arrivalTime}</p>
                  <p className="text-sm text-slate-500 font-medium">{selectedBooking.to}</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mã QR vé di động</p>
                <QRCode value={JSON.stringify({ bookingId: selectedBooking.id, passenger: selectedBooking.passengerName, from: selectedBooking.from, to: selectedBooking.to, date: selectedBooking.date, time: selectedBooking.departureTime })} size={160} level="H" includeMargin />
                <p className="text-xs text-slate-400">Sử dụng khi lên xe hoặc nhận hàng</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Hành khách', selectedBooking.passengerName],
                  ['Email', selectedBooking.email],
                  ['Điện thoại', selectedBooking.phone],
                  ['Ngày', selectedBooking.date],
                  ['Ghế', selectedBooking.seats?.join(', ')],
                  ['Trạng thái', selectedBooking.status === 'Cho xu ly huy' ? 'Chờ xử lý hủy' : selectedBooking.status],
                ].map(([label, val]) => (
                  <div key={label} className="bg-slate-50 rounded-xl px-4 py-2.5">
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{label}</p>
                    <p className="font-bold text-slate-700 mt-0.5">{val}</p>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Chi tiết chi phí</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Giá vé ({selectedBooking.seats?.length} ghế)</span>
                    <span className="font-semibold">{fmt(selectedBooking.price)}</span>
                  </div>
                  {selectedBooking.cargoInfo?.type !== 'none' && (
                    <>
                      <div className="flex justify-between"><span className="text-slate-500">Loại hàng</span><span className="font-semibold">{selectedBooking.cargoInfo?.description}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Cước hàng hóa</span><span className="font-semibold">{fmt(selectedBooking.cargoInfo?.price)}</span></div>
                    </>
                  )}
                  <div className="flex justify-between pt-2 border-t border-slate-200 font-extrabold text-base">
                    <span>Tổng cộng</span>
                    <span className="text-[#0066cc]">{fmt(selectedBooking.price + (selectedBooking.cargoInfo?.price || 0))}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-100">
              {getTripStatus(selectedBooking) === 'completed' && (
                <button onClick={() => { setShowDetailModal(false); openRatingModal(selectedBooking) }} className="flex-1 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-600 font-semibold text-sm hover:bg-amber-100 transition-colors flex items-center justify-center gap-2">
                  <FiStar size={14} /> Đánh giá
                </button>
              )}
              {canCancelBooking(selectedBooking) && (
                <button onClick={() => { setShowDetailModal(false); handleCancelRequest(selectedBooking) }} className="flex-1 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-500 font-semibold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                  <FiX size={14} /> Yêu cầu hủy
                </button>
              )}
              <button onClick={() => setShowDetailModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm transition-colors">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: Đánh giá ══════════════════════════════════════════════ */}
      {showRatingModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowRatingModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-xl">Đánh giá chuyến xe</h3>
              <button onClick={() => setShowRatingModal(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"><FiX size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex justify-center gap-2">
                {[1,2,3,4,5].map(star => (
                  <button key={star} onClick={() => setRatingValue(star)} className={`text-3xl transition-transform hover:scale-110 ${star <= ratingValue ? 'opacity-100' : 'opacity-30'}`}>⭐</button>
                ))}
              </div>
              <textarea rows={4} value={ratingComment} onChange={e => setRatingComment(e.target.value)} placeholder="Nhận xét về chuyến xe (tùy chọn)..." className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <p className="text-right text-[10px] text-slate-400">{ratingComment.length}/500 ký tự</p>
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-100">
              <button onClick={() => setShowRatingModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm transition-colors">Hủy</button>
              <button onClick={submitRating} disabled={ratingValue === 0} className="flex-1 py-2.5 rounded-xl bg-[#0066cc] hover:bg-[#004e92] disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm transition-colors">
                Gửi đánh giá
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: Hủy vé ════════════════════════════════════════════════ */}
      {showCancelModal && cancelRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowCancelModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-xl">Xác nhận hủy vé</h3>
              <button onClick={() => setShowCancelModal(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"><FiX size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
                <p className="font-bold mb-2">Chính sách hoàn tiền</p>
                <ul className="space-y-1 text-xs text-blue-600 list-disc list-inside">
                  <li>Trước 24h: Hoàn 100%</li>
                  <li>Trước 12h: Hoàn 50%</li>
                  <li>Sau đó: Không hoàn</li>
                </ul>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 flex justify-between text-sm font-semibold">
                <span className="text-slate-500">Số tiền hoàn lại</span>
                <span className="text-emerald-600 text-lg font-extrabold">{fmt(calculateRefund(cancelRequest))}</span>
              </div>
              <textarea rows={3} value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Lý do hủy vé (tùy chọn)..." className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-100">
              <button onClick={() => setShowCancelModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm transition-colors">Quay lại</button>
              <button onClick={confirmCancel} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors">Xác nhận hủy vé</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: Chi tiết ký gửi ════════════════════════════════════════ */}
      {showConsignmentDetailModal && selectedConsignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowConsignmentDetailModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-xl">Chi tiết ký gửi hàng hóa</h3>
              <button onClick={() => setShowConsignmentDetailModal(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"><FiX size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Mã ký gửi</p>
                    <p className="font-extrabold text-slate-800 text-lg">{selectedConsignment.id}</p>
                  </div>
                  {(() => { const c = cargoStatusChip(selectedConsignment.cargoStatus); return <span className={`px-3 py-1 rounded-full text-xs font-bold ${c.bg} ${c.text}`}>{c.label}</span> })()}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Thông Tin Tuyến Đường</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3"><p className="text-xs text-slate-400 mb-1">Điểm gửi</p><p className="font-bold text-slate-800">{selectedConsignment.from}</p></div>
                  <div className="bg-slate-50 rounded-xl p-3"><p className="text-xs text-slate-400 mb-1">Điểm nhận</p><p className="font-bold text-slate-800">{selectedConsignment.to}</p></div>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Thông Tin Hàng Hóa</p>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="bg-slate-50 rounded-xl p-3"><p className="text-xs text-slate-400 mb-1">Loại hàng</p><p className="font-bold">{cargoTypeMap[selectedConsignment.type] || selectedConsignment.type}</p></div>
                  <div className="bg-slate-50 rounded-xl p-3"><p className="text-xs text-slate-400 mb-1">Trọng lượng</p><p className="font-bold">{selectedConsignment.weight} kg</p></div>
                  <div className="bg-slate-50 rounded-xl p-3"><p className="text-xs text-slate-400 mb-1">Giá trị khai</p><p className="font-bold text-[#0066cc]">{fmt(selectedConsignment.declaredValue)}</p></div>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Người Gửi &amp; Nhận</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">Người gửi</p>
                    <p className="font-bold text-slate-800">{selectedConsignment.senderName}</p>
                    <p className="text-slate-500 text-xs">{selectedConsignment.senderPhone}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">Người nhận</p>
                    <p className="font-bold text-slate-800">{selectedConsignment.receiverName}</p>
                    <p className="text-slate-500 text-xs">{selectedConsignment.receiverPhone}</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Thông Tin Thanh Toán</p>
                <div className="flex justify-between font-extrabold text-base">
                  <span>Tổng cộng</span>
                  <span className="text-[#0066cc]">{fmt(selectedConsignment.totalPrice)}</span>
                </div>
              </div>

              {/* Timeline */}
              {(() => {
                const imgs = selectedConsignment.images || []
                let customerImages = imgs, pickupImage = null, deliveryImage = null
                if (selectedConsignment.cargoStatus === 'delivered' && imgs.length >= 2) {
                  deliveryImage = imgs[imgs.length - 1]; pickupImage = imgs[imgs.length - 2]; customerImages = imgs.slice(0, imgs.length - 2)
                } else if (selectedConsignment.cargoStatus === 'delivered' && imgs.length === 1) {
                  deliveryImage = imgs[0]; customerImages = []
                } else if (selectedConsignment.cargoStatus === 'in_transit' && imgs.length >= 1) {
                  pickupImage = imgs[imgs.length - 1]; customerImages = imgs.slice(0, imgs.length - 1)
                }
                return (
                  <div>
                    {customerImages.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Hình Ảnh Lúc Gửi</p>
                        <div className="flex flex-wrap gap-2">{customerImages.map((img,i) => <img key={i} src={img} alt="" className="w-24 h-24 rounded-xl object-cover border border-slate-200" />)}</div>
                      </div>
                    )}
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Lịch Trình Vận Chuyển</p>
                    <div className="relative pl-5 border-l-2 border-slate-200 space-y-4">
                      {[
                        { icon: '⏳', label: 'Đã gửi yêu cầu', sub: 'Đang chờ tài xế duyệt', active: true, img: null },
                        { icon: '✅', label: 'Đã duyệt', sub: 'Tài xế đồng ý, đang chờ lấy hàng', active: ['confirmed','in_transit','delivered'].includes(selectedConsignment.cargoStatus), img: null },
                        { icon: '🚚', label: 'Đang vận chuyển', sub: 'Tài xế đã nhận hàng từ điểm gửi', active: ['in_transit','delivered'].includes(selectedConsignment.cargoStatus), img: pickupImage },
                        { icon: '🎉', label: 'Đã giao thành công', sub: 'Hàng đã đến tay người nhận', active: selectedConsignment.cargoStatus === 'delivered', img: deliveryImage },
                      ].map((step,i) => (
                        <div key={i} className={`flex gap-3 transition-opacity ${step.active ? 'opacity-100' : 'opacity-30'}`}>
                          <div className="absolute -left-[13px] w-6 h-6 flex items-center justify-center bg-white text-sm">{step.icon}</div>
                          <div className="ml-2">
                            <p className={`text-sm font-bold ${step.active ? 'text-slate-800' : 'text-slate-400'}`}>{step.label}</p>
                            <p className="text-xs text-slate-400">{step.sub}</p>
                            {step.img && step.active && <img src={step.img} alt="" className="mt-2 max-w-xs rounded-xl border border-slate-200 object-cover" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-100">
              {selectedConsignment.cargoStatus === 'pending' && (
                <button onClick={() => handleCancelConsignment(selectedConsignment.id)} className="flex-1 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 font-semibold text-sm transition-colors">
                  Hủy đơn hàng
                </button>
              )}
              <button onClick={() => setShowConsignmentDetailModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm transition-colors">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
