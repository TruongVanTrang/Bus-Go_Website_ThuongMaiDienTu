import { useState } from 'react'
import { FiX, FiClock, FiMapPin, FiEdit2, FiWifi } from 'react-icons/fi'
import { MdDirectionsBus } from 'react-icons/md'
import './TripDetailsModal.css'

export default function TripDetailsModal({ trip, onClose, onBook }) {
  const [selectedSeats, setSelectedSeats] = useState([])

  if (!trip) return null

  const progressStops = trip.stops || []

  return (
    <div className="trip-details-modal-overlay" onClick={onClose}>
      <div className="trip-details-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="fw-bold mb-0">Chi tiết chuyến xe</h2>
          <button className="btn-close" onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="modal-body">
          {/* Trip Header */}
          <div className="trip-header-info mb-4">
            <div className="row align-items-center">
              <div className="col-lg-4 col-md-5 mb-3 mb-md-0">
                <div className="trip-time-info">
                  <div className="departure">
                    <div className="time fw-bold fs-4">{trip.departureTime}</div>
                    <div className="from text-muted small">{trip.from}</div>
                  </div>
                  <div className="duration text-center my-3">
                    <FiClock size={20} style={{ color: '#667eea' }} />
                    <span className="ms-2 small fw-600">{trip.duration}</span>
                  </div>
                  <div className="arrival">
                    <div className="time fw-bold fs-4">{trip.arrivalTime}</div>
                    <div className="to text-muted small">{trip.to}</div>
                  </div>
                </div>
              </div>

              <div className="col-lg-8 col-md-7">
                <div className="p-3" style={{ backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <h5 className="fw-bold mb-3 text-neutral-900">Thông tin chuyến xe</h5>
                  <div className="row g-3">
                    <div className="col-6 col-md-4">
                      <div className="small text-muted mb-1">Nhà xe</div>
                      <div className="fw-600">{trip.operator}</div>
                    </div>
                    <div className="col-6 col-md-4">
                      <div className="small text-muted mb-1">Loại xe</div>
                      <div className="fw-600">{trip.busType === 'bus' ? 'Xe Bus' : 'Xe Minibus'}</div>
                    </div>
                    <div className="col-6 col-md-4">
                      <div className="small text-muted mb-1">Ghế trống</div>
                      <div className="fw-600" style={{ color: '#27ae60' }}>
                        {trip.seatsAvailable}/{trip.totalSeats}
                      </div>
                    </div>
                    <div className="col-6 col-md-4">
                      <div className="small text-muted mb-1">Giá vé</div>
                      <div className="fw-bold fs-5" style={{ color: '#667eea' }}>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                          trip.price
                        )}
                      </div>
                    </div>
                    <div className="col-6 col-md-4">
                      <div className="small text-muted mb-1">Đánh giá</div>
                      <div className="fw-600">
                        ⭐ {trip.rating}
                        <span className="text-muted small ms-1">({Math.floor(Math.random() * 500) + 100} reviews)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <h5 className="fw-bold mb-3 text-neutral-900">Mô tả chuyến xe</h5>
            <div className="p-3" style={{ backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <p className="text-neutral-700 mb-0" style={{ lineHeight: '1.6' }}>
                {trip.description}
              </p>
            </div>
          </div>

          {/* Amenities */}
          <div className="mb-4">
            <h5 className="fw-bold mb-3 text-neutral-900">Tiện nghi</h5>
            <div className="amenities-grid">
              {trip.amenities.map((amenity, idx) => (
                <div key={idx} className="amenity-item p-2" style={{ backgroundColor: '#f0f4fa', borderRadius: '6px' }}>
                  <div className="d-flex align-items-center gap-2">
                    {amenity.includes('Wifi') && <FiWifi size={18} style={{ color: '#667eea' }} />}
                    {amenity.includes('AC') && <span style={{ color: '#667eea' }}>❄️</span>}
                    {amenity.includes('Charger') && <span style={{ color: '#667eea' }}>🔌</span>}
                    {amenity.includes('Blanket') && <span style={{ color: '#667eea' }}>🛏️</span>}
                    {amenity.includes('Toilet') && <span style={{ color: '#667eea' }}>🚽</span>}
                    {amenity.includes('Pillow') && <span style={{ color: '#667eea' }}>🛌</span>}
                    <span className="small fw-500">{amenity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bus Stops Timeline */}
          {trip.stops && trip.stops.length > 0 && (
            <div className="mb-4">
              <h5 className="fw-bold mb-3 text-neutral-900">Các trạm dừng</h5>
              <div className="stops-timeline">
                {progressStops.map((stop, index) => (
                  <div key={index} className="stop-item">
                    <div className="stop-timeline">
                      <div className={`stop-dot ${stop.type}`} />
                      {index < progressStops.length - 1 && <div className="stop-line" />}
                    </div>
                    <div className="stop-info">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fw-600 text-neutral-900">{stop.name}</div>
                          <div className="small text-muted">
                            <FiClock size={14} className="me-1" style={{ display: 'inline' }} />
                            {stop.time}
                          </div>
                        </div>
                        {stop.type === 'start' && (
                          <span className="badge bg-success small">Khởi hành</span>
                        )}
                        {stop.type === 'end' && (
                          <span className="badge bg-warning small">Kết thúc</span>
                        )}
                        {stop.type === 'stop' && (
                          <span className="badge bg-light text-neutral-700 small">Dừng</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer border-top p-3">
          <button className="btn btn-outline-secondary px-4" onClick={onClose}>
            Đóng
          </button>
          <button
            className="btn btn-primary px-5"
            onClick={() => {
              onBook(trip)
              onClose()
            }}
          >
            <FiEdit2 size={18} className="me-2" style={{ display: 'inline' }} />
            Đặt chuyến này
          </button>
        </div>
      </div>
    </div>
  )
}
