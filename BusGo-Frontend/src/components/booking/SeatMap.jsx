import './SeatMap.css'

export default function SeatMap({ trip, selectedSeats, onSeatSelect }) {
  // Generate seat layout - 4 columns of seats + 1 center aisle (5 cols total)
  const generateSeats = () => {
    const layout = []
    const totalSeats = trip.seats || 35
    let currentSeat = 1
    
    // Yêu cầu đặc biệt cho xe 35 chỗ:
    // Ghế đầu tiên nằm ở góc trên cùng bên phải (cạnh tài xế).
    // Các vị trí còn lại ở hàng 1 để trống (dành cho ghế tài xế và cửa lên xuống).
    if (totalSeats === 35) {
      layout.push(null, null, null, null, currentSeat++)
    }

    while (currentSeat <= totalSeats) {
      // Luôn duy trì lối đi ở giữa (Cột thứ 3, index 2) cho TẤT CẢ các hàng
      // Điều này giúp sơ đồ xe luôn thẳng cột, không bị lệch ở hàng cuối
      for (let i = 0; i < 5; i++) {
        if (i === 2) {
          layout.push(null) // Lối đi
        } else {
          if (currentSeat <= totalSeats) {
            layout.push(currentSeat++)
          } else {
            layout.push(null)
          }
        }
      }
    }

    return layout
  }

  const getSeatStatus = (seatNumber) => {
    if (!seatNumber) return 'aisle'
    if (trip.occupiedSeats.includes(seatNumber)) {
      return 'occupied'
    }
    if (selectedSeats.includes(seatNumber)) {
      return 'selected'
    }
    return 'available'
  }

  const seats = generateSeats()

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
                gridTemplateColumns: `repeat(5, 1fr)`,
                gap: '0.75rem',
                justifyContent: 'center',
                marginBottom: '2rem'
              }}
            >
              {seats.map((seatNumber, index) => {
                if (seatNumber === null) {
                  return <div key={`aisle-${index}`} className="seat-aisle" style={{ pointerEvents: 'none' }}></div>
                }

                const status = getSeatStatus(seatNumber)
                return (
                  <button
                    key={`seat-${seatNumber}`}
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
