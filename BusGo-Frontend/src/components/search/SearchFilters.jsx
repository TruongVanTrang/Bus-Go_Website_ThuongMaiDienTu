import { useState, useEffect } from 'react'
import { BUS_TYPES, BUS_CATEGORIES, CITY_STOPS, INTERCITY_ROUTES, DEPARTURE_TIMES } from '../../utils/constants'
import { FiChevronDown, FiChevronRight, FiFilter, FiRefreshCw, FiMapPin, FiCalendar, FiClock, FiStar, FiInfo, FiCheck } from 'react-icons/fi'

export default function SearchFilters({ filters, setFilters }) {
  const getPriceConfig = () => {
    if (filters?.category === 'city') {
      return { maxLimit: 100000, step: 5000, defaultMax: 100000 }
    }
    return { maxLimit: 1000000, step: 50000, defaultMax: 1000000 }
  }

  const { maxLimit, step, defaultMax } = getPriceConfig()

  const [priceMin, setPriceMin] = useState(filters?.priceRange?.[0] || 0)
  const [priceMax, setPriceMax] = useState(filters?.priceRange?.[1] || defaultMax)
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    busType: true,
    price: true,
    timeSlot: true,
    location: true,
    amenities: true
  })

  useEffect(() => {
    if (filters?.priceRange) {
      setPriceMin(filters.priceRange[0])
      setPriceMax(filters.priceRange[1])
    }
  }, [filters?.priceRange])

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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-120px)] sticky top-24 overflow-hidden">
      {/* Title Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between z-10">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <FiFilter className="text-blue-500" /> Bộ lọc tìm kiếm
        </h2>
      </div>

      {/* Scrollable body content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        
        {/* Service Type Selection */}
        {!filters?.category && (
          <div className="border-b border-slate-100 pb-4">
            <button 
              className="w-full flex items-center justify-between text-left mb-3 group"
              onClick={() => toggleSection('category')}
            >
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <span className="text-blue-500">📍</span> Loại dịch vụ
              </h3>
              <span className="text-slate-400 group-hover:text-blue-500 transition-colors">
                {expandedSections.category ? <FiChevronDown /> : <FiChevronRight />}
              </span>
            </button>
            
            {expandedSections.category && (
              <div className="space-y-3 pl-1">
                {Object.entries(BUS_CATEGORIES).map(([key, category]) => (
                  <label key={key} className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center mt-1">
                      <input
                        type="radio" 
                        name="category"
                        value={key} 
                        checked={filters?.category === key}
                        onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                        className="peer sr-only"
                      />
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 peer-checked:border-blue-600 peer-checked:bg-blue-600 transition-colors"></div>
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{category.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{category.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {filters?.category && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-lg mb-4">
            <div className="text-xs font-semibold text-slate-500 mb-1">📍 Dịch vụ đã chọn:</div>
            <div className="font-bold text-blue-700 text-sm">{BUS_CATEGORIES[filters.category]?.name}</div>
            <button 
              onClick={() => setFilters(prev => ({ ...prev, category: '', busType: '', from: '', to: '' }))}
              className="mt-2 text-xs font-bold text-blue-500 hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              <FiRefreshCw size={12} /> Thay đổi dịch vụ
            </button>
          </div>
        )}

        {/* Departure Date */}
        <div className="border-b border-slate-100 pb-4">
          <button 
            className="w-full flex items-center justify-between text-left mb-3 group"
            onClick={() => toggleSection('date')}
          >
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <FiCalendar className="text-blue-500" /> Ngày xuất phát
            </h3>
            <span className="text-slate-400 group-hover:text-blue-500 transition-colors">
              {expandedSections.date ? <FiChevronDown /> : <FiChevronRight />}
            </span>
          </button>
          {expandedSections.date && (
            <div className="pl-1">
              <input 
                type="date" 
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-0 text-sm font-medium text-slate-700 outline-none transition-colors" 
                value={filters?.departureDate || ''} 
                onChange={(e) => setFilters(prev => ({ ...prev, departureDate: e.target.value }))} 
                min={new Date().toISOString().split('T')[0]} 
              />
            </div>
          )}
        </div>

        {/* Departure/Arrival Stop Points */}
        <div className="border-b border-slate-100 pb-4">
          <button 
            className="w-full flex items-center justify-between text-left mb-3 group"
            onClick={() => toggleSection('location')}
          >
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <FiMapPin className="text-blue-500" /> Điểm đi / Điểm đến
            </h3>
            <span className="text-slate-400 group-hover:text-blue-500 transition-colors">
              {expandedSections.location ? <FiChevronDown /> : <FiChevronRight />}
            </span>
          </button>
          {expandedSections.location && (
            <div className="pl-1 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Điểm đi</label>
                <select 
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-0 text-sm font-medium text-slate-700 outline-none transition-colors appearance-none bg-white" 
                  value={filters?.from || ''} 
                  onChange={(e) => setFilters(prev => ({ ...prev, from: e.target.value }))}
                >
                  <option value="">-- Tất cả điểm đi --</option>
                  {filters?.category === 'city' 
                    ? CITY_STOPS.map((stop, idx) => <option key={idx} value={stop}>{stop}</option>) 
                    : Array.from(new Set(INTERCITY_ROUTES.map(r => r.from))).map((city, idx) => <option key={idx} value={city}>{city}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Điểm đến</label>
                <select 
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-0 text-sm font-medium text-slate-700 outline-none transition-colors appearance-none bg-white" 
                  value={filters?.to || ''} 
                  onChange={(e) => setFilters(prev => ({ ...prev, to: e.target.value }))}
                >
                  <option value="">-- Tất cả điểm đến --</option>
                  {filters?.category === 'city' 
                    ? CITY_STOPS.map((stop, idx) => <option key={idx} value={stop}>{stop}</option>) 
                    : filters?.from && Array.from(new Set(INTERCITY_ROUTES.filter(r => r.from === filters.from).map(r => r.to))).map((city, idx) => <option key={idx} value={city}>{city}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Price Ranges */}
        <div className="border-b border-slate-100 pb-4">
          <button 
            className="w-full flex items-center justify-between text-left mb-3 group"
            onClick={() => toggleSection('price')}
          >
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <span className="text-blue-500">💰</span> Giá vé
            </h3>
            <span className="text-slate-400 group-hover:text-blue-500 transition-colors">
              {expandedSections.price ? <FiChevronDown /> : <FiChevronRight />}
            </span>
          </button>
          {expandedSections.price && (
            <div className="pl-1">
              <div className="flex gap-2 mb-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Từ (VNĐ)</label>
                  <input 
                    type="number" 
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 focus:border-blue-500 text-sm font-medium text-slate-700 outline-none" 
                    value={priceMin} 
                    onChange={(e) => setPriceMin(Number(e.target.value))} 
                    min="0" 
                    max={maxLimit} 
                    step={step} 
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Đến (VNĐ)</label>
                  <input 
                    type="number" 
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 focus:border-blue-500 text-sm font-medium text-slate-700 outline-none" 
                    value={priceMax} 
                    onChange={(e) => { 
                      const val = Number(e.target.value); 
                      setPriceMax(val > maxLimit ? maxLimit : val); 
                    }} 
                    min="0" 
                    max={maxLimit} 
                    step={step} 
                  />
                </div>
              </div>
              <button 
                onClick={handlePriceChange} 
                className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-lg text-sm transition-colors mb-2"
              >
                Áp dụng giá
              </button>
              <div className="text-center text-xs font-bold text-slate-500">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(filters?.priceRange?.[0] || 0)} - {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(filters?.priceRange?.[1] || defaultMax)}
              </div>
            </div>
          )}
        </div>

        {/* Vehicle Types */}
        <div className="border-b border-slate-100 pb-4">
          <button 
            className="w-full flex items-center justify-between text-left mb-3 group"
            onClick={() => toggleSection('busType')}
          >
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <span className="text-blue-500">🚌</span> Loại xe
            </h3>
            <span className="text-slate-400 group-hover:text-blue-500 transition-colors">
              {expandedSections.busType ? <FiChevronDown /> : <FiChevronRight />}
            </span>
          </button>
          {expandedSections.busType && (
            <div className="pl-1">
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio" name="busType"
                      checked={!filters?.busType} onChange={() => setFilters(prev => ({ ...prev, busType: '' }))}
                      className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">Tất cả loại xe</span>
                  </label>
                </div>
                {filteredBusTypes.map(([key, busType]) => (
                  <label key={key} className="flex items-start gap-2 cursor-pointer group col-span-2 sm:col-span-1">
                    <input
                      type="radio" name="busType"
                      checked={filters?.busType === busType.id} onChange={() => setFilters(prev => ({ ...prev, busType: busType.id }))}
                      className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer mt-0.5"
                    />
                    <div className="flex-1">
                      <span className="block text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors leading-tight">{busType.name}</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">{busType.seats} ghế {busType.standing ? `(+${busType.standing})` : ''}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Departure Time Slots */}
        <div className="border-b border-slate-100 pb-4">
          <button 
            className="w-full flex items-center justify-between text-left mb-3 group"
            onClick={() => toggleSection('timeSlot')}
          >
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <FiClock className="text-blue-500" /> Giờ khởi hành
            </h3>
            <span className="text-slate-400 group-hover:text-blue-500 transition-colors">
              {expandedSections.timeSlot ? <FiChevronDown /> : <FiChevronRight />}
            </span>
          </button>
          {expandedSections.timeSlot && (
            <div className="pl-1">
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                   <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" name="timeSlot" checked={!filters?.departureTime} onChange={() => setFilters(prev => ({ ...prev, departureTime: '' }))} className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer" />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">Tất cả các giờ</span>
                  </label>
                </div>
                {Object.entries(DEPARTURE_TIMES).map(([key, time]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer group col-span-2 sm:col-span-1">
                    <input type="radio" name="timeSlot" checked={filters?.departureTime === key} onChange={() => setFilters(prev => ({ ...prev, departureTime: key }))} className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer" />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">{time.start} - {time.end}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Amenities */}
        <div>
          <button 
            className="w-full flex items-center justify-between text-left mb-3 group"
            onClick={() => toggleSection('amenities')}
          >
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <FiStar className="text-blue-500" /> Tiện nghi
            </h3>
            <span className="text-slate-400 group-hover:text-blue-500 transition-colors">
              {expandedSections.amenities ? <FiChevronDown /> : <FiChevronRight />}
            </span>
          </button>
          {expandedSections.amenities && (
            <div className="pl-1 space-y-2">
              {amenitiesOptions.map(amenity => (
                <label key={amenity.id} className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={filters?.amenities?.includes(amenity.id) || false} 
                    onChange={() => handleAmenityChange(amenity.id)} 
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">{amenity.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Information Notes */}
        <div className="mt-6 flex items-start gap-2 bg-blue-50 p-3 rounded-lg border border-blue-100 text-blue-800">
          <FiInfo className="mt-0.5 shrink-0" />
          <p className="text-xs font-medium leading-relaxed">
            BusGo là nền tảng đặt vé độc lập, cung cấp lộ trình minh bạch và dịch vụ chất lượng cao.
          </p>
        </div>
      </div> 

      {/* Bottom Sticky Reset Button */}
      <div className="p-4 border-t border-slate-100 bg-white z-10">
        <button
          onClick={() => {
            const config = getPriceConfig()
            setFilters({
              priceRange: [0, config.defaultMax], 
              amenities: [], 
              busType: '', 
              departureTime: '', 
              category: '', 
              from: '', 
              to: '', 
              departureDate: ''
            })
            setPriceMin(0)
            setPriceMax(config.defaultMax)
          }}
          className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors shadow-sm"
        >
          <FiRefreshCw />
          Đặt lại bộ lọc
        </button>
      </div>
    </div>
  )
}