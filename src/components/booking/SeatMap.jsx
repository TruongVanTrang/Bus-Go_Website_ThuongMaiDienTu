import './SeatMap.css'

export default function SeatMap({ trip, selectedSeats, onSeatSelect }) {
  // Generate seat layout based on bus type
  const generateSeats = () => {
    let seats = []
    
    if (trip.busType === 'bus') {
      // 45-seater bus layout: 5 rows with 9 seats each
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 5; col++) {
          const seatNumber = row * 5 + col + 1
          if (seatNumber <= trip.seats) {
            seats.push(seatNumber)
          }
        }
      }
    } else if (trip.busType === 'minibus') {
      // 16-seater minibus: 4 rows with 4 seats each
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          const seatNumber = row * 4 + col + 1
          if (seatNumber <= trip.seats) {
            seats.push(seatNumber)
          }
        }
      }
    } else {
      // 4-seater: standard layout
      for (let i = 1; i <= trip.seats; i++) {
        seats.push(i)
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
  const seatsPerRow = trip.busType === 'bus' ? 5 : (trip.busType === 'minibus' ? 4 : 2)

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
