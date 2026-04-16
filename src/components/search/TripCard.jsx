import { FiClock, FiMapPin, FiUsers, FiStar, FiHeart, FiInfo } from 'react-icons/fi'
import { useState, useEffect } from 'react'
import TripDetailsModal from './TripDetailsModal'
import './TripCard.css'

export default function TripCard({ trip, onSelect }) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const seatPercentage = (trip.totalSeats - trip.seatsAvailable) / trip.totalSeats * 100

  // Load favorite status from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('busgo_favorites')
    if (savedFavorites) {
      const favorites = JSON.parse(savedFavorites)
      setIsFavorite(favorites.some(fav => fav.tripId === trip.id))
    }
  }, [trip.id])

  const handleAddToFavorite = (e) => {
    e.stopPropagation()
    
    let savedFavorites = localStorage.getItem('busgo_favorites')
    let favorites = savedFavorites ? JSON.parse(savedFavorites) : []

    if (isFavorite) {
      // Remove from favorites
      favorites = favorites.filter(fav => fav.tripId !== trip.id)
      setIsFavorite(false)
    } else {
      // Add to favorites - save trip info for watchlist
      const newFavorite = {
        id: `TRIP${Date.now()}`,
        tripId: trip.id,
        from: trip.from,
        to: trip.to,
        operator: trip.operator,
        busType: trip.busType,
        departureTime: trip.departureTime,
        date: trip.date,
        averageRating: trip.rating,
        price: trip.price,
        type: 'trip'
      }
      favorites.push(newFavorite)
      setIsFavorite(true)
    }

    localStorage.setItem('busgo_favorites', JSON.stringify(favorites))
  }

  return (
    <>
      <div className="trip-card">
        {/* Favorite Button */}
        <button
          onClick={handleAddToFavorite}
          className="trip-favorite-btn"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}
          title={isFavorite ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
        >
          <FiHeart
            size={24}
            style={{
              color: isFavorite ? 'var(--color-danger-500)' : 'var(--color-neutral-400)',
              fill: isFavorite ? 'var(--color-danger-500)' : 'none',
              transition: 'all 0.2s ease'
            }}
          />
        </button>

        <div className="row align-items-center g-0">
          {/* Main Info */}
          <div className="col-lg-4 col-md-5 border-end border-neutral-200 p-4">
            <div className="trip-header mb-4">
              <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-primary-600)' }}>
                  BusGo
                </span>
                <span style={{ fontSize: '12px', color: 'var(--color-neutral-500)' }}>
                  Chuyến xe do BusGo điều hành
                </span>
              </div>
              <div className="d-flex align-items-center gap-2 mt-2">
                <FiStar size={16} style={{ color: 'var(--color-secondary-500)' }} />
                <span className="fw-600">{trip.rating}</span>
                <span className="text-muted small">({Math.floor(Math.random() * 500) + 100} reviews)</span>
              </div>
            </div>

            <div className="trip-time">
              <div className="fs-4 fw-bold text-neutral-900">{trip.departureTime}</div>
              <div className="text-muted small">{trip.from}</div>
              <div className="d-flex align-items-center gap-2 my-3">
                <FiClock size={16} style={{ color: 'var(--color-primary-600)' }} />
                <span className="small text-muted">{trip.duration}</span>
              </div>
              <div className="fs-4 fw-bold text-neutral-900">{trip.arrivalTime}</div>
              <div className="text-muted small">{trip.to}</div>
            </div>
          </div>

          {/* Amenities */}
          <div className="col-lg-3 col-md-4 border-end border-neutral-200 p-4">
            <div className="mb-3">
              <div className="small fw-600 text-neutral-700 mb-2">Tiện nghi</div>
              <div className="d-flex flex-wrap gap-2">
                {trip.amenities.map((amenity, idx) => (
                  <span key={idx} className="badge bg-light text-neutral-700" style={{ fontSize: '0.75rem' }}>
                    {amenity}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <div className="small fw-600 text-neutral-700 mb-2">Loại xe</div>
              <div className="small text-neutral-600 text-capitalize">
                {trip.busType === 'bus' ? 'Xe Bus' : 'Xe 4-35 chỗ'}
              </div>
            </div>

            <div className="mt-4">
              <div className="small fw-600 text-neutral-700 mb-2">Ghế trống</div>
              <div className="progress" style={{ height: '6px' }}>
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{
                    backgroundColor: trip.seatsAvailable > 5 ? 'var(--color-success-500)' : 'var(--color-danger-500)',
                    width: `${100 - seatPercentage}%`
                  }}
                />
              </div>
              <div className="small text-muted mt-2">
                {trip.seatsAvailable} / {trip.totalSeats} ghế
              </div>
            </div>
          </div>

          {/* Price & Action */}
          <div className="col-lg-5 col-md-3 p-4 d-flex flex-column justify-content-between align-items-end gap-3">
            <div className="text-end w-100">
              <div className="small text-muted mb-1">Giá từ</div>
              <div className="fs-3 fw-bold mb-2" style={{ color: 'var(--color-primary-600)' }}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(trip.price)}
              </div>
            </div>

            <div className="d-flex gap-2 flex-wrap w-100 justify-content-end">
              <button
                onClick={() => setShowDetailsModal(true)}
                className="btn btn-outline-secondary fw-600"
                style={{
                  padding: '0.65rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--color-neutral-300)',
                  color: 'var(--color-primary-600)',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'var(--color-primary-50)'
                  e.target.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent'
                  e.target.style.transform = 'translateY(0)'
                }}
                title="Xem chi tiết chuyến xe"
              >
                <FiInfo size={16} className="me-2" style={{ display: 'inline' }} />
                Xem chi tiết
              </button>

              <button
                onClick={onSelect}
                className="btn fw-600"
                style={{
                  backgroundColor: 'var(--color-primary-600)',
                  color: 'white',
                  padding: '0.65rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'var(--color-primary-700)'
                  e.target.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'var(--color-primary-600)'
                  e.target.style.transform = 'translateY(0)'
                }}
              >
                Chọn
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trip Details Modal */}
      {showDetailsModal && (
        <TripDetailsModal
          trip={trip}
          onClose={() => setShowDetailsModal(false)}
          onBook={(trip) => onSelect()}
        />
      )}
    </>
  )
}
