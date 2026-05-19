import { useState } from 'react'
import { FiPackage, FiBox, FiTruck } from 'react-icons/fi'
import { MdDirectionsBike, MdTwoWheeler } from 'react-icons/md'
import './CargoSelector.css'

export default function CargoSelector({ cargoInfo, onCargoTypeChange, onCargoWeightChange, cargoTypes }) {
  const [showDetails, setShowDetails] = useState(false)

  const cargoOptions = [
    {
      type: 'none',
      label: 'Không gửi hàng',
      icon: '✋',
      description: 'Chỉ hành lý xách tay',
      color: '#e0e0e0'
    },
    {
      type: 'light',
      label: 'Hàng nhẹ',
      icon: '📦',
      description: 'Tài liệu, quà cáp (<10kg)',
      color: '#ffc107'
    },
    {
      type: 'heavy',
      label: 'Hàng nặng',
      icon: '📦',
      description: 'Thùng hàng (10kg+)',
      color: '#ff9800'
    },
    {
      type: 'scooter',
      label: 'Xe tay ga',
      icon: '🏍️',
      description: 'Xe tay ga nhỏ',
      color: '#2196f3'
    },
    {
      type: 'motorcycle',
      label: 'Xe máy',
      icon: '🏍️',
      description: 'Xe máy thường',
      color: '#f44336'
    }
  ]

  const getCargoPrice = (type, weight = '') => {
    if (type === 'none' || type === 'light') return 0

    if (type === 'heavy' && weight) {
      const w = parseFloat(weight)
      if (w < 10) return 0
      const pricePerKg = 50000 // Example price per kg
      return Math.round(w * pricePerKg)
    }

    if (type === 'scooter') {
      return 450000
    }

    if (type === 'motorcycle') {
      return 650000
    }

    return 0
  }

  const handleTypeSelect = (type) => {
    const event = { target: { value: type } }
    onCargoTypeChange(event)
  }

  const handleWeightChange = (e) => {
    onCargoWeightChange(e)
  }

  const selectedOption = cargoOptions.find(opt => opt.type === cargoInfo.type)

  return (
    <div className="cargo-selector-container">
      <div className="cargo-header">
        <h3>Hành lý & Hàng hóa</h3>
        <p>Chọn loại hàng hóa bạn muốn gửi đi (tùy chọn)</p>
      </div>

      {/* Cargo Type Selector */}
      <div className="cargo-types">
        {cargoOptions.map(option => (
          <button
            key={option.type}
            className={`cargo-option ${cargoInfo.type === option.type ? 'selected' : ''}`}
            onClick={() => handleTypeSelect(option.type)}
            style={{
              borderColor: cargoInfo.type === option.type ? option.color : '#ddd'
            }}
          >
            <div className="cargo-icon">{option.icon}</div>
            <div className="cargo-info">
              <div className="cargo-label">{option.label}</div>
              <div className="cargo-description">{option.description}</div>
            </div>
            {cargoInfo.type === option.type && (
              <div className="cargo-check">✓</div>
            )}
          </button>
        ))}
      </div>

      {/* Heavy Cargo Weight Input */}
      {cargoInfo.type === 'heavy' && (
        <div className="cargo-details-section">
          <div className="weight-input-group">
            <label>Nhập trọng lượng (kg):</label>
            <div className="weight-input-wrapper">
              <input
                type="number"
                className="weight-input"
                placeholder="Ví dụ: 15"
                value={cargoInfo.weight || ''}
                onChange={handleWeightChange}
                min="10"
                max="100"
              />
              <span className="weight-unit">kg</span>
            </div>
          </div>

          {cargoInfo.weight && parseInt(cargoInfo.weight) >= 10 && (
            <div className="weight-info">
              <div className="price-breakdown">
                <span>Trọng lượng: {cargoInfo.weight}kg</span>
                <span>Giá/kg: 50,000đ</span>
                <span className="price-total">
                  = {getCargoPrice('heavy', cargoInfo.weight).toLocaleString()}đ
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Motorcycle/Scooter Info */}
      {(cargoInfo.type === 'motorcycle' || cargoInfo.type === 'scooter') && (
        <div className="cargo-details-section">
          <div className="vehicle-info-box">
            <p className="info-title">📋 Thông tin gửi hàng:</p>
            <ul className="info-list">
              <li>Xe sẽ được vận chuyển trên tầng trên của chuyến xe</li>
              <li>Thời gian vận chuyển: sáng hoặc chiều cùng ngày</li>
              <li>Bảo hiểm chuyến vận chuyển: Bắt buộc</li>
              <li>Vui lòng cung cấp ảnh biển số xe khi thanh toán</li>
            </ul>
          </div>
        </div>
      )}

      {/* Price Summary */}
      <div className="cargo-price-summary">
        <div className="summary-row">
          <span className="label">Loại hàng hóa:</span>
          <span className="value">{selectedOption?.label || 'N/A'}</span>
        </div>
        {cargoInfo.type === 'heavy' && cargoInfo.weight && (
          <div className="summary-row">
            <span className="label">Chi phí vận chuyển:</span>
            <span className="value">
              {getCargoPrice('heavy', cargoInfo.weight).toLocaleString()}đ
            </span>
          </div>
        )}
        {(cargoInfo.type === 'motorcycle' || cargoInfo.type === 'scooter') && (
          <div className="summary-row">
            <span className="label">Chi phí vận chuyển:</span>
            <span className="value">
              {getCargoPrice(cargoInfo.type).toLocaleString()}đ
            </span>
          </div>
        )}
        {cargoInfo.type === 'none' && (
          <div className="summary-row">
            <span className="label">Chi phí vận chuyển:</span>
            <span className="value">Miễn phí</span>
          </div>
        )}
        {cargoInfo.type === 'light' && (
          <div className="summary-row">
            <span className="label">Chi phí vận chuyển:</span>
            <span className="value">Miễn phí</span>
          </div>
        )}
      </div>
    </div>
  )
}
