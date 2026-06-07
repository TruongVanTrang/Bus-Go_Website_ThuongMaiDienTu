import { useNavigate } from 'react-router-dom'
import { FiArrowRight, FiStar, FiClock, FiZap } from 'react-icons/fi'
import { MdAcUnit, MdWifi } from 'react-icons/md'
import { useState, useEffect } from 'react'

const MOCK_FALLBACK_TRIPS = [
  {
    id: 'mock-1',
    departureTime: '08:00',
    arrivalTime: '10:30',
    from: 'Cầu Rồng (Đà Nẵng)',
    to: 'Phố cổ Hội An',
    amenities: ['Wifi', 'Điều hòa', 'Nước uống'],
    rating: 4.8,
    price: 60000,
    seatsAvailable: 8
  },
  {
    id: 'mock-2',
    departureTime: '09:30',
    arrivalTime: '12:00',
    from: 'Đà Nẵng',
    to: 'Huế',
    amenities: ['Wifi', 'Điều hòa', 'Chăn đắp'],
    rating: 4.9,
    price: 120000,
    seatsAvailable: 15
  },
  {
    id: 'mock-3',
    departureTime: '13:00',
    arrivalTime: '15:15',
    from: 'Đà Nẵng',
    to: 'Quảng Nam',
    amenities: ['Điều hòa', 'Sạc USB'],
    rating: 4.7,
    price: 80000,
    seatsAvailable: 12
  },
  {
    id: 'mock-4',
    departureTime: '15:30',
    arrivalTime: '19:00',
    from: 'Đà Nẵng',
    to: 'Quảng Ngãi',
    amenities: ['Wifi', 'Điều hòa', 'Gối tựa'],
    rating: 4.8,
    price: 150000,
    seatsAvailable: 18
  }
]

export default function UpcomingTrips() {
  const navigate = useNavigate()
  const [upcomingTrips, setUpcomingTrips] = useState([])

  useEffect(() => {
    const fetchUpcomingTrips = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/trips/search')
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        if (data && data.length > 0) {
          setUpcomingTrips(data.slice(0, 4))
        } else {
          setUpcomingTrips(MOCK_FALLBACK_TRIPS)
        }
      } catch (error) {
        console.error('Error fetching upcoming trips, using mock fallback:', error)
        setUpcomingTrips(MOCK_FALLBACK_TRIPS)
      }
    }
    fetchUpcomingTrips()
  }, [])

  const handleBooking = (trip) => {
    navigate(`/booking/${trip.id}`, { state: { trip } })
  }

  return (
    <div className="w-full bg-white py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-100">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="mb-8 flex items-center gap-2">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shadow-sm">
            <FiClock size={20} />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#0c3d66] uppercase tracking-wide">Khởi hành trong 24h tới</h3>
            <p className="text-sm font-semibold text-slate-400 mt-1">Những chuyến xe chuẩn bị xuất phát - thiết kế dạng toa tàu kết nối</p>
          </div>
        </div>

        {/* Trips Connected Layout */}
        <div className="flex flex-col md:flex-row items-stretch justify-between gap-6 md:gap-0 overflow-x-auto py-6 px-2">
          {upcomingTrips.map((trip, idx) => (
            <div key={trip.id} className="flex-1 flex flex-col md:flex-row items-stretch animate-in fade-in duration-300">
              {idx > 0 && (
                <>
                  {/* Desktop Train Connector */}
                  <div className="hidden md:flex items-center justify-center shrink-0 w-8 -mx-4 z-20 self-center">
                    <div className="w-8 h-3 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-500 rounded border-y border-slate-500 shadow-md relative flex items-center justify-center">
                      <div className="absolute left-1 w-1 h-full bg-slate-550/20"></div>
                      <div className="absolute right-1 w-1 h-full bg-slate-550/20"></div>
                    </div>
                  </div>
                  {/* Mobile Train Connector */}
                  <div className="flex md:hidden items-center justify-center shrink-0 h-6 -my-3 z-20 self-center">
                    <div className="w-3 h-6 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-500 rounded border-x border-slate-500 shadow-md relative flex items-center justify-center">
                      <div className="absolute top-1 h-1 w-full bg-slate-550/20"></div>
                      <div className="absolute bottom-1 h-1 w-full bg-slate-550/20"></div>
                    </div>
                  </div>
                </>
              )}

              {/* Train Carriage Card */}
              <div 
                className="group flex-1 min-w-[260px] bg-white border-2 border-slate-200/80 hover:border-blue-500 rounded-[28px] p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative flex flex-col justify-between cursor-pointer"
                onClick={() => handleBooking(trip)}
              >
                {/* Carriage Windows Design */}
                <div className="bg-blue-50/50 rounded-xl p-3 mb-4 border border-blue-100/50 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-800">{trip.departureTime}</span>
                    <span className="text-[10px] text-slate-400 font-bold">Giờ đi</span>
                  </div>
                  <div className="h-4 w-[1px] bg-blue-100"></div>
                  <div className="flex flex-col text-right">
                    <span className="text-sm font-black text-blue-600">{trip.arrivalTime}</span>
                    <span className="text-[10px] text-slate-400 font-bold">Giờ đến</span>
                  </div>
                </div>

                {/* Route Information */}
                <div className="mb-4">
                  <div className="text-xs font-black text-slate-800 truncate mb-1">{trip.from}</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Điểm đi</div>
                  
                  {/* Connected track graphic */}
                  <div className="flex items-center gap-1.5 my-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                    <div className="flex-1 h-[2px] border-t-2 border-dashed border-slate-200"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  </div>

                  <div className="text-xs font-black text-slate-800 truncate mt-1">{trip.to}</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Điểm đến</div>
                </div>

                {/* Amenities & Rating */}
                <div className="flex items-center justify-between gap-2 mb-5">
                  <div className="flex gap-1">
                    {trip.amenities?.slice(0, 2).map((amenity, aIdx) => (
                      <span key={aIdx} className="bg-slate-50 text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-slate-100 text-slate-500">
                        {amenity}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 text-[10px] font-bold text-slate-700">
                    <FiStar className="text-amber-500 fill-amber-500" size={10} />
                    {trip.rating}
                  </div>
                </div>

                {/* Booking & Price */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <div className="flex flex-col">
                    <span className="text-base font-black text-blue-600">{(trip.price).toLocaleString()}đ</span>
                    <span className="text-[9px] text-slate-400 font-bold">Còn {trip.seatsAvailable} chỗ</span>
                  </div>
                  <button 
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-extrabold shadow-sm uppercase tracking-wide transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleBooking(trip)
                    }}
                  >
                    Đặt
                  </button>
                </div>

                {/* Carriage Wheels (Decorative) */}
                <div className="absolute -bottom-2.5 left-8 w-5 h-5 rounded-full bg-slate-800 border-[3px] border-slate-200 shadow-md group-hover:bg-blue-600 transition-colors"></div>
                <div className="absolute -bottom-2.5 right-8 w-5 h-5 rounded-full bg-slate-800 border-[3px] border-slate-200 shadow-md group-hover:bg-blue-600 transition-colors"></div>
              </div>
            </div>
          ))}
        </div>

        {/* View All */}
        <div className="text-center mt-6">
          <button 
            onClick={() => navigate('/search')}
            className="px-6 py-3 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-sm"
          >
            Xem tất cả chuyến xe ➔
          </button>
        </div>
      </div>
    </div>
  )
}
