import { useState } from 'react'

export default function SeatMap({ trip, selectedSeats, onSeatSelect }) {
  const [activeDeck, setActiveDeck] = useState(0) // 0: Lower, 1: Upper

  const generateSeats = () => {
    const layout = []
    const totalSeats = trip.seats || 35

    // XỬ LÝ RIÊNG CHO GIƯỜNG NẰM 36 CHỖ
    if (totalSeats === 36) {
      let currentSeat = activeDeck === 0 ? 1 : 19
      const endSeat = activeDeck === 0 ? 18 : 36
      while (currentSeat <= endSeat) {
        for (let i = 0; i < 5; i++) {
          if (i === 1 || i === 3) layout.push(null)
          else layout.push(currentSeat++)
        }
      }
      return layout
    }

    let currentSeat = 1

    // XỬ LÝ RIÊNG CHO XE 35 CHỖ
    // Hàng 1: Ghế 1 ở góc phải (cạnh tài xế)
    // Hàng 2: Ghế 2 và 3 ở bên trái, bên phải trống (vị trí cửa xe)
    // Hàng 3+: Bình thường 4 ghế / hàng
    if (totalSeats === 35) {
      layout.push(null, null, null, null, currentSeat++) // [_, _, _, _, 1]
      layout.push(currentSeat++, currentSeat++, null, null, null) // [2, 3, _, _, _]

      while (currentSeat <= totalSeats) {
        for (let i = 0; i < 5; i++) {
          if (i === 2) layout.push(null)
          else {
            if (currentSeat <= totalSeats) layout.push(currentSeat++)
            else layout.push(null)
          }
        }
      }
      return layout
    }

    // XỬ LÝ RIÊNG CHO XE 45 CHỖ
    // Ghế số 1 ở góc phải (cạnh tài xế), sau đó đi bình thường
    if (totalSeats === 45) {
      layout.push(null, null, null, null, currentSeat++) // [_, _, _, _, 1]
    }

    while (currentSeat <= totalSeats) {
      for (let i = 0; i < 5; i++) {
        if (i === 2) layout.push(null)
        else {
          if (currentSeat <= totalSeats) layout.push(currentSeat++)
          else layout.push(null)
        }
      }
    }

    return layout
  }

  const getSeatStatus = (seatNumber) => {
    if (!seatNumber) return 'aisle'
    if (trip.occupiedSeats.includes(seatNumber)) return 'occupied'
    if (selectedSeats.includes(seatNumber)) return 'selected'
    return 'available'
  }

  const seats = generateSeats()
  const isSleeper = trip.seats === 36

  const seatClass = (status, isSleeper) => {
    const base = `flex items-center justify-center rounded-lg font-bold text-xs transition-all select-none ${isSleeper ? 'h-10 w-full' : 'h-10 w-full aspect-square'}`
    if (status === 'selected') return `${base} bg-blue-600 text-white shadow-md scale-95 ring-2 ring-blue-300`
    if (status === 'occupied') return `${base} bg-slate-200 text-slate-400 cursor-not-allowed`
    if (status === 'aisle') return `${base} pointer-events-none`
    return `${base} bg-white border-2 border-slate-200 text-slate-600 hover:border-blue-400 hover:bg-blue-50 cursor-pointer`
  }

  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white border-2 border-slate-200 rounded-lg"></div>
          <span className="text-sm font-medium text-slate-600">Ghế trống</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg ring-2 ring-blue-300"></div>
          <span className="text-sm font-medium text-slate-600">Đang chọn</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
          <span className="text-sm font-medium text-slate-600">Đã đặt</span>
        </div>
      </div>

      {/* Deck Tabs for Sleeper Bus */}
      {isSleeper && (
        <div className="flex gap-3 mb-6 justify-center">
          <button
            className={`px-6 py-2 rounded-full font-bold text-sm transition-colors ${activeDeck === 0 ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            onClick={() => setActiveDeck(0)}
          >
            🛏️ Tầng Dưới (1–18)
          </button>
          <button
            className={`px-6 py-2 rounded-full font-bold text-sm transition-colors ${activeDeck === 1 ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            onClick={() => setActiveDeck(1)}
          >
            🛏️ Tầng Trên (19–36)
          </button>
        </div>
      )}

      {/* Seat Grid */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
        <div className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-center gap-2">
          ⬆️ <span>CABIN TRƯỚC</span> ⬆️
        </div>

        <div
          className="mx-auto"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '8px', maxWidth: '260px' }}
        >
          {seats.map((seatNumber, index) => {
            if (seatNumber === null) {
              return <div key={`aisle-${index}`} className="h-10"></div>
            }
            const status = getSeatStatus(seatNumber)
            return (
              <button
                key={`seat-${seatNumber}`}
                onClick={() => status !== 'occupied' && onSeatSelect(seatNumber)}
                disabled={status === 'occupied'}
                className={seatClass(status, isSleeper)}
                title={isSleeper ? `Giường ${seatNumber}` : `Ghế ${seatNumber}`}
              >
                {seatNumber}
              </button>
            )
          })}
        </div>

        <div className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider mt-4 flex items-center justify-center gap-2">
          ⬇️ <span>CABIN SAU</span> ⬇️
        </div>
      </div>

      {/* Selected Seats Summary */}
      {selectedSeats.length > 0 && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <span className="text-sm font-bold text-blue-700">
            ✅ Ghế đã chọn ({selectedSeats.length}): <span className="font-black">{selectedSeats.sort((a, b) => a - b).join(', ')}</span>
          </span>
        </div>
      )}
    </div>
  )
}
