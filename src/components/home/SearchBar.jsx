import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiMapPin, FiCalendar, FiChevronRight } from 'react-icons/fi'
import { MdDirectionsBus } from 'react-icons/md'
import { BUS_CATEGORIES, BUS_TYPES, CITY_STOPS, INTERCITY_ROUTES, DEPARTURE_TIMES } from '../../utils/constants'
import './SearchBar.css'

export default function SearchBar() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // Step 1: Category, Step 2: Bus Type, Step 3: Route
  const [formData, setFormData] = useState({
    category: '',
    busType: '',
    from: '',
    to: '',
    date: '',
    departureTime: ''
  })

  // Get available bus types for selected category
  const busList = useMemo(() => {
    if (!formData.category) return []
    return Object.values(BUS_TYPES).filter(bus => bus.category === formData.category)
  }, [formData.category])

  // Get available destinations based on category
  const destinations = useMemo(() => {
    if (formData.category === 'city') {
      return CITY_STOPS
    } else if (formData.category === 'interCity') {
      return INTERCITY_ROUTES.map(route => ({ from: route.from, to: route.to }))
    }
    return []
  }, [formData.category])

  const handleCategorySelect = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      category: categoryId,
      busType: '',
      from: '',
      to: '',
      date: '',
      departureTime: ''
    }))
    setStep(2)
  }

  const handleBusTypeSelect = (busTypeId) => {
    setFormData(prev => ({
      ...prev,
      busType: busTypeId
    }))
    setStep(3)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSearch = (e) => {
    e.preventDefault()
    
    // Validate form
    if (!formData.from || !formData.to || !formData.date || !formData.category) {
      alert('Vui lòng điền đầy đủ thông tin')
      return
    }

    // Navigate to search results
    const params = new URLSearchParams(formData)
    navigate(`/search?${params.toString()}`)
  }

  const getCategoryIcon = (categoryId) => {
    return BUS_CATEGORIES[categoryId]?.icon || '🚌'
  }

  return (
    <div className="search-bar-container">
      <div className="search-bar-content">
        <h1 className="search-bar-title mb-4" style={{ color: '#FFFFFF' }}>
          Tìm và đặt vé xe thông minh dễ dàng
        </h1>
        <p className="search-bar-subtitle mb-4" style={{ color: '#FFFFFF' }}>
          Khám phá các tuyến xe nội - ngoại thành Đà Nẵng của chúng tôi - BusGo
        </p>

        {/* Step 1: Select Bus Category */}
        {step === 1 && (
          <div className="search-step-section">
            <h4 className="text-white mb-4">
              <span style={{ fontSize: '16px', fontWeight: '600' }}>Bước 1:</span> Chọn loại dịch vụ
            </h4>
            <div className="bus-category-selector">
              {Object.entries(BUS_CATEGORIES).map(([key, category]) => (
                <div
                  key={key}
                  className="category-card"
                  onClick={() => handleCategorySelect(key)}
                  style={{
                    padding: '20px',
                    margin: '10px',
                    border: '2px solid #FFC107',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: '#FFFFFF',
                    color: '#333333',
                    transition: 'all 0.3s ease',
                    flex: '1',
                    minWidth: '200px',
                    textAlign: 'center',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFF9E6'
                    e.currentTarget.style.borderColor = '#FF8C00'
                    e.currentTarget.style.transform = 'translateY(-8px)'
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF'
                    e.currentTarget.style.borderColor = '#FFC107'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>🚌</div>
                  <h5 style={{ marginBottom: '8px', fontWeight: '700', color: '#0066cc' }}>{category.name}</h5>
                  <p style={{ fontSize: '13px', opacity: '0.85', marginBottom: '0', color: '#666666' }}>
                    {category.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Bus Type */}
        {step === 2 && (
          <div className="search-step-section">
            <h4 className="text-white mb-4">
              <span 
                style={{ cursor: 'pointer', fontSize: '14px', opacity: '0.7' }}
                onClick={() => setStep(1)}
              >
                ← Quay lại
              </span>
              <span style={{ fontSize: '16px', fontWeight: '600', marginLeft: '10px' }}>
                Bước 2: Chọn loại xe - {BUS_CATEGORIES[formData.category]?.name}
              </span>
            </h4>
            <div className="bus-type-selector" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              {busList.map(bus => (
                <div
                  key={bus.id}
                  className="bus-type-card"
                  onClick={() => handleBusTypeSelect(bus.id)}
                  style={{
                    padding: '20px',
                    border: '2px solid #FFC107',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: '#FFFFFF',
                    color: '#333333',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFF9E6'
                    e.currentTarget.style.borderColor = '#FF8C00'
                    e.currentTarget.style.transform = 'translateY(-8px)'
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF'
                    e.currentTarget.style.borderColor = '#FFC107'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>{bus.icon}</div>
                  <h6 style={{ marginBottom: '5px', fontWeight: '700', fontSize: '14px', color: '#0066cc' }}>{bus.name}</h6>
                  <p style={{ fontSize: '12px', color: '#666666', marginBottom: '5px' }}>
                    {bus.seats} chỗ ngồi{bus.standing && `, ${bus.standing} chỗ đứng`}
                  </p>
                  {bus.description && (
                    <p style={{ fontSize: '11px', color: '#999999', marginTop: '5px' }}>{bus.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Route and Details */}
        {step === 3 && (
          <form onSubmit={handleSearch} className="search-form">
            <div style={{ marginBottom: '15px' }}>
              <p 
                style={{ 
                  cursor: 'pointer', 
                  fontSize: '14px', 
                  opacity: '0.7', 
                  color: 'blue',
                  marginBottom: '10px'
                }}
                onClick={() => setStep(2)}
              >
                ← Quay lại chọn loại xe
              </p>
              <p style={{ color: 'blue', fontSize: '12px', opacity: '0.9' }}>
                <strong>Đã chọn:</strong> {BUS_CATEGORIES[formData.category]?.name} - {BUS_TYPES[formData.busType]?.name}
              </p>
            </div>

            <div className="row g-3">
              {/* From */}
              <div className="col-lg-3 col-md-6">
                <div className="search-input-group">
                  <label className="form-label fw-600 mb-2">
                    <FiMapPin className="me-2" />
                    Điểm đi
                  </label>
                  {formData.category === 'city' ? (
                    <select
                      className="form-control form-input"
                      name="from"
                      value={formData.from}
                      onChange={handleChange}
                    >
                      <option value="">-- Chọn điểm đi --</option>
                      {CITY_STOPS.map((stop, idx) => (
                        <option key={idx} value={stop}>{stop}</option>
                      ))}
                    </select>
                  ) : (
                    <select
                      className="form-control form-input"
                      name="from"
                      value={formData.from}
                      onChange={handleChange}
                    >
                      <option value="">-- Chọn điểm đi --</option>
                      {Array.from(new Set(INTERCITY_ROUTES.map(r => r.from))).map((city, idx) => (
                        <option key={idx} value={city}>{city}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* To */}
              <div className="col-lg-3 col-md-6">
                <div className="search-input-group">
                  <label className="form-label fw-600 mb-2">
                    <FiMapPin className="me-2" />
                    Điểm đến
                  </label>
                  {formData.category === 'city' ? (
                    <select
                      className="form-control form-input"
                      name="to"
                      value={formData.to}
                      onChange={handleChange}
                    >
                      <option value="">-- Chọn điểm đến --</option>
                      {CITY_STOPS.map((stop, idx) => (
                        <option key={idx} value={stop}>{stop}</option>
                      ))}
                    </select>
                  ) : (
                    <select
                      className="form-control form-input"
                      name="to"
                      value={formData.to}
                      onChange={handleChange}
                    >
                      <option value="">-- Chọn điểm đến --</option>
                      {formData.from && Array.from(new Set(INTERCITY_ROUTES.filter(r => r.from === formData.from).map(r => r.to))).map((city, idx) => (
                        <option key={idx} value={city}>{city}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Date */}
              <div className="col-lg-2 col-md-6">
                <div className="search-input-group">
                  <label className="form-label fw-600 mb-2">
                    <FiCalendar className="me-2" />
                    Ngày đi
                  </label>
                  <input
                    type="date"
                    className="form-control form-input"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {/* Departure Time */}
              <div className="col-lg-2 col-md-6">
                <div className="search-input-group">
                  <label className="form-label fw-600 mb-2">
                    <FiCalendar className="me-2" />
                    Giờ khởi hành
                  </label>
                  <select
                    className="form-control form-input"
                    name="departureTime"
                    value={formData.departureTime}
                    onChange={handleChange}
                  >
                    <option value="">-- Tất cả giờ --</option>
                    {Object.entries(DEPARTURE_TIMES).map(([key, time]) => (
                      <option key={key} value={key}>
                        {time.label} ({time.start}-{time.end})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search Button */}
              <div className="col-lg-2 col-md-12 d-flex align-items-end">
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  style={{
                    backgroundColor: 'var(--color-primary-600)',
                    borderColor: 'var(--color-primary-600)',
                    padding: '0.75rem 1.5rem',
                    fontWeight: 600,
                    height: '48px'
                  }}
                >
                  Tìm vé
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Quick Stats */}
        <div className="row mt-5 pt-4 border-top border-white border-opacity-25 justify-content-around">
          <div className="col-auto text-center">
            <div className="fs-5 fw-bold text-white">
              500+
            </div>
            <div className="text-white-50 small">Tuyến đường BusGo</div>
          </div>

          <div className="col-auto text-center">
            <div className="fs-5 fw-bold text-white">
              10,000+
            </div>
            <div className="text-white-50 small">Chuyến đi mỗi ngày</div>
          </div>

          <div className="col-auto text-center">
            <div className="fs-5 fw-bold text-white">
              100K+
            </div>
            <div className="text-white-50 small">Khách BusGo hài lòng</div>
          </div>
      </div>
      </div>
    </div>
  )
}
