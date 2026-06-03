import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import TripCard from '../../components/search/TripCard'
import SearchFilters from '../../components/search/SearchFilters'
import { searchTrips } from '../../services/tripService'
import { FiRefreshCw, FiSearch, FiAlertTriangle, FiLoader } from 'react-icons/fi'

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [filteredTrips, setFilteredTrips] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const location = useLocation()

  const [filters, setFilters] = useState({
    priceRange: location.state?.priceRange || [0, 1000000],
    amenities: location.state?.amenities || [],
    busType: location.state?.busType || '',
    departureTime: location.state?.departureTime || '',
    category: searchParams.get('category') || location.state?.category || '',
    from: searchParams.get('from') || location.state?.from || '',
    to: searchParams.get('to') || location.state?.to || '',
    departureDate: searchParams.get('date') || ''
  })

  // Fetch matching trips from backend API when core filters change
  useEffect(() => {
    // Luôn xóa bản nháp khi người dùng quay lại trang tìm kiếm để không bị dính trạng thái cũ
    sessionStorage.removeItem('bookingDraft')

    const fetchTrips = async () => {
      setLoading(true)
      setError(null)
      try {
        const from = filters.from || ''
        const to = filters.to || ''
        const date = filters.departureDate || ''
        const category = filters.category || ''
        const busType = filters.busType || ''

        const data = await searchTrips(from, to, date, category, busType)
        setTrips(data)
      } catch (err) {
        console.error('Error fetching trips:', err)
        setError(err.message || 'Lỗi kết nối máy chủ khi tìm kiếm chuyến xe')
      } finally {
        setLoading(false)
      }
    }

    fetchTrips()
  }, [filters.from, filters.to, filters.departureDate, filters.category, filters.busType])

  // Dynamically adjust price limit based on category
  useEffect(() => {
    if (filters.category === 'city') {
      setFilters(prev => ({
        ...prev,
        priceRange: prev.priceRange[1] > 100000 ? [0, 100000] : prev.priceRange
      }))
    } else {
      setFilters(prev => ({
        ...prev,
        priceRange: prev.priceRange[1] <= 100000 ? [0, 1000000] : prev.priceRange
      }))
    }
  }, [filters.category])

  // Client-side filtration for price, amenities, vehicle types, and departure times
  useEffect(() => {
    let filtered = trips.filter(trip => {
      // Core route verification
      if (filters.from && trip.from !== filters.from) return false
      if (filters.to && trip.to !== filters.to) return false

      // Price filter
      if (trip.price < filters.priceRange[0] || trip.price > filters.priceRange[1]) return false

      // Bus type filter
      if (filters.busType && filters.busType !== '') {
        if (trip.busType !== filters.busType) return false
      }

      // Amenities filter
      if (filters.amenities && filters.amenities.length > 0) {
        const hasAllAmenities = filters.amenities.every(amenity => trip.amenities.includes(amenity))
        if (!hasAllAmenities) return false
      }

      // Departure time filter
      if (filters.departureTime && filters.departureTime !== '') {
        const hour = parseInt(trip.departureTime.split(':')[0])
        
        const timeRanges = {
          early: { start: 4, end: 6 },
          morning_early: { start: 6, end: 8 },
          morning: { start: 8, end: 10 },
          late_morning: { start: 10, end: 12 },
          early_afternoon: { start: 12, end: 14 },
          afternoon: { start: 14, end: 16 },
          late_afternoon: { start: 16, end: 18 },
          evening: { start: 18, end: 20 },
          late_evening: { start: 20, end: 22 },
          night: { start: 22, end: 4 }
        }

        const range = timeRanges[filters.departureTime]
        if (range) {
          if (range.start < range.end) {
            if (hour < range.start || hour >= range.end) return false
          } else {
            // Night time (22:00-04:00)
            if (hour < range.start && hour >= range.end) return false
          }
        }
      }

      return true
    })

    setFilteredTrips(filtered)
  }, [filters, trips])

  // Preserve filters in history state so they are not lost when navigating back from BookingPage
  useEffect(() => {
    navigate('.', { state: filters, replace: true })
  }, [filters, navigate])

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-8 md:px-16">
      <div className="max-w-[1400px] mx-auto">
        
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 xl:gap-10">
          
          {/* Filters Sidebar - Left Column */}
          <div className="lg:col-span-3">
            <SearchFilters filters={filters} setFilters={setFilters} />
          </div>

          {/* Results - Right Column */}
          <div className="lg:col-span-7">
            
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 mb-2">Kết quả tìm kiếm</h1>
                <p className="text-slate-500 font-medium">
                  {loading ? 'Đang phân tích dữ liệu chuyến xe...' : `Tìm thấy ${filteredTrips.length} chuyến xe phù hợp`}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-16 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h3 className="text-lg font-bold text-slate-900">Đang tìm kiếm chuyến xe tốt nhất...</h3>
                <p className="text-slate-500 mt-2">Vui lòng đợi trong giây lát</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 rounded-2xl border border-red-100 p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                  <FiAlertTriangle size={32} />
                </div>
                <h3 className="text-lg font-bold text-red-700 mb-2">Đã xảy ra sự cố</h3>
                <p className="text-red-500 font-medium">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"
                >
                  Thử lại
                </button>
              </div>
            ) : filteredTrips.length > 0 ? (
              <div className="space-y-4">
                {filteredTrips.map(trip => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    onSelect={() => navigate(`/booking/${trip.id}`, { state: { trip } })}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-16 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                  <FiSearch size={40} className="text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Không tìm thấy chuyến xe nào</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-8">
                  Không có chuyến xe nào khớp với tiêu chí tìm kiếm của bạn. Hãy thử thay đổi bộ lọc, chọn thời gian khác hoặc điểm đến khác.
                </p>
                <button
                  onClick={() => {
                    setFilters({
                      priceRange: filters.category === 'city' ? [0, 100000] : [0, 1000000],
                      amenities: [],
                      busType: '',
                      departureTime: '',
                      category: filters.category,
                      from: filters.from,
                      to: filters.to,
                      departureDate: filters.departureDate
                    })
                  }}
                  className="px-6 py-3 bg-slate-900 hover:bg-blue-600 text-white font-bold rounded-xl flex items-center gap-2 transition-colors shadow-sm"
                >
                  <FiRefreshCw /> Làm mới bộ lọc
                </button>
              </div>
            )}
            
          </div>
        </div>

      </div>
    </div>
  )
}
