import { useState } from 'react'
import './SearchFilters.css'

export default function SearchFilters({ filters, setFilters }) {
  const [priceMin, setPriceMin] = useState(0)
  const [priceMax, setPriceMax] = useState(2000000)

  const amenitiesOptions = [
    { id: 'AC', label: 'AC (Điều hòa)' },
    { id: 'Wifi', label: 'WiFi miễn phí' },
    { id: 'Phone Charger', label: 'Cổng sạc điện thoại' },
    { id: 'Blanket', label: 'Chăn, gối' },
    { id: 'Toilet', label: 'Nhà vệ sinh' }
  ]

  const handleAmenityChange = (amenity) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }))
  }

  const handlePriceChange = () => {
    setFilters(prev => ({
      ...prev,
      priceRange: [priceMin, priceMax]
    }))
  }

  return (
    <div className="search-filters">
      <div className="filters-sticky">
        <h5 className="fw-bold mb-4">Bộ lọc</h5>

        {/* Price Range Filter */}
        <div className="filter-section mb-4">
          <h6 className="fw-600 mb-3">Giá vé</h6>
          
          <div className="price-inputs mb-3">
            <div className="mb-2">
              <label className="small text-muted mb-1">Giá tối thiểu</label>
              <input
                type="number"
                className="form-control form-input"
                value={priceMin}
                onChange={(e) => setPriceMin(Number(e.target.value))}
                min="0"
                step="50000"
              />
            </div>
            <div className="mb-2">
              <label className="small text-muted mb-1">Giá tối đa</label>
              <input
                type="number"
                className="form-control form-input"
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                min="0"
                step="50000"
              />
            </div>
            <button
              onClick={handlePriceChange}
              className="btn btn-sm w-100 mt-2"
              style={{
                backgroundColor: 'var(--color-primary-600)',
                color: 'white',
                border: 'none'
              }}
            >
              Áp dụng
            </button>
          </div>

          <div className="price-range-display">
            <div className="small text-muted">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(filters.priceRange[0])}
              {' - '}
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(filters.priceRange[1])}
            </div>
          </div>
        </div>

        {/* Bus Type Filter */}
        <div className="filter-section mb-4 border-top pt-4">
          <h6 className="fw-600 mb-3">Loại xe</h6>
          <div className="form-check mb-2">
            <input
              className="form-check-input"
              type="radio"
              name="busType"
              id="busAll"
              value="all"
              checked={filters.busType === 'all'}
              onChange={(e) => setFilters(prev => ({ ...prev, busType: e.target.value }))}
            />
            <label className="form-check-label" htmlFor="busAll">
              Tất cả loại xe
            </label>
          </div>
          <div className="form-check mb-2">
            <input
              className="form-check-input"
              type="radio"
              name="busType"
              id="busBus"
              value="bus"
              checked={filters.busType === 'bus'}
              onChange={(e) => setFilters(prev => ({ ...prev, busType: e.target.value }))}
            />
            <label className="form-check-label" htmlFor="busBus">
              Xe Bus
            </label>
          </div>
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              name="busType"
              id="busMinibus"
              value="minibus"
              checked={filters.busType === 'minibus'}
              onChange={(e) => setFilters(prev => ({ ...prev, busType: e.target.value }))}
            />
            <label className="form-check-label" htmlFor="busMinibus">
              Xe 4-35 chỗ
            </label>
          </div>
        </div>

        {/* Amenities Filter */}
        <div className="filter-section mb-4 border-top pt-4">
          <h6 className="fw-600 mb-3">Tiện nghi</h6>
          {amenitiesOptions.map(amenity => (
            <div key={amenity.id} className="form-check mb-2">
              <input
                className="form-check-input"
                type="checkbox"
                id={amenity.id}
                checked={filters.amenities.includes(amenity.id)}
                onChange={() => handleAmenityChange(amenity.id)}
              />
              <label className="form-check-label" htmlFor={amenity.id}>
                {amenity.label}
              </label>
            </div>
          ))}
        </div>

        {/* Departure Time Filter */}
        <div className="filter-section border-top pt-4">
          <h6 className="fw-600 mb-3">Giờ khởi hành</h6>
          <div className="form-check mb-2">
            <input
              className="form-check-input"
              type="radio"
              name="departureTime"
              id="timeAll"
              value="all"
              checked={filters.departureTime === 'all'}
              onChange={(e) => setFilters(prev => ({ ...prev, departureTime: e.target.value }))}
            />
            <label className="form-check-label" htmlFor="timeAll">
              Tất cả thời gian
            </label>
          </div>
          <div className="form-check mb-2">
            <input
              className="form-check-input"
              type="radio"
              name="departureTime"
              id="timeMorning"
              value="morning"
              checked={filters.departureTime === 'morning'}
              onChange={(e) => setFilters(prev => ({ ...prev, departureTime: e.target.value }))}
            />
            <label className="form-check-label" htmlFor="timeMorning">
              Buổi sáng (6h - 12h)
            </label>
          </div>
          <div className="form-check mb-2">
            <input
              className="form-check-input"
              type="radio"
              name="departureTime"
              id="timeAfternoon"
              value="afternoon"
              checked={filters.departureTime === 'afternoon'}
              onChange={(e) => setFilters(prev => ({ ...prev, departureTime: e.target.value }))}
            />
            <label className="form-check-label" htmlFor="timeAfternoon">
              Buổi chiều (12h - 18h)
            </label>
          </div>
          <div className="form-check mb-2">
            <input
              className="form-check-input"
              type="radio"
              name="departureTime"
              id="timeEvening"
              value="evening"
              checked={filters.departureTime === 'evening'}
              onChange={(e) => setFilters(prev => ({ ...prev, departureTime: e.target.value }))}
            />
            <label className="form-check-label" htmlFor="timeEvening">
              Buổi tối (18h - 22h)
            </label>
          </div>
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              name="departureTime"
              id="timeNight"
              value="night"
              checked={filters.departureTime === 'night'}
              onChange={(e) => setFilters(prev => ({ ...prev, departureTime: e.target.value }))}
            />
            <label className="form-check-label" htmlFor="timeNight">
              Đêm (22h - 6h)
            </label>
          </div>
        </div>

        {/* Reset Filters */}
        <button
          onClick={() => {
            setFilters({
              priceRange: [0, 2000000],
              amenities: [],
              busType: 'all',
              departureTime: 'all'
            })
            setPriceMin(0)
            setPriceMax(2000000)
          }}
          className="btn btn-outline-secondary w-100 mt-4"
          style={{
            color: 'var(--color-primary-600)',
            borderColor: 'var(--color-primary-600)'
          }}
        >
          Đặt lại bộ lọc
        </button>
      </div>
    </div>
  )
}
