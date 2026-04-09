import { useState } from 'react'
import { BUS_TYPES, BUS_CATEGORIES, CITY_STOPS, INTERCITY_ROUTES, DEPARTURE_TIMES } from '../../utils/constants'
import './SearchFilters.css'

export default function SearchFilters({ filters, setFilters }) {
  const [priceMin, setPriceMin] = useState(filters?.priceRange?.[0] || 0)
  const [priceMax, setPriceMax] = useState(filters?.priceRange?.[1] || 50000)
  const [expandedSections, setExpandedSections] = useState({
    busType: true,
    price: true,
    timeSlot: true,
    location: true,
    amenities: true
  })

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

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const filteredBusTypes = filters?.category
    ? Object.entries(BUS_TYPES).filter(([key, bus]) => bus.category === filters.category)
    : Object.entries(BUS_TYPES)

  return (
    // 1. KHUNG BAO NGOÀI: Khóa cứng chiều cao bằng màn hình và cho phép trượt (Sticky)
    <div 
      className="search-filters bg-white shadow-sm" 
      style={{ 
        position: 'sticky', 
        top: '80px', // Khoảng cách so với menu trên cùng (bạn có thể tăng/giảm nếu bị lẹm header)
        height: 'calc(100vh - 100px)', // Giới hạn chiều cao bằng màn hình trừ đi khoảng trống
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: '0.75rem',
        overflow: 'hidden' // Giữ cho các góc bo tròn không bị tràn
      }}
    >
      
      {/* 2. TIÊU ĐỀ (Cố định ở trên) */}
      <div className="p-3 border-bottom bg-white" style={{ zIndex: 10 }}>
        <h5 className="fw-bold mb-0">🔍 Bộ lọc tìm kiếm</h5>
      </div>

      {/* 3. PHẦN BỘ LỌC (Cho phép cuộn nội dung bên trong) */}
      <div 
        className="filters-scroll-container p-3 custom-scrollbar" 
        style={{ 
          flex: 1, 
          overflowY: 'auto' 
        }}
      >
        
        {/* -- Loại Dịch Vụ -- */}
        {!filters?.category && (
          <div className="filter-section mb-4">
            <div 
              className="filter-header d-flex justify-content-between align-items-center"
              onClick={() => toggleSection('category')}
              style={{ cursor: 'pointer' }}
            >
              <h6 className="fw-600 mb-0">📍 Loại dịch vụ</h6>
              <span>{expandedSections.category ? '▼' : '▶'}</span>
            </div>
            
            {expandedSections.category && (
              <div className="mt-3">
                {Object.entries(BUS_CATEGORIES).map(([key, category]) => (
                  <div key={key} className="form-check mb-2">
                    <input
                      className="form-check-input" type="radio" name="category"
                      id={`cat_${key}`} value={key} checked={filters?.category === key}
                      onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    />
                    <label className="form-check-label" htmlFor={`cat_${key}`}>
                      <strong>{category.name}</strong><br/>
                      <small className="text-muted">{category.description}</small>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {filters?.category && (
          <div className="filter-section mb-4 alert alert-light" style={{ borderLeft: '4px solid var(--color-primary-600)' }}>
            <strong>📍 Dịch vụ đã chọn:</strong>
            <div style={{ marginTop: '8px', fontSize: '14px', color: 'var(--color-primary-600)' }}>
              {BUS_CATEGORIES[filters.category]?.name}
            </div>
            <small 
              style={{ cursor: 'pointer', color: 'var(--color-secondary-600)', marginTop: '8px', display: 'block' }}
              onClick={() => setFilters(prev => ({ ...prev, category: '', busType: '', from: '', to: '' }))}
            >
              ↻ Thay đổi dịch vụ
            </small>
          </div>
        )}

        {/* -- Loại Xe -- */}
        <div className="filter-section mb-4 border-top pt-4">
          <div 
            className="filter-header d-flex justify-content-between align-items-center"
            onClick={() => toggleSection('busType')}
            style={{ cursor: 'pointer' }}
          >
            <h6 className="fw-600 mb-0">🚌 Loại xe chi tiết</h6>
            <span>{expandedSections.busType ? '▼' : '▶'}</span>
          </div>
          {expandedSections.busType && (
            <div className="mt-3">
              <div className="row g-2">
                <div className="col-12 mb-1">
                  <div className="form-check">
                    <input
                      className="form-check-input" type="radio" name="busType" id="busType_all"
                      checked={!filters?.busType} onChange={() => setFilters(prev => ({ ...prev, busType: '' }))}
                    />
                    <label className="form-check-label" htmlFor="busType_all" style={{ fontSize: '0.9rem' }}>Tất cả loại xe</label>
                  </div>
                </div>
                {filteredBusTypes.map(([key, busType]) => (
                  <div className="col-6" key={key}>
                    <div className="form-check">
                      <input
                        className="form-check-input" type="radio" name="busType" id={`busType_${key}`}
                        checked={filters?.busType === key} onChange={() => setFilters(prev => ({ ...prev, busType: key }))}
                      />
                      <label className="form-check-label" htmlFor={`busType_${key}`} style={{ fontSize: '0.85rem' }}>
                        <span className="d-block fw-medium">{busType.name}</span>
                        <small className="text-muted">{busType.seats} ghế {busType.standing ? `(+${busType.standing})` : ''}</small>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* -- Ngày xuất phát -- */}
        <div className="filter-section mb-4 border-top pt-4">
          <div className="filter-header d-flex justify-content-between align-items-center" onClick={() => toggleSection('date')} style={{ cursor: 'pointer' }}>
            <h6 className="fw-600 mb-0">📅 Ngày xuất phát</h6>
            <span>{expandedSections.date ? '▼' : '▶'}</span>
          </div>
          {expandedSections.date && (
            <div className="mt-3">
              <input type="date" className="form-control form-input mb-2" value={filters?.departureDate || ''} onChange={(e) => setFilters(prev => ({ ...prev, departureDate: e.target.value }))} min={new Date().toISOString().split('T')[0]} />
            </div>
          )}
        </div>

        {/* -- Điểm đi/đến -- */}
        <div className="filter-section mb-4 border-top pt-4">
          <div className="filter-header d-flex justify-content-between align-items-center" onClick={() => toggleSection('location')} style={{ cursor: 'pointer' }}>
            <h6 className="fw-600 mb-0">🗺️ Điểm đi/đến</h6>
            <span>{expandedSections.location ? '▼' : '▶'}</span>
          </div>
          {expandedSections.location && (
            <div className="mt-3">
              <div className="mb-3">
                <label className="small text-muted mb-2 d-block">Điểm đi</label>
                <select className="form-control form-input" value={filters?.from || ''} onChange={(e) => setFilters(prev => ({ ...prev, from: e.target.value }))}>
                  <option value="">-- Tất cả điểm đi --</option>
                  {filters?.category === 'city' ? CITY_STOPS.map((stop, idx) => <option key={idx} value={stop}>{stop}</option>) : Array.from(new Set(INTERCITY_ROUTES.map(r => r.from))).map((city, idx) => <option key={idx} value={city}>{city}</option>)}
                </select>
              </div>
              <div>
                <label className="small text-muted mb-2 d-block">Điểm đến</label>
                <select className="form-control form-input" value={filters?.to || ''} onChange={(e) => setFilters(prev => ({ ...prev, to: e.target.value }))}>
                  <option value="">-- Tất cả điểm đến --</option>
                  {filters?.category === 'city' ? CITY_STOPS.map((stop, idx) => <option key={idx} value={stop}>{stop}</option>) : filters?.from && Array.from(new Set(INTERCITY_ROUTES.filter(r => r.from === filters.from).map(r => r.to))).map((city, idx) => <option key={idx} value={city}>{city}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* -- Giá vé -- */}
        <div className="filter-section mb-4 border-top pt-4">
          <div className="filter-header d-flex justify-content-between align-items-center" onClick={() => toggleSection('price')} style={{ cursor: 'pointer' }}>
            <h6 className="fw-600 mb-0">💰 Giá vé</h6>
            <span>{expandedSections.price ? '▼' : '▶'}</span>
          </div>
          {expandedSections.price && (
            <div className="price-inputs mt-3">
              <div className="row g-2">
                <div className="col-6 mb-2">
                  <label className="small text-muted mb-1 d-block" style={{ fontSize: '0.8rem' }}>Từ</label>
                  <input type="number" className="form-control form-input" value={priceMin} onChange={(e) => setPriceMin(Number(e.target.value))} min="0" max="50000" step="5000" />
                </div>
                <div className="col-6 mb-2">
                  <label className="small text-muted mb-1 d-block" style={{ fontSize: '0.8rem' }}>Đến</label>
                  <input type="number" className="form-control form-input" value={priceMax} onChange={(e) => { const val = Number(e.target.value); setPriceMax(val > 50000 ? 50000 : val); }} min="0" max="50000" step="5000" />
                </div>
              </div>
              <button onClick={handlePriceChange} className="btn btn-sm w-100 mt-1" style={{ backgroundColor: 'var(--color-primary-600)', color: 'white', border: 'none' }}>Áp dụng</button>
              <div className="price-range-display mt-2">
                <small className="text-muted d-block text-center">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(filters?.priceRange?.[0] || 0)} - {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(filters?.priceRange?.[1] || 50000)}
                </small>
              </div>
            </div>
          )}
        </div>

        {/* -- Giờ khởi hành -- */}
        <div className="filter-section mb-4 border-top pt-4">
          <div className="filter-header d-flex justify-content-between align-items-center" onClick={() => toggleSection('timeSlot')} style={{ cursor: 'pointer' }}>
            <h6 className="fw-600 mb-0">⏰ Giờ khởi hành</h6>
            <span>{expandedSections.timeSlot ? '▼' : '▶'}</span>
          </div>
          {expandedSections.timeSlot && (
            <div className="mt-3">
              <div className="row g-2">
                <div className="col-12 mb-1">
                   <div className="form-check">
                    <input className="form-check-input" type="radio" name="timeSlot" id="timeSlot_all" checked={!filters?.departureTime} onChange={() => setFilters(prev => ({ ...prev, departureTime: '' }))} />
                    <label className="form-check-label" htmlFor="timeSlot_all" style={{ fontSize: '0.9rem' }}>Tất cả các giờ</label>
                  </div>
                </div>
                {Object.entries(DEPARTURE_TIMES).map(([key, time]) => (
                  <div className="col-6" key={key}>
                    <div className="form-check">
                      <input className="form-check-input" type="radio" name="timeSlot" id={`timeSlot_${key}`} checked={filters?.departureTime === key} onChange={() => setFilters(prev => ({ ...prev, departureTime: key }))} />
                      <label className="form-check-label" htmlFor={`timeSlot_${key}`} style={{ fontSize: '0.85rem' }}>{time.start} - {time.end}</label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* -- Tiện nghi -- */}
        <div className="filter-section border-top pt-4">
          <div className="filter-header d-flex justify-content-between align-items-center" onClick={() => toggleSection('amenities')} style={{ cursor: 'pointer' }}>
            <h6 className="fw-600 mb-0">✨ Tiện nghi</h6>
            <span>{expandedSections.amenities ? '▼' : '▶'}</span>
          </div>
          {expandedSections.amenities && (
            <div className="mt-3">
              {amenitiesOptions.map(amenity => (
                <div key={amenity.id} className="form-check mb-2">
                  <input className="form-check-input" type="checkbox" id={amenity.id} checked={filters?.amenities?.includes(amenity.id) || false} onChange={() => handleAmenityChange(amenity.id)} />
                  <label className="form-check-label" htmlFor={amenity.id}>{amenity.label}</label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ghi chú */}
        <div className="alert alert-info mt-4 mb-2" role="alert">
          <small>
            <strong>ℹ️ Lưu ý:</strong> BusGo là một công ty vận tải độc lập cung cấp các dịch vụ xe nội thành và ngoại thành tại Đà Nẵng.
          </small>
        </div>
      </div> 

      {/* 4. NÚT ĐẶT LẠI (CỐ ĐỊNH Ở ĐÁY, KHÔNG BAO GIỜ BỊ CUỘN MẤT) */}
      <div 
        className="p-3 bg-white border-top" 
        style={{ 
          marginTop: 'auto', // Đẩy thẻ này xuống dưới cùng
          zIndex: 10 // Đảm bảo luôn nằm trên các nội dung cuộn
        }}
      >
        <button
          onClick={() => {
            setFilters({
              priceRange: [0, 50000], amenities: [], busType: '', departureTime: '', category: '', from: '', to: '', departureDate: ''
            })
            setPriceMin(0); setPriceMax(50000)
          }}
          className="btn w-100 fw-medium shadow-sm"
          style={{ backgroundColor: 'var(--color-primary-600)', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '0.5rem' }}
        >
          ↺ Đặt lại tất cả bộ lọc
        </button>
      </div>

    </div>
  )
}