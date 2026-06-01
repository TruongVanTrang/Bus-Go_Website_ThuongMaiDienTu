import { useNavigate } from 'react-router-dom'
import { FiArrowRight, FiStar, FiTrendingUp, FiZap } from 'react-icons/fi'
import { MdAcUnit, MdWifi } from 'react-icons/md'
import { useState, useEffect } from 'react'

export default function UpcomingTrips() {
  const navigate = useNavigate()

  const [upcomingTrips, setUpcomingTrips] = useState([])

  useEffect(() => {
    const fetchUpcomingTrips = async () => {
      try {
        // Fetch all trips from today onwards
        const res = await fetch('http://localhost:5000/api/trips/search')
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        
        // Lấy 4 chuyến xe gần nhất
        setUpcomingTrips(data.slice(0, 4))
      } catch (error) {
        console.error('Error fetching upcoming trips:', error)
      }
    }

    fetchUpcomingTrips()
  }, [])

  const handleBooking = (trip) => {
    navigate(`/booking/${trip.id}`, { state: { trip } })
  }

  return (
    <div className="py-6 px-4 bg-blue-100 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div>
        {/* Header - Simple style like HomeSuggestions */}
        <div className="mb-6 border-b border-slate-200 pb-4 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Khởi hành trong 24h tới</h3>
            <p className="text-sm font-medium text-slate-500">Những chuyến xe sắp khởi hành - Đặt vé ngay để không mất chỗ</p>
          </div>
        </div>

        {/* Column Headers */}
        <div className="hidden lg:grid gap-2 mb-2 px-3 py-2 bg-slate-100 rounded-lg" style={{ gridTemplateColumns: '0.9fr 1.4fr 1fr 1fr 1fr 0.7fr' }}>
          <div className="text-xs font-bold text-slate-600 uppercase">CHUYẾN ĐI</div>
          <div className="text-xs font-bold text-slate-600 uppercase">TUYẾN ĐƯỜNG</div>
          <div className="text-xs font-bold text-slate-600 uppercase">TIỆN ÍCH</div>
          <div className="text-xs font-bold text-slate-600 uppercase">ĐÁNH GIÁ</div>
          <div className="text-xs font-bold text-slate-600 uppercase">GIÁ VÉ</div>
          <div className="text-xs font-bold text-slate-600 uppercase text-right">HÀNH ĐỘNG</div>
        </div>

        {/* Trips List - Compact Row Layout */}
        <div className="space-y-1 mb-8">
          {upcomingTrips.map((trip, idx) => (
            <div 
              key={trip.id} 
              className="group bg-white border border-slate-200 rounded-lg p-3 hover:border-blue-400 hover:shadow-md transition-all duration-300 cursor-pointer"
              onClick={() => handleBooking(trip)}
            >
              <div className="grid gap-2 lg:gap-2 items-center" style={{ gridTemplateColumns: '0.9fr 1.4fr 1fr 1fr 1fr 0.7fr' }}>
                
                {/* Departure Time */}
                <div>
                  <div className="flex items-center gap-2 lg:flex-col lg:items-start">
                    <div className="text-lg font-black text-slate-900">{trip.departureTime}</div>
                    <div className="text-xs text-slate-500 font-semibold">{trip.arrivalTime}</div>
                  </div>
                </div>

                {/* Route */}
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">{trip.from}</div>
                      <div className="text-xs text-slate-500">Điểm đi</div>
                    </div>
                    <FiArrowRight className="text-slate-300 flex-shrink-0" size={14} />
                    <div className="flex-1 min-w-0 text-right">
                      <div className="text-sm font-bold text-slate-900 truncate">{trip.to}</div>
                      <div className="text-xs text-slate-500">Điểm đến</div>
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <div className="flex flex-wrap gap-1">
                    {trip.amenities?.slice(0, 2).map((amenity, idx) => {
                      let icon = null
                      if (amenity === 'Wifi') icon = <MdWifi size={11} />
                      else if (amenity === 'AC') icon = <MdAcUnit size={11} />
                      else if (amenity === 'Phone Charger') icon = <FiZap size={11} />
                      
                      return (
                        <div key={idx} className="flex items-center gap-0.5 bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[8px] font-bold border border-blue-200">
                          {icon}
                          <span>{amenity}</span>
                        </div>
                      )
                    })}
                    {trip.amenities?.length > 2 && (
                      <div className="text-[8px] font-bold text-slate-600 px-1.5 py-0.5">
                        +{trip.amenities.length - 2}
                      </div>
                    )}
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <div className="flex items-center justify-center lg:justify-start gap-1 bg-blue-50 px-2 py-1 rounded w-fit">
                    <FiStar size={12} className="text-amber-400 fill-amber-400" />
                    <span className="font-bold text-slate-900 text-xs">{trip.rating}</span>
                    <span className="text-[10px] text-slate-500">({trip.reviews || 0})</span>
                  </div>
                </div>

                {/* Price */}
                <div>
                  <div className="text-center lg:text-left">
                    <div className="text-lg font-black text-blue-600">
                      {(trip.price / 1000).toFixed(0)}k
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold">
                      {trip.seatsAvailable} ghế
                    </div>
                  </div>
                </div>

                {/* Book Button */}
                <div>
                  <button 
                    className="w-full lg:w-auto px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded text-xs font-bold hover:shadow-md transition-all"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleBooking(trip)
                    }}
                  >
                    Đặt
                  </button>
                </div>
              </div>

              {/* Occupancy Bar */}
              <div className="mt-2 pt-2 border-t border-slate-100 hidden lg:block">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-500">Ghế: {trip.totalSeats ? Math.round(((trip.totalSeats - trip.seatsAvailable) / trip.totalSeats) * 100) : 0}%</span>
                </div>
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${trip.totalSeats ? ((trip.totalSeats - trip.seatsAvailable) / trip.totalSeats) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <button 
            onClick={() => navigate('/search')}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-2 border-blue-600 rounded-lg text-sm font-bold hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg transition-all"
          >
            Xem tất cả chuyến xe →
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}
