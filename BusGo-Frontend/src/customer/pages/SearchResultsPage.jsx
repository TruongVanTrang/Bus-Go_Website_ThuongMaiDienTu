import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import TripCard from '../../components/search/TripCard'
import SearchFilters from '../../components/search/SearchFilters'
import { BUS_TYPES } from '../../utils/constants'
import { searchTrips } from '../../services/tripService'
import './SearchResultsPage.css'

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

  // (Hooks removed to prevent infinite re-rendering loops)
  // Filters state is now managed purely internally and initialized from router state/searchParams on mount.

  // Fetch matching trips from backend API when core filters change
  useEffect(() => {
    const fetchTrips = async () => {
      setLoading(true)
      setError(null)
      try {
        const from = filters.from || ''
        const to = filters.to || ''
        const date = filters.departureDate || ''
        const category = filters.category || ''

        const data = await searchTrips(from, to, date, category)
        setTrips(data)
      } catch (err) {
        console.error('Error fetching trips:', err)
        setError(err.message || 'Lỗi kết nối máy chủ khi tìm kiếm chuyến xe')
      } finally {
        setLoading(false)
      }
    }

    fetchTrips()
  }, [filters.from, filters.to, filters.departureDate, filters.category])

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
      // Core route verification (safeguard)
      if (filters.from && trip.from !== filters.from) {
        return false
      }
      if (filters.to && trip.to !== filters.to) {
        return false
      }

      // Price filter
      if (trip.price < filters.priceRange[0] || trip.price > filters.priceRange[1]) {
        return false
      }

      // Bus type filter
      if (filters.busType && filters.busType !== '') {
        if (trip.busType !== filters.busType) {
          return false
        }
      }

      // Amenities filter
      if (filters.amenities && filters.amenities.length > 0) {
        const hasAllAmenities = filters.amenities.every(amenity =>
          trip.amenities.includes(amenity)
        )
        if (!hasAllAmenities) {
          return false
        }
      }

      // Departure time filter - Categorized slots
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
            if (hour < range.start || hour >= range.end) {
              return false
            }
          } else {
            // Night time (22:00-04:00)
            if (hour < range.start && hour >= range.end) {
              return false
            }
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
    <div className="search-results-page">
      <div className="container-fluid px-md-5 px-3 pb-5 pt-3">
        <div className="row g-4">
          {/* Filters Sidebar - Left Column */}
          <div className="col-md-3">
            <div className="sticky-top" style={{ top: '80px' }}>
              <SearchFilters filters={filters} setFilters={setFilters} />
            </div>
          </div>

          {/* Results - Right Column */}
          <div className="col-md-9">
            <div className="mb-4">
              <h2 className="text-neutral-900 fw-bold">
                Kết quả tìm kiếm
              </h2>
              <p className="text-muted">
                {loading ? 'Đang tải dữ liệu...' : `${filteredTrips.length} chuyến xe được tìm thấy`}
              </p>
            </div>

            {loading ? (
              <div className="d-flex flex-column align-items-center justify-content-center py-5">
                <div className="spinner-border mb-3" role="status" style={{ width: '3rem', height: '3rem', color: 'var(--color-primary-600)' }}>
                  <span className="visually-hidden">Đang tải...</span>
                </div>
                <h5 className="text-muted">Đang tìm kiếm chuyến xe tốt nhất cho bạn...</h5>
              </div>
            ) : error ? (
              <div className="alert alert-danger text-center py-5">
                <h5 className="mb-3">⚠️ Đã xảy ra lỗi</h5>
                <p className="text-muted">{error}</p>
              </div>
            ) : filteredTrips.length > 0 ? (
              <div className="d-flex flex-column gap-3">
                {filteredTrips.map(trip => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    onSelect={() => navigate(`/booking/${trip.id}`, { state: { trip } })}
                  />
                ))}
              </div>
            ) : (
              <div className="alert alert-warning text-center py-5">
                <h5 className="mb-3">
                  <span style={{ fontSize: '24px', marginRight: '8px' }}>🔍</span>
                  Không tìm thấy chuyến xe phù hợp
                </h5>
                <p className="text-muted mb-4">
                  Hãy thử thay đổi các bộ lọc hoặc tiêu chí tìm kiếm khác
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
                  className="btn"
                  style={{
                    backgroundColor: 'var(--color-primary-600)',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 2rem',
                    fontWeight: '600'
                  }}
                >
                  ↺ Làm mới các bộ lọc
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
