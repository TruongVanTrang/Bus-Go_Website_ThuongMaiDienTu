import './SeatMap.css'

export default function SeatMap({ trip, selectedSeats, onSeatSelect }) {
  // Generate seat layout - 2 types: 16-seater (4 columns) or 35-seater (5 columns)
  const generateSeats = () => {
    let seats = []
    const totalSeats = trip.seats
    
    if (totalSeats === 35) {
      // 35-seater: 5 columns, 7 rows
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 5; col++) {
          const seatNumber = row * 5 + col + 1
          seats.push(seatNumber)
        }
      }
    } else if (totalSeats === 16) {
      // 16-seater: 4 columns, 4 rows
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          const seatNumber = row * 4 + col + 1
          seats.push(seatNumber)
        }
      }
    }

    return seats
  }

  const getSeatStatus = (seatNumber) => {
    if (trip.occupiedSeats.includes(seatNumber)) {
      return 'occupied'
    }
    if (selectedSeats.includes(seatNumber)) {
      return 'selected'
    }
    return 'available'
  }

  const seats = generateSeats()
  const seatsPerRow = trip.seats === 35 ? 5 : 4

  return (
    <div className="seat-map-container">
      <div className="card" style={{ backgroundColor: 'white' }}>
        <div className="card-body">
          <h5 className="fw-bold mb-4">Sơ đồ ghế ngồi</h5>

          {/* Legend */}
          <div className="seat-legend mb-4 d-flex flex-wrap gap-3">
            <div className="d-flex align-items-center gap-2">
              <div
                className="seat-item"
                style={{
                  backgroundColor: 'white',
                  border: '2px solid var(--color-neutral-300)',
                  width: '30px',
                  height: '30px'
                }}
              />
              <span className="small">Ghế trống</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <div
                className="seat-item"
                style={{
                  backgroundColor: 'var(--color-primary-600)',
                  width: '30px',
                  height: '30px'
                }}
              />
              <span className="small">Ghế đang chọn</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <div
                className="seat-item"
                style={{
                  backgroundColor: 'var(--color-neutral-400)',
                  width: '30px',
                  height: '30px'
                }}
              />
              <span className="small">Ghế đã đặt</span>
            </div>
          </div>

          {/* Seat Grid */}
          <div className="seat-grid-wrapper">
            <div className="text-center mb-3 text-muted fw-600">
              ⬆️ CABIN TRƯỚC ⬆️
            </div>

            <div
              className="seat-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${seatsPerRow}, 1fr)`,
                gap: '0.75rem',
                justifyContent: 'center',
                marginBottom: '2rem'
              }}
            >
              {seats.map(seatNumber => {
                const status = getSeatStatus(seatNumber)
                return (
                  <button
                    key={seatNumber}
                    onClick={() => {
                      if (status !== 'occupied') {
                        onSeatSelect(seatNumber)
                      }
                    }}
                    disabled={status === 'occupied'}
                    className={`seat-button seat-${status}`}
                    title={`Ghế ${seatNumber}`}
                  >
                    {seatNumber}
                  </button>
                )
              })}
            </div>

            <div className="text-center text-muted fw-600">
              ⬇️ CABIN SAU ⬇️
            </div>
          </div>

          {/* Selected Seats Info */}
          {selectedSeats.length > 0 && (
            <div className="mt-4 alert alert-info">
              <div className="fw-600">Ghế đã chọn</div>
              <div className="text-normal mt-2">
                {selectedSeats.sort((a, b) => a - b).join(', ')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
