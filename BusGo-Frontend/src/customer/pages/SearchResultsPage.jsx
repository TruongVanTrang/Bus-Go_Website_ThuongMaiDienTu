import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { FiRefreshCw, FiSearch, FiAlertTriangle, FiLoader, FiFilter, FiCalendar, FiMapPin } from 'react-icons/fi'
import { BUS_CATEGORIES, CITY_STOPS, INTERCITY_ROUTES } from '../../utils/constants'
import { AuthUtil } from '../../utils/helpers'
import TripCard from '../../components/search/TripCard'
import SearchFilters from '../../components/search/SearchFilters'
import { searchTrips } from '../../services/tripService'

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

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  // Local state for the horizontal search bar to commit on button click
  const [searchFrom, setSearchFrom] = useState(filters.from)
  const [searchTo, setSearchTo] = useState(filters.to)
  const [searchDate, setSearchDate] = useState(filters.departureDate)
  const [searchCategory, setSearchCategory] = useState(filters.category)

  // Synchronize top search bar parameters if they update from parent or URL
  useEffect(() => {
    setSearchFrom(filters.from)
    setSearchTo(filters.to)
    setSearchDate(filters.departureDate)
    setSearchCategory(filters.category)
  }, [filters.from, filters.to, filters.departureDate, filters.category])

  const swapSearchLocations = () => {
    const temp = searchFrom
    setSearchFrom(searchTo)
    setSearchTo(temp)
  }

  const handleSearchCommit = () => {
    setFilters(prev => ({
      ...prev,
      from: searchFrom,
      to: searchTo,
      departureDate: searchDate,
      category: searchCategory,
      busType: '' // Reset vehicle type to prevent incompatibilities
    }))
    
    // Sync URL search parameters
    const params = {}
    if (searchFrom) params.from = searchFrom
    if (searchTo) params.to = searchTo
    if (searchDate) params.date = searchDate
    if (searchCategory) params.category = searchCategory
    setSearchParams(params)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.busType) count++
    if (filters.departureTime) count++
    if (filters.amenities && filters.amenities.length > 0) {
      count += filters.amenities.length
    }
    const defaultMaxPrice = filters.category === 'city' ? 100000 : 1000000
    const isPriceChanged = filters.priceRange[0] !== 0 || filters.priceRange[1] !== defaultMaxPrice
    if (isPriceChanged) count++
    
    return count
  }

  // Disable Bootstrap styling on this page to let Tailwind render cleanly
  useEffect(() => {
    const bootstrapCss = document.getElementById('bootstrap-css')
    if (bootstrapCss) {
      bootstrapCss.disabled = true
    }
    return () => {
      if (bootstrapCss) {
        bootstrapCss.disabled = false
      }
    }
  }, [])

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

        {/* Premium Horizontal Top Search Bar */}
        <div className="bg-white border border-slate-200/80 shadow-md rounded-[28px] p-4 mb-8 transition-all">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-3">
            
            {/* Origin Stop */}
            <div className="flex-1 min-w-[200px] relative">
              <label className="absolute left-10 top-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Điểm đi</label>
              <div className="relative pt-6 pb-1.5 flex items-center">
                <select 
                  className="w-full pl-10 pr-8 bg-transparent text-sm font-bold text-slate-800 outline-none cursor-pointer appearance-none h-8" 
                  value={searchFrom || ''}
                  onChange={(e) => setSearchFrom(e.target.value)}
                >
                  <option value="">-- Chọn điểm đi --</option>
                  {searchCategory === 'city' 
                    ? CITY_STOPS.map((stop, idx) => <option key={idx} value={stop}>{stop}</option>) 
                    : Array.from(new Set(INTERCITY_ROUTES.map(r => r.from))).map((city, idx) => <option key={idx} value={city}>{city}</option>)}
                </select>
                <FiMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500 text-base" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">▼</span>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex items-center justify-center shrink-0">
              <button
                type="button"
                onClick={swapSearchLocations}
                className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 hover:border-blue-500 hover:text-blue-600 flex items-center justify-center shadow-sm text-slate-500 transition-all hover:scale-105 active:scale-95 lg:rotate-0 rotate-90"
                title="Đổi chiều điểm đi/đến"
              >
                <FiRefreshCw size={13} className="transform rotate-90" />
              </button>
            </div>

            {/* Vertical Divider */}
            <div className="hidden lg:block w-px h-10 bg-slate-200"></div>

            {/* Destination Stop */}
            <div className="flex-1 min-w-[200px] relative">
              <label className="absolute left-10 top-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Điểm đến</label>
              <div className="relative pt-6 pb-1.5 flex items-center">
                <select 
                  className="w-full pl-10 pr-8 bg-transparent text-sm font-bold text-slate-800 outline-none cursor-pointer appearance-none h-8" 
                  value={searchTo || ''}
                  onChange={(e) => setSearchTo(e.target.value)}
                >
                  <option value="">-- Chọn điểm đến --</option>
                  {searchCategory === 'city' 
                    ? CITY_STOPS.map((stop, idx) => <option key={idx} value={stop}>{stop}</option>) 
                    : filters?.from && Array.from(new Set(INTERCITY_ROUTES.filter(r => r.from === filters.from).map(r => r.to))).map((city, idx) => <option key={idx} value={city}>{city}</option>)}
                </select>
                <FiMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500 text-base" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">▼</span>
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="hidden lg:block w-px h-10 bg-slate-200"></div>

            {/* Departure Date */}
            <div className="flex-1 min-w-[180px] relative">
              <label className="absolute left-10 top-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Ngày xuất phát</label>
              <div className="relative pt-6 pb-1.5 flex items-center">
                <input 
                  type="date" 
                  className="w-full pl-10 pr-4 bg-transparent text-sm font-bold text-slate-800 outline-none cursor-pointer h-8" 
                  value={searchDate || ''} 
                  onChange={(e) => setSearchDate(e.target.value)} 
                  min={new Date().toISOString().split('T')[0]} 
                />
                <FiCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500 text-base" />
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="hidden lg:block w-px h-10 bg-slate-200"></div>

            {/* Service Category */}
            <div className="flex-1 min-w-[180px] relative">
              <label className="absolute left-10 top-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Dịch vụ</label>
              <div className="relative pt-6 pb-1.5 flex items-center">
                <select 
                  className="w-full pl-10 pr-8 bg-transparent text-sm font-bold text-slate-800 outline-none cursor-pointer appearance-none h-8" 
                  value={searchCategory || ''}
                  onChange={(e) => {
                    setSearchCategory(e.target.value)
                    setSearchFrom('')
                    setSearchTo('')
                  }}
                >
                  <option value="">Tất cả dịch vụ</option>
                  {Object.entries(BUS_CATEGORIES).map(([key, cat]) => (
                    <option key={key} value={key}>{cat.name}</option>
                  ))}
                </select>
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500 text-base" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">▼</span>
              </div>
            </div>

            {/* Search Action Button */}
            <div className="shrink-0 flex items-center justify-stretch">
              <button
                onClick={handleSearchCommit}
                className="w-full lg:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 transition-all hover:shadow-lg active:scale-95 uppercase tracking-wider text-xs shadow-md h-12"
              >
                <FiSearch /> Tìm kiếm
              </button>
            </div>

          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 xl:gap-10">
          
          {/* Filters Sidebar - Left Column (Desktop) */}
          <div className="hidden lg:block lg:col-span-3">
            <SearchFilters filters={filters} setFilters={setFilters} />
          </div>

          {/* Results - Right Column */}
          <div className="lg:col-span-7">
            


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
                    onSelect={() => {
                      if (!AuthUtil.isAuthenticated()) {
                        alert('Vui lòng đăng nhập để tiếp tục đặt vé!');
                        navigate('/login');
                        return;
                      }
                      navigate(`/booking/${trip.id}`, { state: { trip } });
                    }}
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

      {/* Floating Filter Button (Mobile) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 lg:hidden">
        <button
          onClick={() => setIsMobileFilterOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 border border-blue-500 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-wider"
        >
          <FiFilter size={16} /> 
          <span>Bộ lọc</span>
          {getActiveFiltersCount() > 0 && (
            <span className="w-5 h-5 bg-white text-blue-600 rounded-full flex items-center justify-center text-[10px] font-black">
              {getActiveFiltersCount()}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Filters Drawer */}
      <SearchFilters 
        filters={filters} 
        setFilters={setFilters} 
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
      />
    </div>
  )
}
