import { useNavigate } from 'react-router-dom'
import { FiClock, FiMapPin, FiArrowRight, FiStar } from 'react-icons/fi'
import { useState, useEffect } from 'react'

export default function UpcomingTrips() {
  const navigate = useNavigate()

  const [upcomingTrips, setUpcomingTrips] = useState([])
  const [loading, setLoading] = useState(true)

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
      } finally {
        setLoading(false)
      }
    }

    fetchUpcomingTrips()
  }, [])

  const handleBooking = (trip) => {
    navigate(`/booking/${trip.id}`, { state: { trip } })
  }

  return (
    <div className="py-16 px-4 bg-blue-50 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Khởi hành trong 24h tới</h2>
          <p className="text-slate-500">Những chuyến xe sắp khởi hành - Đặt vé ngay để không mất chỗ</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {upcomingTrips.map(trip => (
            <div 
              key={trip.id} 
              onClick={() => handleBooking(trip)}
              className="group relative bg-white border border-slate-200 rounded-2xl p-5 cursor-pointer hover:border-blue-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              {/* Top border highlight on hover */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />

              {/* Early Departure Badge */}
              {trip.departureTime <= '08:00' && (
                <div className="absolute top-3 right-3 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-wide">
                  Sớm hôm nay
                </div>
              )}

              {/* Trip Header */}
              <div className="flex justify-between items-start mb-4 mt-2">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold text-slate-900 w-16">{trip.from}</div>
                  <div className="flex flex-col items-center text-blue-500">
                    <FiArrowRight size={18} />
                    <span className="text-[10px] font-bold mt-0.5">{trip.departureTime}</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 w-16 text-right">{trip.to}</div>
                </div>

                <div className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md text-xs font-bold">
                  <FiStar size={12} className="text-amber-400" />
                  <span>{trip.rating}</span>
                </div>
              </div>

              {/* Bus Type */}
              <div className="inline-block px-3 py-1 bg-slate-100 rounded-lg text-[11px] font-semibold text-slate-600 mb-3">
                {trip.busType}
              </div>

              {/* Amenities */}
              <div className="flex flex-wrap gap-2 mb-4">
                {trip.amenities?.slice(0, 2).map((amenity, idx) => (
                  <span key={idx} className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-[10px] font-semibold whitespace-nowrap">
                    {amenity}
                  </span>
                ))}
                {trip.amenities?.length > 2 && (
                  <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-[10px] font-semibold">
                    +{trip.amenities.length - 2}
                  </span>
                )}
              </div>

              {/* Occupancy Bar */}
              <div className="mb-4">
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${trip.totalSeats ? ((trip.totalSeats - trip.seatsAvailable) / trip.totalSeats) * 100 : 0}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 font-medium text-right">
                  {trip.seatsAvailable} ghế trống
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <div className="text-lg font-bold text-blue-600">
                  {trip.price.toLocaleString()}đ
                </div>
                <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs font-semibold hover:shadow-md transition-all">
                  Đặt vé
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button 
            onClick={() => navigate('/search')}
            className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-xl text-sm font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm hover:shadow-blue-200"
          >
            Xem tất cả chuyến xe →
          </button>
        </div>
      </div>
    </div>
  )
}
