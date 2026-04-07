import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import TripCard from '../components/search/TripCard'
import SearchFilters from '../components/search/SearchFilters'
import './SearchResultsPage.css'

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [filteredTrips, setFilteredTrips] = useState([])
  const [filters, setFilters] = useState({
    priceRange: [0, 2000000],
    amenities: [],
    busType: 'all',
    departureTime: 'all'
  })

  // Mock data - In real app, fetch from API
  useEffect(() => {
    const mockTrips = [
      {
        id: 1,
        from: searchParams.get('from') || 'Hà Nội',
        to: searchParams.get('to') || 'Sài Gòn',
        date: searchParams.get('date') || '2024-01-15',
        departureTime: '08:00',
        arrivalTime: '17:30',
        duration: '9h 30m',
        busType: 'bus',
        seatsAvailable: 25,
        totalSeats: 45,
        price: 250000,
        operator: 'BusGo Express',
        amenities: ['AC', 'Wifi', 'Phone Charger'],
        rating: 4.5
      },
      {
        id: 2,
        from: searchParams.get('from') || 'Hà Nội',
        to: searchParams.get('to') || 'Sài Gòn',
        date: searchParams.get('date') || '2024-01-15',
        departureTime: '10:30',
        arrivalTime: '20:00',
        duration: '9h 30m',
        busType: 'minibus',
        seatsAvailable: 12,
        totalSeats: 16,
        price: 450000,
        operator: 'Premium Minibus',
        amenities: ['AC', 'Wifi', 'Phone Charger', 'Blanket'],
        rating: 4.8
      },
      {
        id: 3,
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
        operator: 'BusGo Economy',
        amenities: ['AC'],
        rating: 4.0
      },
      {
        id: 4,
        from: searchParams.get('from') || 'Hà Nội',
        to: searchParams.get('to') || 'Sài Gòn',
        date: searchParams.get('date') || '2024-01-15',
        departureTime: '22:00',
        arrivalTime: '07:30',
        duration: '9h 30m',
        busType: 'bus',
        seatsAvailable: 35,
        totalSeats: 45,
        price: 180000,
        operator: 'Night Express',
        amenities: ['AC', 'Pillow & Blanket'],
        rating: 4.3
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

      // Bus type filter
      if (filters.busType !== 'all' && trip.busType !== filters.busType) {
        return false
      }

      // Amenities filter
      if (filters.amenities.length > 0) {
        const hasAllAmenities = filters.amenities.every(amenity =>
          trip.amenities.includes(amenity)
        )
        if (!hasAllAmenities) {
          return false
        }
      }

      // Departure time filter
      if (filters.departureTime !== 'all') {
        const hour = parseInt(trip.departureTime.split(':')[0])
        if (filters.departureTime === 'morning' && (hour < 6 || hour >= 12)) {
          return false
        }
        if (filters.departureTime === 'afternoon' && (hour < 12 || hour >= 18)) {
          return false
        }
        if (filters.departureTime === 'evening' && (hour < 18 || hour >= 24)) {
          return false
        }
        if (filters.departureTime === 'night' && (hour < 22 || hour < 6)) {
          return false
        }
      }

      return true
    })

    setFilteredTrips(filtered)
  }, [filters, trips])

  return (
    <div className="search-results-page">
      <div className="container-fluid px-md-5 px-3 py-5">
        <div className="row gap-4">
          {/* Filters Sidebar */}
          <div className="col-lg-3 order-lg-1 order-2">
            <SearchFilters filters={filters} setFilters={setFilters} />
          </div>

          {/* Results */}
          <div className="col-lg-9 order-lg-2 order-1">
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
              <div className="alert alert-info text-center py-5">
                <h5>Không tìm thấy chuyến xe phù hợp</h5>
                <p className="text-muted mb-0">
                  Hãy thử thay đổi các bộ lọc hoặc tiêu chí tìm kiếm
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
