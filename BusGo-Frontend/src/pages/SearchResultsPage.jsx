import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import TripCard from '../components/search/TripCard'
import SearchFilters from '../components/search/SearchFilters'
import { BUS_TYPES } from '../utils/constants'
import { mockTrips } from '../utils/mockData'
import './SearchResultsPage.css'

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [filteredTrips, setFilteredTrips] = useState([])
  const [filters, setFilters] = useState({
    priceRange: [0, 500000],
    amenities: [],
    busType: '',
    departureTime: '',
    category: searchParams.get('category') || '',
    from: searchParams.get('from') || '',
    to: searchParams.get('to') || '',
    departureDate: searchParams.get('date') || ''
  })

  // Load trips directly from mockData
  useEffect(() => {
    console.log('Loading trips from mockData...')
    console.log('Total trips:', mockTrips.length)
    setTrips(mockTrips)
    setFilteredTrips(mockTrips)
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = trips.filter(trip => {
      // Filter by exact route (from, to)
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

      // Bus type filter - Map từ busType ID sang trip.busType
      if (filters.busType && filters.busType !== '') {
        // Get bus type info từ BUS_TYPES
        const selectedBusType = Object.values(BUS_TYPES).find(bt => bt.id === filters.busType)
        if (selectedBusType && trip.busType !== selectedBusType.busType) {
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

      // Departure time filter - Chi tiết theo mốc thời gian
      if (filters.departureTime && filters.departureTime !== '') {
        const hour = parseInt(trip.departureTime.split(':')[0])
        const minute = parseInt(trip.departureTime.split(':')[1])
        
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

  return (
    <div className="search-results-page">
      <div className="container-fluid px-md-5 px-3 py-5">
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
                {filteredTrips.length} chuyến xe được tìm thấy
              </p>
            </div>

            {filteredTrips.length > 0 ? (
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
                  Hãy thử thay đổi các bộ lọc hoặc tiêu chí tìm kiếm
                </p>
                <button
                  onClick={() => {
                    setFilters({
                      priceRange: [0, 500000],
                      amenities: [],
                      busType: '',
                      departureTime: '',
                      category: '',
                      from: '',
                      to: '',
                      departureDate: ''
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
