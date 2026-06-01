export default function PassengerQuantity({ trip, quantity, onQuantityChange }) {
  const maxPassengers = trip.seats - trip.occupiedSeats.length

  const handleIncrement = () => {
    if (quantity < maxPassengers) onQuantityChange(quantity + 1)
  }

  const handleDecrement = () => {
    if (quantity > 0) onQuantityChange(quantity - 1)
  }

  const handleInputChange = (e) => {
    const value = parseInt(e.target.value) || 0
    if (value >= 0 && value <= maxPassengers) onQuantityChange(value)
  }

  const occupiedPercent = Math.round((trip.occupiedSeats.length / trip.seats) * 100)

  return (
    <div>
      {/* Seat Availability Bar */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-blue-700">Chỗ còn trống</span>
          <span className="text-sm font-black text-blue-800">{maxPassengers} / {trip.seats} chỗ</span>
        </div>
        <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${100 - occupiedPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Quantity Selector */}
      <div className="flex items-center justify-center gap-6 py-4">
        <button
          onClick={handleDecrement}
          disabled={quantity === 0}
          className={`w-14 h-14 rounded-2xl text-2xl font-black flex items-center justify-center transition-all ${quantity === 0 ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-600 shadow-sm'}`}
        >
          −
        </button>

        <div className="text-center">
          <input
            type="number"
            value={quantity}
            onChange={handleInputChange}
            min="0"
            max={maxPassengers}
            className="w-24 text-center text-4xl font-black text-slate-900 bg-transparent border-none outline-none"
          />
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Hành khách</div>
        </div>

        <button
          onClick={handleIncrement}
          disabled={quantity === maxPassengers}
          className={`w-14 h-14 rounded-2xl text-2xl font-black flex items-center justify-center transition-all ${quantity === maxPassengers ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'}`}
        >
          +
        </button>
      </div>

      {/* Passenger List */}
      {quantity > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="text-sm font-bold text-slate-600 mb-3">Danh sách chỗ ({quantity} người)</div>
          <div className="space-y-2">
            {Array.from({ length: quantity }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                <div className="w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-black">{index + 1}</div>
                <span className="text-sm font-medium text-slate-600">Hành khách {index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
