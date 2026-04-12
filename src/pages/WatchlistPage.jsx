import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiHeart, FiTrash2, FiMapPin, FiClock, FiDollarSign, FiSearch, FiBell, FiArrowRight } from 'react-icons/fi'
import BackButton from '../components/common/BackButton'
import './WatchlistPage.css'

export default function WatchlistPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('routes')
  const [favoriteRoutes, setFavoriteRoutes] = useState([
    { id: 1, from: 'Đà Nẵng', to: 'Huế', count: 5, lastUsed: '2 ngày trước', avgPrice: 120000 },
    { id: 2, from: 'Đà Nẵng', to: 'Hội An', count: 8, lastUsed: '1 tuần trước', avgPrice: 80000 },
    { id: 3, from: 'Đà Nẵng', to: 'Quảng Ngãi', count: 3, lastUsed: '2 tuần trước', avgPrice: 95000 }
  ])
  const [favoriteTrips, setFavoriteTrips] = useState([
    {
      id: 1,
      from: 'Đà Nẵng',
      to: 'Huế',
      busType: 'Toyota 16 chỗ',
      departureTime: '08:00',
      duration: '3h 30m',
      rating: 4.8,
      operator: 'BusGo Express',
      price: 120000,
      amenities: ['WiFi', 'AC', 'Phone Charger'],
      hasNotification: true,
      nextDate: '2026-04-15'
    },
    {
      id: 2,
      from: 'Đà Nẵng',
      to: 'Hội An',
      busType: 'Thaco 35 chỗ',
      departureTime: '14:30',
      duration: '50m',
      rating: 4.6,
      operator: 'Hoa Mai',
      price: 80000,
      amenities: ['AC', 'Toilet'],
      hasNotification: false,
      nextDate: '2026-04-16'
    }
  ])

  const handleQuickSearch = (from, to) => {
    navigate(`/search?from=${from}&to=${to}&category=interCity`)
  }

  const removeRoute = (id) => {
    setFavoriteRoutes(prev => prev.filter(r => r.id !== id))
  }

  const removeTrip = (id) => {
    setFavoriteTrips(prev => prev.filter(t => t.id !== id))
  }

  const toggleNotification = (id) => {
    setFavoriteTrips(prev =>
      prev.map(trip =>
        trip.id === id ? { ...trip, hasNotification: !trip.hasNotification } : trip
      )
    )
  }

  return (
    <div className="watchlist-page">
      <div className="watchlist-header">
        <BackButton />
        <h1>Danh sách yêu thích</h1>
        <p>Lưu các tuyến đường và chuyến xe của bạn để tìm kiếm và đặt vé nhanh hơn</p>
      </div>

      {/* Tab Navigation */}
      <div className="watchlist-tabs">
        <button
          className={`tab-btn ${activeTab === 'routes' ? 'active' : ''}`}
          onClick={() => setActiveTab('routes')}
        >
          <FiMapPin size={20} />
          <span>Tuyến đường yêu thích ({favoriteRoutes.length})</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'trips' ? 'active' : ''}`}
          onClick={() => setActiveTab('trips')}
        >
          <FiClock size={20} />
          <span>Chuyến xe yêu thích ({favoriteTrips.length})</span>
        </button>
      </div>

      {/* Routes Tab */}
      {activeTab === 'routes' && (
        <div className="watchlist-content">
          {favoriteRoutes.length === 0 ? (
            <div className="empty-state">
              <FiMapPin size={48} />
              <h3>Chưa có tuyến đường yêu thích</h3>
              <p>Hãy lưu những tuyến đường bạn thường xuyên sử dụng</p>
            </div>
          ) : (
            <div className="routes-container">
              {favoriteRoutes.map(route => (
                <div key={route.id} className="route-card">
                  <div className="route-info">
                    <div className="route-path">
                      <span className="city">{route.from}</span>
                      <FiArrowRight size={20} />
                      <span className="city">{route.to}</span>
                    </div>
                    <div className="route-meta">
                      <span className="meta-item">Sử dụng {route.count} lần</span>
                      <span className="meta-item">•</span>
                      <span className="meta-item">Lần cuối: {route.lastUsed}</span>
                      <span className="meta-item">•</span>
                      <span className="meta-item">Giá TB: {route.avgPrice.toLocaleString()}đ</span>
                    </div>
                  </div>
                  <div className="route-actions">
                    <button
                      className="btn-quick-search"
                      onClick={() => handleQuickSearch(route.from, route.to)}
                    >
                      <FiSearch size={18} />
                      Tìm nhanh
                    </button>
                    <button
                      className="btn-remove"
                      onClick={() => removeRoute(route.id)}
                      title="Xóa khỏi yêu thích"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Trips Tab */}
      {activeTab === 'trips' && (
        <div className="watchlist-content">
          {favoriteTrips.length === 0 ? (
            <div className="empty-state">
              <FiClock size={48} />
              <h3>Chưa có chuyến xe yêu thích</h3>
              <p>Lưu các chuyến xe cố định để nhận thông báo khi có lịch mới</p>
            </div>
          ) : (
            <div className="trips-container">
              {favoriteTrips.map(trip => (
                <div key={trip.id} className="trip-card">
                  <div className="trip-header">
                    <div className="trip-route">
                      <h3>{trip.from} <FiArrowRight /> {trip.to}</h3>
                      <p className="trip-operator">{trip.operator}</p>
                    </div>
                    <div className="trip-rating">
                      <span className="stars">⭐ {trip.rating}</span>
                    </div>
                  </div>

                  <div className="trip-details">
                    <div className="detail-item">
                      <FiClock size={16} />
                      <span>{trip.departureTime} • {trip.duration}</span>
                    </div>
                    <div className="detail-item">
                      <span className="bus-type">{trip.busType}</span>
                    </div>
                    <div className="detail-item amenities">
                      {trip.amenities.map((amenity, idx) => (
                        <span key={idx} className="amenity-tag">{amenity}</span>
                      ))}
                    </div>
                  </div>

                  <div className="trip-footer">
                    <div className="trip-price">
                      <FiDollarSign size={16} />
                      <span>{trip.price.toLocaleString()}đ</span>
                    </div>
                    <div className="trip-actions">
                      <button
                        className={`btn-notification ${trip.hasNotification ? 'active' : ''}`}
                        onClick={() => toggleNotification(trip.id)}
                        title={trip.hasNotification ? 'Tắt thông báo' : 'Bật thông báo'}
                      >
                        <FiBell size={18} />
                      </button>
                      <button
                        className="btn-remove"
                        onClick={() => removeTrip(trip.id)}
                        title="Xóa khỏi yêu thích"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {trip.hasNotification && (
                    <div className="notification-info">
                      <FiBell size={14} />
                      <span>Bạn sẽ nhận thông báo khi chuyến xe này có lịch mới</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
