import { useNavigate } from 'react-router-dom'
import { FiClock, FiMapPin, FiArrowRight, FiStar } from 'react-icons/fi'
import './UpcomingTrips.css'

export default function UpcomingTrips() {
  const navigate = useNavigate()

  const upcomingTrips = [
    {
      id: 1,
      from: 'Đà Nẵng',
      to: 'Huế',
      departureTime: '06:00',
      arrivalTime: '09:30',
      date: '2026-04-13',
      price: 120000,
      busType: 'Toyota 16 chỗ',
      rating: 4.8,
      amenities: ['WiFi', 'AC', 'Phone Charger'],
      occupancy: 0.85
    },
    {
      id: 2,
      from: 'Đà Nẵng',
      to: 'Hội An',
      departureTime: '07:00',
      arrivalTime: '07:50',
      date: '2026-04-13',
      price: 80000,
      busType: 'Thaco 35 chỗ',
      rating: 4.6,
      amenities: ['AC', 'Toilet'],
      occupancy: 0.65
    },
    {
      id: 3,
      from: 'Đà Nẵng',
      to: 'Quảng Ngãi',
      departureTime: '08:30',
      arrivalTime: '10:15',
      date: '2026-04-13',
      price: 95000,
      busType: 'Hyundai 24 chỗ',
      rating: 4.7,
      amenities: ['WiFi', 'AC', 'Blanket'],
      occupancy: 0.45
    },
    {
      id: 4,
      from: 'Đà Nẵng',
      to: 'Nha Trang',
      departureTime: '22:00',
      arrivalTime: '06:30',
      date: '2026-04-13',
      price: 250000,
      busType: 'Toyota 16 chỗ Limousine',
      rating: 4.9,
      amenities: ['WiFi', 'Reclining Seats', 'Hot Water'],
      occupancy: 0.70
    }
  ]

  const handleBooking = (trip) => {
    navigate(`/booking/${trip.id}`, { state: { trip } })
  }

  return (
    <div className="upcoming-trips-section">
      <div className="section-header">
        <h2>Khởi hành trong 24h tới</h2>
        <p>Những chuyến xe sắp khởi hành - Đặt vé ngay để không mất chỗ</p>
      </div>

      <div className="trips-grid">
        {upcomingTrips.map(trip => (
          <div key={trip.id} className="trip-card" onClick={() => handleBooking(trip)}>
            {/* Early Departure Badge */}
            {trip.departureTime <= '08:00' && (
              <div className="trip-badge early">Sớm hôm nay</div>
            )}

            {/* Trip Header */}
            <div className="trip-header">
              <div className="route-info">
                <div className="city from">{trip.from}</div>
                <div className="arrow-container">
                  <FiArrowRight size={20} />
                  <span className="duration">{trip.departureTime}</span>
                </div>
                <div className="city to">{trip.to}</div>
              </div>

              <div className="trip-rating">
                <FiStar size={16} className="star" />
                <span>{trip.rating}</span>
              </div>
            </div>

            {/* Bus Type */}
            <div className="bus-type">
              <span>{trip.busType}</span>
            </div>

            {/* Amenities */}
            <div className="amenities">
              {trip.amenities.slice(0, 2).map((amenity, idx) => (
                <span key={idx} className="amenity">{amenity}</span>
              ))}
              {trip.amenities.length > 2 && (
                <span className="amenity">+{trip.amenities.length - 2}</span>
              )}
            </div>

            {/* Occupancy Bar */}
            <div className="occupancy-container">
              <div className="occupancy-bar">
                <div
                  className="occupancy-fill"
                  style={{ width: `${trip.occupancy * 100}%` }}
                />
              </div>
              <span className="occupancy-text">
                {Math.round(trip.occupancy * 100)}% full
              </span>
            </div>

            {/* Footer */}
            <div className="trip-footer">
              <div className="price">
                <span className="amount">{trip.price.toLocaleString()}đ</span>
              </div>
              <button className="btn-book">Đặt vé</button>
            </div>
          </div>
        ))}
      </div>

      <div className="view-more">
        <button className="btn-view-all" onClick={() => navigate('/search')}>
          Xem tất cả chuyến xe →
        </button>
      </div>
    </div>
  )
}
