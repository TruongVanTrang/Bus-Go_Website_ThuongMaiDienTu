import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import TripCard from '../components/search/TripCard'
import SearchFilters from '../components/search/SearchFilters'
import { BUS_TYPES } from '../utils/constants'
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

  // Mock data - In real app, fetch from API
  useEffect(() => {
    const mockTrips = [
      {
        id: 1,
        from: searchParams.get('from') || 'Hà Nội',
        to: searchParams.get('to') || 'Sài Gòn',
        date: searchParams.get('date') || '2024-01-15',
        departureTime: '05:00',
        arrivalTime: '14:30',
        duration: '9h 30m',
        busType: 'bus',
        seatsAvailable: 25,
        totalSeats: 45,
        price: 250000,
        operator: 'BusGo',
        amenities: ['AC', 'Wifi', 'Phone Charger'],
        rating: 4.5
      },
      {
        id: 2,
        from: searchParams.get('from') || 'Hà Nội',
        to: searchParams.get('to') || 'Sài Gòn',
        date: searchParams.get('date') || '2024-01-15',
        departureTime: '07:30',
        arrivalTime: '17:00',
        duration: '9h 30m',
        busType: 'minibus',
        seatsAvailable: 8,
        totalSeats: 16,
        price: 450000,
        operator: 'BusGo',
        amenities: ['AC', 'Wifi', 'Phone Charger', 'Blanket'],
        rating: 4.8
      },
      {
        id: 3,
        from: searchParams.get('from') || 'Hà Nội',
        to: searchParams.get('to') || 'Sài Gòn',
        date: searchParams.get('date') || '2024-01-15',
        departureTime: '09:00',
        arrivalTime: '18:30',
        duration: '9h 30m',
        busType: 'bus',
        seatsAvailable: 15,
        totalSeats: 45,
        price: 280000,
        operator: 'BusGo',
        amenities: ['AC', 'Wifi', 'Phone Charger', 'Toilet'],
        rating: 4.6
      },
      {
        id: 4,
        from: searchParams.get('from') || 'Hà Nội',
        to: searchParams.get('to') || 'Sài Gòn',
        date: searchParams.get('date') || '2024-01-15',
        departureTime: '10:30',
        arrivalTime: '20:00',
        duration: '9h 30m',
        busType: 'minibus',
        seatsAvailable: 12,
        totalSeats: 16,
        price: 480000,
        operator: 'BusGo',
        amenities: ['AC', 'Wifi', 'Phone Charger', 'Blanket'],
        rating: 4.7
      },
      {
        id: 5,
        from: searchParams.get('from') || 'Hà Nội',
        to: searchParams.get('to') || 'Sài Gòn',
        date: searchParams.get('date') || '2024-01-15',
        departureTime: '14:00',
        arrivalTime: '23:30',
        duration: '9h 30m',
        busType: 'bus',
        seatsAvailable: 8,
        totalSeats: 45,
        price: 200000,
        operator: 'BusGo',
        amenities: ['AC'],
        rating: 4.0
      },
      {
        id: 6,
        from: searchParams.get('from') || 'Hà Nội',
        to: searchParams.get('to') || 'Sài Gòn',
        date: searchParams.get('date') || '2024-01-15',
        departureTime: '16:30',
        arrivalTime: '02:00',
        duration: '9h 30m',
        busType: 'bus',
        seatsAvailable: 32,
        totalSeats: 45,
        price: 220000,
        operator: 'BusGo',
        amenities: ['AC', 'Blanket'],
        rating: 4.4
      },
      {
        id: 7,
        from: searchParams.get('from') || 'Hà Nội',
        to: searchParams.get('to') || 'Sài Gòn',
        date: searchParams.get('date') || '2024-01-15',
        departureTime: '18:00',
        arrivalTime: '03:30',
        duration: '9h 30m',
        busType: 'bus',
        seatsAvailable: 38,
        totalSeats: 45,
        price: 180000,
        operator: 'BusGo',
        amenities: ['AC', 'Pillow & Blanket', 'Toilet'],
        rating: 4.3
      },
      {
        id: 8,
        from: searchParams.get('from') || 'Hà Nội',
        to: searchParams.get('to') || 'Sài Gòn',
        date: searchParams.get('date') || '2024-01-15',
        departureTime: '20:00',
        arrivalTime: '05:30',
        duration: '9h 30m',
        busType: 'minibus',
        seatsAvailable: 5,
        totalSeats: 16,
        price: 520000,
        operator: 'BusGo',
        amenities: ['AC', 'Wifi', 'Phone Charger', 'Blanket', 'Toilet'],
        rating: 4.9
      },
      {
        id: 9,
        from: searchParams.get('from') || 'Hà Nội',
        to: searchParams.get('to') || 'Sài Gòn',
        date: searchParams.get('date') || '2024-01-15',
        departureTime: '22:00',
        arrivalTime: '07:30',
        duration: '9h 30m',
        busType: 'bus',
        seatsAvailable: 35,
        totalSeats: 45,
        price: 190000,
        operator: 'BusGo',
        amenities: ['AC', 'Pillow & Blanket'],
        rating: 4.2
      },
      {
        id: 10,
        from: searchParams.get('from') || 'Hà Nội',
        to: searchParams.get('to') || 'Sài Gòn',
        date: searchParams.get('date') || '2024-01-15',
        departureTime: '23:30',
        arrivalTime: '09:00',
        duration: '9h 30m',
        busType: 'bus',
        seatsAvailable: 42,
        totalSeats: 45,
        price: 170000,
        operator: 'BusGo',
        amenities: ['AC'],
        rating: 4.1
      }
    ]
    
    setTrips(mockTrips)
    setFilteredTrips(mockTrips)
  }, [searchParams])

  // Apply filters
  useEffect(() => {
    let filtered = trips.filter(trip => {
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
                    onSelect={() => navigate(`/booking/${trip.id}`)}
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
