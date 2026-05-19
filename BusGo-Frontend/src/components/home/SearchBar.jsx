import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiMapPin, FiCalendar, FiChevronRight, FiZap, FiWifi, FiActivity } from 'react-icons/fi'
import { MdDirectionsBus } from 'react-icons/md'
import { BUS_CATEGORIES, BUS_TYPES, CITY_STOPS, INTERCITY_ROUTES, DEPARTURE_TIMES } from '../../utils/constants'
import './SearchBar.css'

export default function SearchBar() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    category: 'city',
    busType: '',
    from: '',
    to: '',
    date: '',
    departureTime: ''
  })
  const [showSmartTags, setShowSmartTags] = useState(false)

  // Smart Suggestion Tags
  const smartTags = [
    { id: 1, icon: '🚐', label: 'Xe 16 chỗ cao cấp', busType: '16-seater-premium' },
    { id: 2, icon: '📡', label: 'Có WiFi & Sạc', feature: 'wifi_charger' },
    { id: 3, icon: '🌙', label: 'Chuyến đêm', time: 'night' },
    { id: 4, icon: '💰', label: 'Giá dưới 200k', price: 'budget' },
    { id: 5, icon: '⭐', label: 'Xe 5 sao', rating: 5 },
    { id: 6, icon: '🚌', label: 'Xe 35 chỗ', busType: '35-seater' }
  ]

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

        {/* Smart Suggestion Tags */}
        <div className="smart-tags-section mb-4">
          <p className="smart-tags-label">Tìm kiếm nhanh:</p>
          <div className="smart-tags-container">
            {smartTags.map(tag => (
              <button
                key={tag.id}
                className="smart-tag-btn"
                onClick={() => {
                  setShowSmartTags(false)
                  // Handle smart tag selection
                }}
                title={tag.label}
              >
                <span className="tag-icon">{tag.icon}</span>
                <span className="tag-label">{tag.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Buttons and Search Form Wrapper */}
        <div className="search-wrapper">
          {/* Category Selection Buttons */}
          <div className="route-type-buttons">
            <button
              type="button"
              className={`route-type-btn ${formData.category === 'city' ? 'active' : ''}`}
              onClick={() => handleCategorySelect('city')}
            >
              <span className="btn-icon">🏢</span>
              <span className="btn-text">Nội thành</span>
            </button>
            <button
              type="button"
              className={`route-type-btn ${formData.category === 'interCity' ? 'active' : ''}`}
              onClick={() => handleCategorySelect('interCity')}
            >
              <span className="btn-icon">🗺️</span>
              <span className="btn-text">Ngoại thành</span>
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="search-form">
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
        </div>

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
