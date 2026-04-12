import { useNavigate } from 'react-router-dom'
import { FiStar, FiMapPin, FiArrowRight, FiTrendingUp } from 'react-icons/fi'
import './FeaturedTrips.css'

export default function FeaturedTrips() {
  const navigate = useNavigate()

  const featuredTrips = [
    {
      id: 1,
      from: 'Đà Nẵng',
      to: 'Huế',
      rating: 4.9,
      reviewCount: 324,
      price: 120000,
      originalPrice: 150000,
      discount: 20,
      busType: 'Toyota 16 chỗ Premium',
      image: '🎖️',
      tag: 'Best Rated',
      amenities: ['WiFi', 'Reclining Seats'],
      popularity: 95
    },
    {
      id: 2,
      from: 'Đà Nẵng',
      to: 'Hội An',
      rating: 4.7,
      reviewCount: 287,
      price: 80000,
      originalPrice: 100000,
      discount: 20,
      busType: 'Thaco 35 chỗ',
      image: '🌟',
      tag: 'Popular Route',
      amenities: ['AC', 'WiFi'],
      popularity: 88
    },
    {
      id: 3,
      from: 'Đà Nẵng',
      to: 'Nha Trang',
      rating: 4.8,
      reviewCount: 156,
      price: 250000,
      originalPrice: 300000,
      discount: 17,
      busType: 'Toyota Limousine',
      image: '✨',
      tag: 'Premium Choice',
      amenities: ['Hot Water', 'Blanket'],
      popularity: 92
    }
  ]

  const handleBooking = (trip) => {
    navigate(`/booking/${trip.id}`, { state: { trip } })
  }

  return (
    <div className="featured-trips-section">
      <div className="section-header">
        <div className="header-content">
          <h2>
            <span className="icon">🎖️</span>
            Chuyến xe nổi bật
          </h2>
          <p>Những tuyến đường được yêu thích nhất với đánh giá cao từ khách hàng</p>
        </div>
      </div>

      <div className="featured-trips-container">
        {featuredTrips.map((trip, index) => (
          <div
            key={trip.id}
            className="featured-card"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Discount Badge */}
            {trip.discount > 0 && (
              <div className="discount-badge">
                -<span>{trip.discount}%</span>
              </div>
            )}

            {/* Featured Badge */}
            <div className="featured-badge">{trip.tag}</div>

            {/* Card Header with Rating */}
            <div className="card-header">
              <div className="header-top">
                <div className="route-display">
                  <span className="city-from">{trip.from}</span>
                  <span className="separator">→</span>
                  <span className="city-to">{trip.to}</span>
                </div>
              </div>

              <div className="rating-box">
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <FiStar
                      key={i}
                      size={16}
                      className={i < Math.floor(trip.rating) ? 'filled' : ''}
                    />
                  ))}
                </div>
                <span className="rating-value">{trip.rating}</span>
                <span className="review-count">({trip.reviewCount})</span>
              </div>
            </div>

            {/* Popularity Indicator */}
            <div className="popularity-bar">
              <div className="bar-label">
                <FiTrendingUp size={14} />
                <span>Popularity</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${trip.popularity}%` }}
                />
              </div>
            </div>

            {/* Bus Type */}
            <div className="bus-info">
              <span className="bus-type-badge">{trip.busType}</span>
            </div>

            {/* Amenities Display */}
            <div className="amenities-display">
              {trip.amenities.map((amenity, idx) => (
                <span key={idx} className="amenity-item">
                  {amenity === 'WiFi' && '📡'}
                  {amenity === 'Reclining Seats' && '🛏️'}
                  {amenity === 'AC' && '❄️'}
                  {amenity === 'Hot Water' && '☕'}
                  {amenity === 'Blanket' && '🧣'}
                  {' '}
                  {amenity}
                </span>
              ))}
            </div>

            {/* Pricing Section */}
            <div className="pricing-section">
              <div className="price-display">
                {trip.originalPrice !== trip.price && (
                  <span className="original-price">
                    {trip.originalPrice.toLocaleString()}đ
                  </span>
                )}
                <span className="current-price">
                  {trip.price.toLocaleString()}đ
                </span>
              </div>
              <button className="btn-book-featured" onClick={() => handleBooking(trip)}>
                Đặt ngay
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
