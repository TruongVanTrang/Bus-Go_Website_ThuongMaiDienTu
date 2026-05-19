import { useState, useEffect } from 'react'
import { FiAlertCircle, FiCheckCircle, FiClock, FiTrendingUp, FiChevronRight } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import './HomeSuggestions.css'

export default function HomeSuggestions() {
  const [recentActivity, setRecentActivity] = useState([])
  const [userInfo, setUserInfo] = useState({
    emailVerified: false,
    phoneVerified: false,
    hasName: true
  })
  const [mostBookedRoutes, setMostBookedRoutes] = useState([])
  const [popularTrips, setPopularTrips] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    // Load user data from localStorage (mock)
    const savedUserInfo = localStorage.getItem('userInfo')
    if (savedUserInfo) {
      setUserInfo(JSON.parse(savedUserInfo))
    }

    // Load recent activity from localStorage
    const savedActivity = localStorage.getItem('recentSearches')
    if (savedActivity) {
      try {
        setRecentActivity(JSON.parse(savedActivity).slice(0, 3))
      } catch (e) {
        console.error('Error loading recent search:', e)
      }
    }

    // Mock data for most booked routes (in real app, fetch from API)
    setMostBookedRoutes([
      {
        id: 1,
        from: 'TP. Hồ Chí Minh',
        to: 'Cần Thơ',
        bookings: 2150,
        avgPrice: 95000,
        operators: 8
      },
      {
        id: 2,
        from: 'TP. Hồ Chí Minh',
        to: 'Quảng Ninh',
        bookings: 1890,
        avgPrice: 520000,
        operators: 5
      },
      {
        id: 3,
        from: 'TP. Hồ Chí Minh',
        to: 'Phú Quốc',
        bookings: 1765,
        avgPrice: 420000,
        operators: 6
      }
    ])

    // Mock data for popular trips (high ratings)
    setPopularTrips([
      {
        id: 1,
        from: 'Đà Nẵng',
        to: 'Huế',
        operator: 'Hoàng Long',
        rating: 4.9,
        reviews: 324,
        amenities: ['WiFi', 'Reclining Seats'],
        price: 120000,
        originalPrice: 150000,
        discount: 20,
        busType: 'Toyota 16 chỗ Premium',
        tag: 'BEST RATED',
        popularity: 95,
        departure: '14:00'
      },
      {
        id: 2,
        from: 'Đà Nẵng',
        to: 'Hội An',
        operator: 'Thaco Tours',
        rating: 4.7,
        reviews: 287,
        amenities: ['AC', 'WiFi'],
        price: 80000,
        originalPrice: 100000,
        discount: 20,
        busType: 'Thaco 35 chỗ',
        tag: 'POPULAR ROUTE',
        popularity: 88,
        departure: '07:00'
      },
      {
        id: 3,
        from: 'Đà Nẵng',
        to: 'Nha Trang',
        operator: 'Thành Bưởi',
        rating: 4.8,
        reviews: 156,
        amenities: ['Hot Water', 'Blanket'],
        price: 250000,
        originalPrice: 300000,
        discount: 17,
        busType: 'Toyota Limousine',
        tag: 'PREMIUM CHOICE',
        popularity: 92,
        departure: '20:00'
      }
    ])
  }, [])

  const handleRecentActivityClick = (route) => {
    navigate(`/search?from=${encodeURIComponent(route.from)}&to=${encodeURIComponent(route.to)}`)
  }

  const handleBookNow = (trip) => {
    navigate(`/booking/${trip.id}`)
  }

  return (
    <div className="home-suggestions">
      {/* Information Alerts */}
      {(!userInfo.emailVerified || !userInfo.phoneVerified) && (
        <div className="suggestions-alerts">
          {!userInfo.emailVerified && (
            <div className="alert-card alert-warning">
              <div className="alert-icon">
                <FiAlertCircle size={20} />
              </div>
              <div className="alert-content">
                <p className="alert-title">⚠️ Email chưa được xác minh</p>
                <p className="alert-desc">Xác minh email để bảo mật tài khoản và nhận thông báo đặt vé</p>
              </div>
              <button className="btn-verify">Xác minh</button>
            </div>
          )}
          {!userInfo.phoneVerified && (
            <div className="alert-card alert-danger">
              <div className="alert-icon">
                <FiAlertCircle size={20} />
              </div>
              <div className="alert-content">
                <p className="alert-title">⚠️ Số điện thoại chưa xác minh</p>
                <p className="alert-desc">Cần xác minh SĐT để tài xế có thể liên lạc với bạn</p>
              </div>
              <button className="btn-verify">Xác minh ngay</button>
            </div>
          )}
        </div>
      )}

      {/* Recent Activity Section */}
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
              <div
                key={idx}
                className="activity-card"
                onClick={() => handleRecentActivityClick(activity)}
              >
                <div className="activity-route">
                  <span className="route-city">{activity.from}</span>
                  <span className="route-arrow">↔️</span>
                  <span className="route-city">{activity.to}</span>
                </div>
                <div className="activity-meta">
                  <span className="activity-date">
                    {new Date(activity.timestamp).toLocaleDateString('vi-VN')}
                  </span>
                  <span className="activity-action">
                    Xem lại <FiChevronRight size={16} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Most Booked Routes Section */}
      <div className="suggestions-section">
        <div className="section-header">
          <div className="section-title-group">
            <span className="title-emoji">🔥</span>
            <h3>Tuyến đường được đặt nhiều nhất</h3>
          </div>
          <p className="section-subtitle">Những chuyến được yêu thích nhất hiện nay</p>
        </div>

        <div className="routes-grid">
          {mostBookedRoutes.map((route) => (
            <div key={route.id} className="route-card popular">
              <div className="route-header">
                <div className="route-info">
                  <h4>{route.from}</h4>
                  <span className="route-arrow">→</span>
                  <h4>{route.to}</h4>
                </div>
                <div className="route-badge">
                  <span className="badge-fire">🔥</span>
                  <span className="badge-text">{route.bookings} lượt</span>
                </div>
              </div>

              <div className="route-details">
                <div className="detail-item">
                  <span className="detail-label">Giá từ</span>
                  <span className="detail-value">{route.avgPrice.toLocaleString()}đ</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Nhà xe</span>
                  <span className="detail-value">{route.operators} công ty</span>
                </div>
              </div>

              <button
                className="btn-search"
                onClick={() =>
                  navigate(
                    `/search?from=${encodeURIComponent(route.from)}&to=${encodeURIComponent(route.to)}`
                  )
                }
              >
                Tìm kiếm ngay
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Trips Section */}
      <div className="suggestions-section popular-trips-featured">
        <div className="section-header featured-style">
          <div className="section-title-group">
            <span className="title-emoji">⭐</span>
            <h3>Chuyến xe chất lượng dịch vụ cao!</h3>
          </div>
          <p className="section-subtitle">Những chuyến được đánh giá cao nhất</p>
        </div>

        <div className="featured-trips-grid">
          {popularTrips.map((trip) => (
            <div key={trip.id} className="featured-trip-card">
              {/* Discount Badge */}
              {trip.discount > 0 && (
                <div className="discount-badge">
                  -<span>{trip.discount}%</span>
                </div>
              )}

              {/* Featured Badge */}
              <div className="featured-badge-tag">{trip.tag}</div>

              {/* Card Header with Rating */}
              <div className="card-header">
                <div className="route-display">
                  <span className="city-from">{trip.from}</span>
                  <span className="separator">→</span>
                  <span className="city-to">{trip.to}</span>
                </div>
              </div>

              {/* Rating Box */}
              <div className="rating-section">
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < Math.floor(trip.rating) ? 'star-filled' : 'star-empty'}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="rating-value">{trip.rating}</span>
                <span className="review-count">({trip.reviews})</span>
              </div>

              {/* Bus Type */}
              <div className="bus-badge">{trip.busType}</div>

              {/* Amenities */}
              <div className="amenities-row">
                {trip.amenities.map((amenity, idx) => (
                  <span key={idx} className="amenity-chip">
                    {amenity === 'WiFi' && '📡 '}
                    {amenity === 'Reclining Seats' && '🛏️ '}
                    {amenity === 'AC' && '❄️ '}
                    {amenity === 'Hot Water' && '☕ '}
                    {amenity === 'Blanket' && '🧣 '}
                    {amenity}
                  </span>
                ))}
              </div>

              {/* Pricing Section */}
              <div className="pricing-footer">
                <div className="price-info">
                  {trip.originalPrice !== trip.price && (
                    <span className="original-price">
                      {trip.originalPrice.toLocaleString()}đ
                    </span>
                  )}
                  <span className="current-price">
                    {trip.price.toLocaleString()}đ
                  </span>
                </div>
                <button
                  className="btn-book-featured"
                  onClick={() => handleBookNow(trip)}
                >
                  Đặt ngay
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
