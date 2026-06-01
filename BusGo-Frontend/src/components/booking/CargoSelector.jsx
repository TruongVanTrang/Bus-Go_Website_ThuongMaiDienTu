import { FiCheck } from 'react-icons/fi'

export default function CargoSelector({ cargoInfo, onCargoTypeChange, onCargoWeightChange, cargoTypes, busType }) {
  const allCargoOptions = [
    { type: 'none',       label: 'Không gửi hàng', icon: '✋', description: 'Chỉ hành lý xách tay',     color: 'slate' },
    { type: 'light',      label: 'Hàng nhẹ',        icon: '📦', description: 'Tài liệu, quà cáp (<7kg)', color: 'yellow' },
    { type: 'heavy',      label: 'Hàng nặng',        icon: '📦', description: 'Thùng hàng (>7kg)',        color: 'orange' },
    { type: 'motorcycle', label: 'Xe máy',           icon: '🏍️', description: 'Xe máy thường',           color: 'red' },
    { type: 'scooter',    label: 'Xe tay ga',        icon: '🛵', description: 'Xe tay ga lớn',            color: 'blue' }
  ]

  const isSleeper = busType && busType.startsWith('sleeper')
  const cargoOptions = isSleeper ? allCargoOptions : allCargoOptions.slice(0, 3)

  const getCargoPrice = (type, weight = '') => {
    if (type === 'none' || type === 'light') return 0
    if (type === 'heavy' && weight) {
      const w = parseFloat(weight)
      if (w <= 7) return 0
      return Math.round(w * 10000)
    }
    if (type === 'motorcycle') return 270000
    if (type === 'scooter') return 320000
    return 0
  }

  const handleTypeSelect = (type) => {
    onCargoTypeChange({ target: { value: type } })
  }

  const selectedOption = cargoOptions.find(opt => opt.type === cargoInfo.type)

  const optionStyle = (isSelected, color) => {
    const base = 'relative flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all text-left'
    if (isSelected) return `${base} border-blue-500 bg-blue-50 shadow-sm`
    return `${base} border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50`
  }

  return (
    <div>
      {/* Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        {cargoOptions.map(option => (
          <button
            key={option.type}
            className={optionStyle(cargoInfo.type === option.type, option.color)}
            onClick={() => handleTypeSelect(option.type)}
          >
            {cargoInfo.type === option.type && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center">
                <FiCheck size={12} />
              </div>
            )}
            <span className="text-2xl">{option.icon}</span>
            <div className="flex-1 text-left">
              <div className="text-sm font-bold text-slate-800">{option.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{option.description}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Heavy Cargo Weight Input */}
      {cargoInfo.type === 'heavy' && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
          <label className="block text-sm font-bold text-slate-700 mb-2">Nhập trọng lượng hàng (kg):</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              className="w-32 px-3 py-2 rounded-lg border border-slate-200 focus:border-orange-400 focus:outline-none text-sm font-bold text-slate-800"
              placeholder="Ví dụ: 15"
              value={cargoInfo.weight || ''}
              onChange={onCargoWeightChange}
              min="8"
              max="100"
            />
            <span className="text-sm font-bold text-slate-500">kg</span>
          </div>
          {cargoInfo.weight && parseInt(cargoInfo.weight) > 7 && (
            <div className="mt-3 bg-white rounded-lg px-3 py-2 border border-orange-100 text-sm font-medium text-orange-700">
              {cargoInfo.weight}kg × 10.000đ = <strong>{getCargoPrice('heavy', cargoInfo.weight).toLocaleString('vi-VN')}đ</strong>
            </div>
          )}
        </div>
      )}

      {/* Motorcycle / Scooter Info */}
      {(cargoInfo.type === 'motorcycle' || cargoInfo.type === 'scooter') && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <div className="text-sm font-bold text-blue-700 mb-2">📋 Thông tin gửi xe:</div>
          <ul className="space-y-1 text-xs font-medium text-blue-600">
            <li>• Xe sẽ được vận chuyển trên tầng trên của chuyến xe</li>
            <li>• Thời gian vận chuyển: Cùng ngày với chuyến đi</li>
            <li>• Bảo hiểm chuyến vận chuyển: Bắt buộc</li>
            <li>• Vui lòng cung cấp ảnh biển số xe khi thanh toán</li>
          </ul>
        </div>
      )}

      {/* Price Summary */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loại hàng đã chọn</span>
          <div className="text-sm font-bold text-slate-800 mt-0.5">{selectedOption?.label || '---'}</div>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phí vận chuyển</span>
          <div className={`text-sm font-black mt-0.5 ${cargoInfo.estimatedPrice > 0 ? 'text-orange-600' : 'text-green-600'}`}>
            {cargoInfo.estimatedPrice > 0
              ? `+${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cargoInfo.estimatedPrice)}`
              : 'Miễn phí'}
          </div>
        </div>
      </div>
    </div>
  )
}
