import { useState, useEffect } from 'react'
import { FiAlertCircle, FiClock, FiTrendingUp, FiChevronRight, FiStar, FiZap } from 'react-icons/fi'
import { MdDirectionsBus, MdSearch } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import { StorageUtil } from '../../utils/helpers'
import './HomeSuggestions.css'

// Tuyến được đặt nhiều nhất (nội thành + ngoại thành thực tế từ DB)
const MOST_BOOKED_ROUTES = [
  { id: 1, from: 'Cầu Rồng', to: 'Phố cổ Hội An', bookings: 1240, avgPrice: 60000, category: 'city', label: 'Nội thành' },
  { id: 2, from: 'Đà Nẵng', to: 'Huế', bookings: 980, avgPrice: 120000, category: 'interCity', label: 'Ngoại thành' },
  { id: 3, from: 'Đà Nẵng', to: 'Quảng Nam', bookings: 756, avgPrice: 80000, category: 'interCity', label: 'Ngoại thành' },
]

// Chuyến xe chất lượng cao (đánh giá cao nhất, tuyến thực tế)
const HIGH_QUALITY_TRIPS = [
  {
    id: 'hq-1',
    from: 'Đà Nẵng', to: 'Huế',
    rating: 4.9, reviews: 324,
    amenities: ['AC', 'Wifi', 'Phone Charger'],
    price: 120000, originalPrice: 150000, discount: 20,
    busType: 'Xe 35 chỗ', tag: 'BEST RATED',
    departure: '06:00', category: 'interCity'
  },
  {
    id: 'hq-2',
    from: 'Cầu Rồng', to: 'Phố cổ Hội An',
    rating: 4.7, reviews: 287,
    amenities: ['AC', 'Wifi'],
    price: 60000, originalPrice: 60000, discount: 0,
    busType: 'Xe 16 chỗ', tag: 'POPULAR',
    departure: '08:00', category: 'city'
  },
  {
    id: 'hq-3',
    from: 'Đà Nẵng', to: 'Quảng Ngãi',
    rating: 4.8, reviews: 156,
    amenities: ['AC', 'Wifi', 'Pillow & Blanket'],
    price: 150000, originalPrice: 180000, discount: 17,
    busType: 'Xe 35 chỗ', tag: 'PREMIUM',
    departure: '07:30', category: 'interCity'
  }
]

// Gợi ý "Tìm kiếm theo cách bạn muốn"
const SEARCH_SHORTCUTS = [
  { id: 'sc-1', label: 'Nội thành Đà Nẵng', icon: '🏙️', query: { category: 'city' }, desc: 'Di chuyển nội thành' },
  { id: 'sc-2', label: 'Đến Huế hôm nay', icon: '🏯', query: { from: 'Đà Nẵng', to: 'Huế', category: 'interCity' }, desc: 'Ngày hôm nay' },
  { id: 'sc-3', label: 'Đến Quảng Nam', icon: '🌿', query: { from: 'Đà Nẵng', to: 'Quảng Nam', category: 'interCity' }, desc: 'Tuyến ngắn phổ biến' },
  { id: 'sc-4', label: 'Giá rẻ nhất', icon: '💰', query: { category: 'city', sort: 'price_asc' }, desc: 'Vé dưới 60.000đ' },
]

export default function HomeSuggestions() {
  const [recentActivity, setRecentActivity] = useState([])
  const [userInfo, setUserInfo] = useState({ emailVerified: true, phoneVerified: true, hasName: true })
  const [upcomingTrips, setUpcomingTrips] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    // Load user info
    const savedUser = StorageUtil.getUser()
    if (savedUser) {
      const savedUserInfo = localStorage.getItem('userInfo')
      if (savedUserInfo) {
        setUserInfo(JSON.parse(savedUserInfo))
      } else {
        setUserInfo({ emailVerified: true, phoneVerified: true, hasName: !!savedUser.name })
      }
    } else {
      setUserInfo({ emailVerified: true, phoneVerified: true, hasName: false })
    }

    // Tải lịch sử tìm kiếm gần đây
    const savedActivity = localStorage.getItem('recentSearches')
    if (savedActivity) {
      try {
        setRecentActivity(JSON.parse(savedActivity).slice(0, 3))
      } catch (e) {
        console.error('Error loading recent search:', e)
      }
    }

    // "Khởi hành trong 24h tới" — tính ngày hôm nay và ngày mai
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    setUpcomingTrips([
      {
        id: 'up-1', from: 'Đà Nẵng', to: 'Huế',
        date: todayStr, displayDate: 'Hôm nay',
        departure: '14:00', category: 'interCity',
        price: 120000, seatsLeft: 8
      },
      {
        id: 'up-2', from: 'Cầu Rồng', to: 'Phố cổ Hội An',
        date: todayStr, displayDate: 'Hôm nay',
        departure: '15:30', category: 'city',
        price: 60000, seatsLeft: 12
      },
      {
        id: 'up-3', from: 'Đà Nẵng', to: 'Quảng Nam',
        date: tomorrowStr, displayDate: 'Ngày mai',
        departure: '06:00', category: 'interCity',
        price: 80000, seatsLeft: 5
      },
    ])
  }, [])

  // Điều hướng đến trang tìm kiếm với params
  const goSearch = (params = {}) => {
    const today = new Date().toISOString().split('T')[0]
    const urlParams = new URLSearchParams()
    if (params.from) urlParams.set('from', params.from)
    if (params.to) urlParams.set('to', params.to)
    if (params.date) urlParams.set('date', params.date)
    else if (params.needDate !== false) urlParams.set('date', today)
    if (params.category) urlParams.set('category', params.category)
    navigate(`/search?${urlParams.toString()}`)
  }

  const handleRecentActivityClick = (route) => {
    goSearch({ from: route.from, to: route.to, needDate: false })
  }

  return (
    <div className="home-suggestions">
      {/* Information Alerts */}
      {!userInfo.emailVerified && (
        <div className="suggestions-alerts">
          <div className="alert-card alert-warning">
            <div className="alert-icon"><FiAlertCircle size={20} /></div>
            <div className="alert-content">
              <p className="alert-title">⚠️ Email chưa được xác minh</p>
              <p className="alert-desc">Xác minh email để bảo mật tài khoản và nhận thông báo đặt vé</p>
            </div>
            <button className="btn-verify">Xác minh</button>
          </div>
        </div>
      )}

      {/* Lịch sử tìm kiếm gần đây */}
      {recentActivity.length > 0 && (
        <div className="suggestions-section">
          <div className="section-header">
            <div className="section-title-group">
              <FiClock size={22} className="title-icon" />
              <h3>Hoạt động gần đây</h3>
            </div>
            <p className="section-subtitle">Những tuyến bạn vừa tìm kiếm</p>
          </div>
          <div className="activity-grid">
            {recentActivity.map((activity, idx) => (
              <div key={idx} className="activity-card" onClick={() => handleRecentActivityClick(activity)}>
                <div className="activity-route">
                  <span className="route-city">{activity.from}</span>
                  <span className="route-arrow">↔️</span>
                  <span className="route-city">{activity.to}</span>
                </div>
                <div className="activity-meta">
                  <span className="activity-date">
                    {new Date(activity.timestamp).toLocaleDateString('vi-VN')}
                  </span>
                  <span className="activity-action">Xem lại <FiChevronRight size={16} /></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🔥 Tuyến đường được đặt nhiều nhất */}
      <div className="suggestions-section">
        <div className="section-header">
          <div className="section-title-group">
            <span className="title-emoji">🔥</span>
            <h3>Tuyến đường được đặt nhiều nhất</h3>
          </div>
          <p className="section-subtitle">Những chuyến được yêu thích nhất hiện nay</p>
        </div>
        <div className="routes-grid">
          {MOST_BOOKED_ROUTES.map((route) => (
            <div key={route.id} className="route-card popular">
              <div className="route-header">
                <div className="route-info">
                  <h4>{route.from}</h4>
                  <span className="route-arrow">→</span>
                  <h4>{route.to}</h4>
                </div>
                <div className="route-badge">
                  <span className="badge-fire">🔥</span>
                  <span className="badge-text">{route.bookings.toLocaleString()} lượt</span>
                </div>
              </div>
              <div className="route-details">
                <div className="detail-item">
                  <span className="detail-label">Giá từ</span>
                  <span className="detail-value">{route.avgPrice.toLocaleString()}đ</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Loại</span>
                  <span className="detail-value">{route.label}</span>
                </div>
              </div>
              <button
                className="btn-search"
                onClick={() => goSearch({ from: route.from, to: route.to, category: route.category })}
              >
                Tìm kiếm ngay
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ⭐ Chuyến xe chất lượng dịch vụ cao */}
      <div className="suggestions-section popular-trips-featured">
        <div className="section-header featured-style">
          <div className="section-title-group">
            <span className="title-emoji">⭐</span>
            <h3>Chuyến xe chất lượng dịch vụ cao!</h3>
          </div>
          <p className="section-subtitle">Những chuyến được đánh giá cao nhất</p>
        </div>
        <div className="featured-trips-grid">
          {HIGH_QUALITY_TRIPS.map((trip) => (
            <div key={trip.id} className="featured-trip-card">
              {trip.discount > 0 && (
                <div className="discount-badge">-<span>{trip.discount}%</span></div>
              )}
              <div className="featured-badge-tag">{trip.tag}</div>
              <div className="card-header">
                <div className="route-display">
                  <span className="city-from">{trip.from}</span>
                  <span className="separator">→</span>
                  <span className="city-to">{trip.to}</span>
                </div>
              </div>
              <div className="rating-section">
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < Math.floor(trip.rating) ? 'star-filled' : 'star-empty'}>★</span>
                  ))}
                </div>
                <span className="rating-value">{trip.rating}</span>
                <span className="review-count">({trip.reviews})</span>
              </div>
              <div className="bus-badge">{trip.busType}</div>
              <div className="amenities-row">
                {trip.amenities.map((amenity, idx) => (
                  <span key={idx} className="amenity-chip">
                    {amenity === 'Wifi' && '📡 '}
                    {amenity === 'AC' && '❄️ '}
                    {amenity === 'Phone Charger' && '🔌 '}
                    {amenity === 'Pillow & Blanket' && '🛏️ '}
                    {amenity}
                  </span>
                ))}
              </div>
              <div className="pricing-footer">
                <div className="price-info">
                  {trip.discount > 0 && (
                    <span className="original-price">{trip.originalPrice.toLocaleString()}đ</span>
                  )}
                  <span className="current-price">{trip.price.toLocaleString()}đ</span>
                </div>
                {/* Tìm chuyến thực tế trên trang search thay vì booking trực tiếp */}
                <button
                  className="btn-book-featured"
                  onClick={() => goSearch({ from: trip.from, to: trip.to, category: trip.category })}
                >
                  Tìm chuyến này
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ⚡ Khởi hành trong 24h tới */}
      <div className="suggestions-section">
        <div className="section-header">
          <div className="section-title-group">
            <span className="title-emoji">⚡</span>
            <h3>Khởi hành trong 24h tới</h3>
          </div>
          <p className="section-subtitle">Đặt nhanh trước khi hết chỗ!</p>
        </div>
        <div className="upcoming-grid">
          {upcomingTrips.map((trip) => (
            <div key={trip.id} className="upcoming-card">
              <div className="upcoming-header">
                <span className="upcoming-date-badge">{trip.displayDate}</span>
                <span className="upcoming-seats">
                  {trip.seatsLeft <= 5
                    ? <span style={{ color: '#ef4444' }}>⚠️ Còn {trip.seatsLeft} chỗ</span>
                    : <span style={{ color: '#22c55e' }}>✓ Còn {trip.seatsLeft} chỗ</span>}
                </span>
              </div>
              <div className="upcoming-route">
                <span className="upcoming-city">{trip.from}</span>
                <span className="upcoming-arrow">→</span>
                <span className="upcoming-city">{trip.to}</span>
              </div>
              <div className="upcoming-meta">
                <span>🕐 {trip.departure}</span>
                <span className="upcoming-price">{trip.price.toLocaleString()}đ</span>
              </div>
              <button
                className="btn-search upcoming-btn"
                onClick={() => goSearch({ from: trip.from, to: trip.to, date: trip.date, category: trip.category })}
              >
                Đặt vé ngay
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 🔍 Tìm kiếm theo cách bạn muốn */}
      <div className="suggestions-section">
        <div className="section-header">
          <div className="section-title-group">
            <MdSearch size={24} className="title-icon" />
            <h3>Tìm kiếm theo cách bạn muốn</h3>
          </div>
          <p className="section-subtitle">Chọn nhanh theo nhu cầu của bạn</p>
        </div>
        <div className="shortcuts-grid">
          {SEARCH_SHORTCUTS.map((sc) => (
            <div
              key={sc.id}
              className="shortcut-card"
              onClick={() => goSearch(sc.query)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && goSearch(sc.query)}
            >
              <span className="shortcut-icon">{sc.icon}</span>
              <div className="shortcut-content">
                <span className="shortcut-label">{sc.label}</span>
                <span className="shortcut-desc">{sc.desc}</span>
              </div>
              <FiChevronRight size={18} className="shortcut-arrow" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
