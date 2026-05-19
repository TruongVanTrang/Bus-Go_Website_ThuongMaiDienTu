import './PassengerQuantity.css'

export default function PassengerQuantity({ trip, quantity, onQuantityChange }) {
  const maxPassengers = trip.seats - trip.occupiedSeats.length

  const handleIncrement = () => {
    if (quantity < maxPassengers) {
      onQuantityChange(quantity + 1)
    }
  }

  const handleDecrement = () => {
    if (quantity > 0) {
      onQuantityChange(quantity - 1)
    }
  }

  const handleInputChange = (e) => {
    const value = parseInt(e.target.value) || 0
    if (value >= 0 && value <= maxPassengers) {
      onQuantityChange(value)
    }
  }

  return (
    <div className="passenger-quantity-container">
      <div className="card" style={{ backgroundColor: 'white' }}>
        <div className="card-body">
          <h5 className="fw-bold mb-4">Chọn số lượng hành khách</h5>

          {/* Available Seats Info */}
          <div className="alert alert-info mb-4">
            <div className="small">
              <strong>Chỗ trống:</strong> {maxPassengers} / {trip.seats} chỗ
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="quantity-selector">
            <div className="d-flex align-items-center justify-content-center gap-3">
              <button
                onClick={handleDecrement}
                disabled={quantity === 0}
                className="btn btn-outline-primary"
                style={{
                  width: '50px',
                  height: '50px',
                  fontSize: '1.5rem',
                  padding: 0,
                  borderRadius: '0.5rem'
                }}
              >
                −
              </button>

              <input
                type="number"
                value={quantity}
                onChange={handleInputChange}
                min="0"
                max={maxPassengers}
                className="form-control"
                style={{
                  width: '100px',
                  textAlign: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  borderRadius: '0.5rem'
                }}
              />

              <button
                onClick={handleIncrement}
                disabled={quantity === maxPassengers}
                className="btn btn-primary"
                style={{
                  width: '50px',
                  height: '50px',
                  fontSize: '1.5rem',
                  padding: 0,
                  borderRadius: '0.5rem',
                  backgroundColor: '#0066cc',
                  borderColor: '#0066cc'
                }}
              >
                +
              </button>
            </div>

            <div className="text-center mt-4">
              <div className="fs-5 fw-bold text-neutral-900">
                Số hành khách: <span style={{ color: '#0066cc' }}>{quantity}</span>
              </div>
            </div>
          </div>

          {/* Passenger List */}
          {quantity > 0 && (
            <div className="mt-4 pt-4 border-top">
              <h6 className="fw-bold mb-3">Danh sách hành khách</h6>
              <div className="passenger-list">
                {Array.from({ length: quantity }).map((_, index) => (
                  <div key={index} className="passenger-item p-3 mb-2" style={{ backgroundColor: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                    <div className="small text-muted">Hành khách {index + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
