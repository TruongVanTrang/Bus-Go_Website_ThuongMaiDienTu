import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiMapPin, FiCalendar } from 'react-icons/fi'
import { MdDirectionsBus } from 'react-icons/md'
import './SearchBar.css'

export default function SearchBar() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    date: '',
    serviceType: 'bus'
  })

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
    if (!formData.from || !formData.to || !formData.date) {
      alert('Vui lòng điền đầy đủ thông tin')
      return
    }

    // Navigate to search results
    const params = new URLSearchParams(formData)
    navigate(`/search?${params.toString()}`)
  }

  return (
    <div className="search-bar-container">
      <div className="search-bar-content">
        <h1 className="search-bar-title mb-4">
          Tìm và đặt vé xe bus dễ dàng
        </h1>
        <p className="search-bar-subtitle mb-4">
          Khám phá hàng ngàn chuyến xe với giá tốt nhất
        </p>

        <form onSubmit={handleSearch} className="search-form">
          <div className="row g-3">
            {/* From */}
            <div className="col-lg-3 col-md-6">
              <div className="search-input-group">
                <label className="form-label fw-600 mb-2">
                  <FiMapPin className="me-2" />
                  Điểm đi
                </label>
                <input
                  type="text"
                  className="form-control form-input"
                  name="from"
                  value={formData.from}
                  onChange={handleChange}
                  placeholder="Chọn điểm đi"
                  list="cities"
                />
                <datalist id="cities">
                  <option value="Hà Nội" />
                  <option value="Sài Gòn" />
                  <option value="Đà Nẵng" />
                  <option value="Hải Phòng" />
                  <option value="Cần Thơ" />
                </datalist>
              </div>
            </div>

            {/* To */}
            <div className="col-lg-3 col-md-6">
              <div className="search-input-group">
                <label className="form-label fw-600 mb-2">
                  <FiMapPin className="me-2" />
                  Điểm đến
                </label>
                <input
                  type="text"
                  className="form-control form-input"
                  name="to"
                  value={formData.to}
                  onChange={handleChange}
                  placeholder="Chọn điểm đến"
                  list="cities"
                />
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

            {/* Service Type */}
            <div className="col-lg-2 col-md-6">
              <div className="search-input-group">
                <label className="form-label fw-600 mb-2">
                  <MdDirectionsBus className="me-2" />
                  Loại xe
                </label>
                <select
                  className="form-control form-input"
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleChange}
                >
                  <option value="bus">Xe Bus</option>
                  <option value="minibus">Xe 4-35 chỗ</option>
                  <option value="all">Tất cả loại xe</option>
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

        {/* Quick Stats */}
        <div className="row mt-5 pt-4 border-top border-primary border-opacity-25 justify-content-around">
          <div className="col-auto text-center">
            <div className="fs-5 fw-bold" style={{ color: 'var(--color-primary-600)' }}>
              500+
            </div>
            <div className="text-muted small">Tuyến đường</div>
          </div>
          <div className="col-auto text-center">
            <div className="fs-5 fw-bold" style={{ color: 'var(--color-primary-600)' }}>
              10,000+
            </div>
            <div className="text-muted small">Chuyến đi</div>
          </div>
          <div className="col-auto text-center">
            <div className="fs-5 fw-bold" style={{ color: 'var(--color-primary-600)' }}>
              100K+
            </div>
            <div className="text-muted small">Khách hài lòng</div>
          </div>
        </div>
      </div>
    </div>
  )
}
