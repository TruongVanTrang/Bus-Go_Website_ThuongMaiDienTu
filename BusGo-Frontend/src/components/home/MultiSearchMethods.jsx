import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiMapPin, FiTruck, FiClock, FiArrowRight } from 'react-icons/fi'
import './MultiSearchMethods.css'

export default function MultiSearchMethods() {
  const navigate = useNavigate()
  const [activeMethod, setActiveMethod] = useState('routes')

  // Popular Routes Data
  const popularRoutes = [
    { from: 'Đà Nẵng', to: 'Huế', popularity: 95, trips: 12 },
    { from: 'Đà Nẵng', to: 'Hội An', popularity: 88, trips: 18 },
    { from: 'Đà Nẵng', to: 'Quảng Ngãi', popularity: 72, trips: 8 },
    { from: 'Đà Nẵng', to: 'Nha Trang', popularity: 85, trips: 6 }
  ]

  // Vehicle Types Data
  const vehicleTypes = [
    { type: '16 chỗ', name: 'Toyota', icon: '🚐', price: 'từ 100k', trips: 24 },
    { type: '35 chỗ', name: 'Thaco', icon: '🚌', price: 'từ 80k', trips: 18 },
    { type: '24 chỗ', name: 'Hyundai', icon: '🚍', price: 'từ 90k', trips: 15 },
    { type: 'Limousine', name: 'Toyota', icon: '✨', price: 'từ 200k', trips: 8 }
  ]

  // Time Period Data
  const timePeriods = [
    { id: 'morning', label: 'Sáng', time: '05:00 - 12:00', icon: '🌅', trips: 45 },
    { id: 'afternoon', label: 'Chiều', time: '12:00 - 17:00', icon: '☀️', trips: 38 },
    { id: 'night', label: 'Tối', time: '17:00 - 23:59', icon: '🌙', trips: 22 }
  ]

  const handleRouteSearch = (from, to) => {
    navigate(`/search?from=${from}&to=${to}&category=interCity`)
  }

  const handleVehicleSearch = (vehicleType) => {
    navigate(`/search?busType=${vehicleType}&category=interCity`)
  }

  const handleTimeSearch = (timeId) => {
    navigate(`/search?departureTime=${timeId}&category=interCity`)
  }

  return (
    <div className="multi-search-section">
      <div className="section-header">
        <h2>Tìm kiếm theo cách bạn muốn</h2>
        <p>Khám phá các tuyến đường và phương tiện theo nhu cầu của bạn</p>
      </div>

      {/* Method Tabs */}
      <div className="search-methods-tabs">
        <button
          className={`method-tab ${activeMethod === 'routes' ? 'active' : ''}`}
          onClick={() => setActiveMethod('routes')}
        >
          <FiMapPin size={20} />
          <span>Theo Tuyến Đường</span>
        </button>
        <button
          className={`method-tab ${activeMethod === 'vehicles' ? 'active' : ''}`}
          onClick={() => setActiveMethod('vehicles')}
        >
          <FiTruck size={20} />
          <span>Theo Phương Tiện</span>
        </button>
        <button
          className={`method-tab ${activeMethod === 'time' ? 'active' : ''}`}
          onClick={() => setActiveMethod('time')}
        >
          <FiClock size={20} />
          <span>Theo Thời Gian</span>
        </button>
      </div>

      {/* Routes Tab */}
      {activeMethod === 'routes' && (
        <div className="search-method-content animate-in">
          <div className="content-grid">
            <div className="content-description">
              <h3>Chọn tuyến đường phổ biến</h3>
              <p>Các tuyến đường được yêu thích nhất bởi khách hàng BusGo. Đặt vé thường xuyên trên những tuyến này sẽ giúp bạn nhận được ưu đãi đặc biệt.</p>
              <ul className="features-list">
                <li>✓ Tuyến nào phổ biến nhất</li>
                <li>✓ Số chuyến xe mỗi ngày</li>
                <li>✓ Giá vé cạnh tranh</li>
              </ul>
            </div>

            <div className="routes-grid">
              {popularRoutes.map((route, idx) => (
                <div
                  key={idx}
                  className="route-method-card"
                  onClick={() => handleRouteSearch(route.from, route.to)}
                >
                  <div className="route-header">
                    <span className="route-from">{route.from}</span>
                    <FiArrowRight size={20} />
                    <span className="route-to">{route.to}</span>
                  </div>

                  <div className="route-stats">
                    <div className="stat-item">
                      <span className="stat-label">Popularity</span>
                      <div className="popularity-bar">
                        <div className="popularity-fill" style={{ width: `${route.popularity}%` }} />
                      </div>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">{route.trips} chuyến/ngày</span>
                    </div>
                  </div>

                  <button className="method-action-btn">Tìm vé →</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vehicles Tab */}
      {activeMethod === 'vehicles' && (
        <div className="search-method-content animate-in">
          <div className="content-grid">
            <div className="vehicles-grid">
              {vehicleTypes.map((vehicle, idx) => (
                <div
                  key={idx}
                  className="vehicle-method-card"
                  onClick={() => handleVehicleSearch(vehicle.type)}
                >
                  <div className="vehicle-icon">{vehicle.icon}</div>
                  <h4 className="vehicle-type">{vehicle.type}</h4>
                  <p className="vehicle-name">{vehicle.name}</p>

                  <div className="vehicle-info">
                    <span className="vehicle-price">{vehicle.price}</span>
                    <span className="vehicle-trips">{vehicle.trips}+ chuyến</span>
                  </div>

                  <button className="method-action-btn">Xem xe →</button>
                </div>
              ))}
            </div>

            <div className="content-description">
              <h3>Lựa chọn theo phương tiện</h3>
              <p>Xem trước ảnh và thông tin chi tiết về các loại xe, sau đó chọn lịch trình phù hợp với bạn.</p>
              <ul className="features-list">
                <li>✓ Hình ảnh và video xe</li>
                <li>✓ Tiện nghi & dịch vụ</li>
                <li>✓ Đánh giá từ khách hàng</li>
                <li>✓ Những chuyến sắp tới</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Time Tab */}
      {activeMethod === 'time' && (
        <div className="search-method-content animate-in">
          <div className="content-grid">
            <div className="content-description">
              <h3>Tìm theo khung giờ</h3>
              <p>Chọn thời gian mà bạn muốn khởi hành, từ sáng sớm đến tối muộn. Hệ thống sẽ hiển thị tất cả các chuyến xe phù hợp.</p>
              <ul className="features-list">
                <li>✓ Sáng: 05:00 - 12:00</li>
                <li>✓ Chiều: 12:00 - 17:00</li>
                <li>✓ Tối: 17:00 - 23:59</li>
              </ul>
            </div>

            <div className="time-grid">
              {timePeriods.map(period => (
                <div
                  key={period.id}
                  className="time-method-card"
                  onClick={() => handleTimeSearch(period.id)}
                >
                  <div className="time-icon">{period.icon}</div>
                  <h4 className="time-label">{period.label}</h4>
                  <p className="time-range">{period.time}</p>

                  <div className="time-trips">
                    <span className="trips-count">{period.trips}+ chuyến</span>
                  </div>

                  <button className="method-action-btn">Tìm vé →</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
