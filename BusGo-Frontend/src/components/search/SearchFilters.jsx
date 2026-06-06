import { useState, useEffect } from 'react'
import { BUS_TYPES, DEPARTURE_TIMES } from '../../utils/constants'
import { 
  FiChevronDown, 
  FiChevronRight, 
  FiFilter, 
  FiRefreshCw, 
  FiClock, 
  FiStar, 
  FiInfo, 
  FiCheck, 
  FiX,
  FiSun,
  FiMoon,
  FiSunrise,
  FiSunset,
  FiZap,
  FiWifi,
  FiWind,
  FiGlobe,
  FiLayers,
  FiTag,
  FiSliders,
  FiGrid
} from 'react-icons/fi'

export default function SearchFilters({ filters, setFilters, isOpen, onClose, mobileOnly = false, desktopOnly = false }) {
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
    price: true,
    busType: true,
    timeSlot: true,
    amenities: true
  })

  // Synchronize internal slider values if the external filters state changes
  useEffect(() => {
    if (filters?.priceRange) {
      setPriceMin(filters.priceRange[0])
      setPriceMax(filters.priceRange[1])
    }
  }, [filters?.priceRange])

  // Adjust prices if category updates and bounds exceed
  useEffect(() => {
    if (filters?.category === 'city') {
      if (priceMax > 100000) {
        setPriceMin(0)
        setPriceMax(100000)
        setFilters(prev => ({ ...prev, priceRange: [0, 100000] }))
      }
    } else {
      if (priceMax <= 100000 && priceMax !== defaultMax) {
        setPriceMin(0)
        setPriceMax(1000000)
        setFilters(prev => ({ ...prev, priceRange: [0, 1000000] }))
      }
    }
  }, [filters?.category])

  const amenitiesOptions = [
    { id: 'AC', label: 'Điều hòa' },
    { id: 'Wifi', label: 'WiFi miễn phí' },
    { id: 'Phone Charger', label: 'Cổng sạc' },
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

  const handleMinChange = (e) => {
    const val = Math.min(Number(e.target.value), priceMax - step)
    setPriceMin(val)
    setFilters(prev => ({ ...prev, priceRange: [val, priceMax] }))
  }

  const handleMaxChange = (e) => {
    const val = Math.max(Number(e.target.value), priceMin + step)
    setPriceMax(val)
    setFilters(prev => ({ ...prev, priceRange: [priceMin, val] }))
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

  const quickPriceRanges = filters?.category === 'city'
    ? [
        { label: 'Dưới 10k', min: 0, max: 10000 },
        { label: '10k - 50k', min: 10000, max: 50000 },
        { label: 'Trên 50k', min: 50000, max: 100000 }
      ]
    : [
        { label: 'Dưới 100k', min: 0, max: 100000 },
        { label: '100k - 300k', min: 100000, max: 300000 },
        { label: '300k - 600k', min: 300000, max: 600000 },
        { label: 'Trên 600k', min: 600000, max: 1000000 }
      ]

  const getTimeIcon = (id) => {
    switch (id) {
      case 'early':
      case 'morning_early':
        return <FiSunrise className="text-amber-500 text-sm shrink-0" />
      case 'morning':
      case 'late_morning':
        return <FiSun className="text-amber-600 text-sm shrink-0" />
      case 'early_afternoon':
      case 'afternoon':
      case 'late_afternoon':
        return <FiSunset className="text-orange-500 text-sm shrink-0" />
      case 'evening':
      case 'late_evening':
      case 'night':
        return <FiMoon className="text-indigo-400 text-sm shrink-0" />
      default:
        return <FiClock className="text-slate-400 text-sm shrink-0" />
    }
  }

  const getAmenityIcon = (id) => {
    switch (id) {
      case 'AC':
        return <FiWind className="text-blue-500 text-sm shrink-0" />
      case 'Wifi':
        return <FiWifi className="text-sky-500 text-sm shrink-0" />
      case 'Phone Charger':
        return <FiZap className="text-amber-500 text-sm shrink-0" />
      case 'Blanket':
        return <span className="text-xs shrink-0">🛏️</span>
      case 'Toilet':
        return <span className="text-xs shrink-0">🚽</span>
      default:
        return <FiStar className="text-slate-400 text-sm shrink-0" />
    }
  }

  const getVehicleIcon = (id) => {
    switch (id) {
      case 'city_small':
      case 'city_medium':
      case 'city_large':
      case 'mini_16':
      case 'coach_16':
      case 'coach_29_35':
      case 'coach_suburb':
        return <FiSliders className="text-blue-500 text-sm shrink-0" />
      case 'mini_4_5':
      case 'coach_4':
        return <FiGlobe className="text-blue-500 text-sm shrink-0" />
      case 'mini_7':
      case 'mini_9':
      case 'coach_7':
        return <FiLayers className="text-slate-450 text-sm shrink-0" />
      case 'sleeper_36':
        return <FiMoon className="text-indigo-400 text-sm shrink-0" />
      default:
        return <FiSliders className="text-slate-400 text-sm shrink-0" />
    }
  }

  const handleResetFilters = () => {
    const config = getPriceConfig()
    setFilters(prev => ({
      ...prev,
      priceRange: [0, config.defaultMax], 
      amenities: [], 
      busType: '', 
      departureTime: ''
    }))
    setPriceMin(0)
    setPriceMax(config.defaultMax)
  }

  const renderFilterContent = (isMobile) => {
    return (
      <>
        {/* Style block for range slider handle custom visuals */}
        <style>{`
          .dual-range-input::-webkit-slider-thumb {
            pointer-events: auto;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #2563eb;
            border: 2px solid #ffffff;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.15);
            -webkit-appearance: none;
            transition: transform 0.15s ease, background 0.15s ease;
          }
          .dual-range-input::-webkit-slider-thumb:hover {
            transform: scale(1.15);
            background: #1d4ed8;
          }
          .dual-range-input::-moz-range-thumb {
            pointer-events: auto;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #2563eb;
            border: 2px solid #ffffff;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.15);
            transition: transform 0.15s ease, background 0.15s ease;
          }
          .dual-range-input::-moz-range-thumb:hover {
            transform: scale(1.15);
            background: #1d4ed8;
          }
        `}</style>

        {/* Title Header */}
        <div className="p-5 border-b border-slate-100 bg-white flex items-center justify-between shrink-0 z-10">
          <h2 className="text-base font-black text-slate-800 flex items-center gap-2 uppercase tracking-wide">
            <FiFilter className="text-blue-600 text-lg" /> Bộ lọc tìm kiếm
          </h2>
          {isMobile && (
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors shadow-sm"
            >
              <FiX size={18} />
            </button>
          )}
        </div>

        {/* Scrollable body content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          
          {/* Price Ranges with Dual Range Slider */}
          <div className="border-b border-slate-100/70 pb-5">
            <button 
              className="w-full flex items-center justify-between text-left mb-3 group"
              onClick={() => toggleSection('price')}
            >
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2 text-xs uppercase tracking-wider">
                <FiTag className="text-blue-500" /> Khoảng giá
              </h3>
              <span className="text-slate-400 group-hover:text-blue-500 transition-colors">
                {expandedSections.price ? <FiChevronDown /> : <FiChevronRight />}
              </span>
            </button>
            {expandedSections.price && (
              <div className="pl-1">
                {/* Formatted values display */}
                <div className="flex justify-between items-center mb-1 bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded-lg">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(priceMin)}
                  </span>
                  <span className="text-slate-400 font-extrabold text-xs">đến</span>
                  <span className="text-[10px] font-black text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded-lg">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(priceMax)}
                  </span>
                </div>

                {/* Overlapping Range Inputs Container */}
                <div className="relative w-full h-8 flex items-center mt-2 px-1">
                  {/* Slider track background */}
                  <div className="absolute h-1.5 w-full bg-slate-150 rounded-full border border-slate-200/40"></div>
                  {/* Colored filled range track */}
                  <div 
                    className="absolute h-1.5 bg-blue-500 rounded-full"
                    style={{
                      left: `${(priceMin / maxLimit) * 100}%`,
                      right: `${100 - (priceMax / maxLimit) * 100}%`
                    }}
                  ></div>
                  
                  {/* Minimum value slider */}
                  <input 
                    type="range"
                    min="0"
                    max={maxLimit}
                    step={step}
                    value={priceMin}
                    onChange={handleMinChange}
                    className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none dual-range-input outline-none cursor-pointer"
                    style={{ zIndex: priceMin > maxLimit - 100 ? 5 : 3 }}
                  />
                  {/* Maximum value slider */}
                  <input 
                    type="range"
                    min="0"
                    max={maxLimit}
                    step={step}
                    value={priceMax}
                    onChange={handleMaxChange}
                    className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none dual-range-input outline-none cursor-pointer"
                    style={{ zIndex: 4 }}
                  />
                </div>

                {/* Quick price selection tags */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {quickPriceRanges.map((range, idx) => {
                    const isActive = priceMin === range.min && priceMax === range.max
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setPriceMin(range.min)
                          setPriceMax(range.max)
                          setFilters(prev => ({ ...prev, priceRange: [range.min, range.max] }))
                        }}
                        className={`px-2.5 py-1.5 text-[9px] font-black rounded-lg border transition-all ${
                          isActive
                            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {range.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Vehicle Types */}
          <div className="border-b border-slate-100/70 pb-5">
            <button 
              className="w-full flex items-center justify-between text-left mb-3 group"
              onClick={() => toggleSection('busType')}
            >
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2 text-xs uppercase tracking-wider">
                <FiSliders className="text-blue-500" /> Loại xe
              </h3>
              <span className="text-slate-400 group-hover:text-blue-500 transition-colors">
                {expandedSections.busType ? <FiChevronDown /> : <FiChevronRight />}
              </span>
            </button>
            {expandedSections.busType && (
              <div className="pl-1">
                <div className="flex flex-wrap gap-2">
                  <button 
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, busType: '' }))}
                    className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 transition-all text-xs font-black ${
                      !filters?.busType
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm ring-1 ring-blue-500/10'
                        : 'bg-white border-slate-200 text-slate-650 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <FiGrid className="text-blue-550 shrink-0 text-[11px]" />
                    <span>Tất cả</span>
                  </button>

                  {filteredBusTypes.map(([key, busType]) => {
                    const isActive = filters?.busType === busType.id
                    return (
                      <button 
                        key={key}
                        type="button"
                        onClick={() => setFilters(prev => ({ ...prev, busType: busType.id }))}
                        className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 transition-all text-xs font-black ${
                          isActive
                            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm ring-1 ring-blue-500/10'
                            : 'bg-white border-slate-200 text-slate-650 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {getVehicleIcon(busType.id)}
                        <div className="text-left">
                          <span className="block leading-none text-[11px] font-bold">{busType.name}</span>
                          <span className="block text-[8px] text-slate-400 mt-0.5 font-semibold">
                            {busType.seats} ghế {busType.standing ? `(+${busType.standing})` : ''}
                          </span>
                        </div>
                        {isActive && <FiCheck className="text-blue-600 shrink-0 ml-0.5" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Departure Time Slots */}
          <div className="border-b border-slate-100/70 pb-5">
            <button 
              className="w-full flex items-center justify-between text-left mb-3 group"
              onClick={() => toggleSection('timeSlot')}
            >
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2 text-xs uppercase tracking-wider">
                <FiClock className="text-blue-500" /> Giờ khởi hành
              </h3>
              <span className="text-slate-400 group-hover:text-blue-500 transition-colors">
                {expandedSections.timeSlot ? <FiChevronDown /> : <FiChevronRight />}
              </span>
            </button>
            {expandedSections.timeSlot && (
              <div className="pl-1">
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, departureTime: '' }))}
                    className={`col-span-2 py-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all text-xs font-black ${
                      !filters?.departureTime
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-650 hover:border-slate-350 hover:bg-slate-50'
                    }`}
                  >
                    <FiClock className="text-blue-500" /> Tất cả các giờ
                  </button>

                  {Object.entries(DEPARTURE_TIMES).map(([key, time]) => {
                    const isActive = filters?.departureTime === key
                    return (
                      <button 
                        key={key}
                        type="button"
                        onClick={() => setFilters(prev => ({ ...prev, departureTime: key }))}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center group ${
                          isActive
                            ? 'bg-blue-50/80 border-blue-500 text-blue-700 shadow-sm ring-2 ring-blue-500/10'
                            : 'bg-white border-slate-200 text-slate-650 hover:border-slate-350 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 text-[11px] font-black group-hover:text-blue-600 transition-colors">
                          {getTimeIcon(key)} {time.label}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">{time.start} - {time.end}</span>
                      </button>
                    )
                  })}
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
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2 text-xs uppercase tracking-wider">
                <FiStar className="text-blue-500" /> Tiện nghi
              </h3>
              <span className="text-slate-400 group-hover:text-blue-500 transition-colors">
                {expandedSections.amenities ? <FiChevronDown /> : <FiChevronRight />}
              </span>
            </button>
            {expandedSections.amenities && (
              <div className="pl-1">
                <div className="flex flex-wrap gap-2">
                  {amenitiesOptions.map(amenity => {
                    const isActive = filters?.amenities?.includes(amenity.id) || false
                    return (
                      <button 
                        key={amenity.id}
                        type="button"
                        onClick={() => handleAmenityChange(amenity.id)}
                        className={`px-3.5 py-2.5 rounded-xl border flex items-center gap-1.5 transition-all text-xs font-black ${
                          isActive
                            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm ring-1 ring-blue-500/10'
                            : 'bg-white border-slate-200 text-slate-650 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {getAmenityIcon(amenity.id)}
                        <span>{amenity.label}</span>
                        {isActive && <FiCheck className="text-blue-600 shrink-0 ml-0.5" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Information Notes */}
          <div className="mt-4 flex items-start gap-2 bg-gradient-to-br from-blue-50/50 to-indigo-50/20 p-4 rounded-2xl border border-blue-100 text-blue-800">
            <FiInfo className="mt-0.5 shrink-0 text-blue-600" />
            <p className="text-xs font-semibold leading-relaxed">
              BusGo là nền tảng đặt vé độc lập, cung cấp lộ trình minh bạch và dịch vụ chất lượng cao.
            </p>
          </div>
        </div> 

        {/* Bottom Sticky Actions */}
        <div className="p-4 border-t border-slate-100 bg-white z-10 shrink-0 flex gap-3">
          <button
            onClick={handleResetFilters}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-extrabold rounded-2xl text-xs transition-colors shadow-sm uppercase tracking-wider"
          >
            <FiRefreshCw />
            Đặt lại
          </button>
          
          {isMobile && (
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl text-xs transition-all shadow-md hover:shadow-lg active:scale-95 uppercase tracking-wider text-center"
            >
              Áp dụng
            </button>
          )}
        </div>
      </>
    )
  }

  return (
    <>
      {/* Desktop Sidebar Layout */}
      {!mobileOnly && (
        <div className="hidden lg:flex bg-white rounded-[28px] border border-slate-200/80 shadow-md flex-col h-[calc(100vh-120px)] sticky top-24 overflow-hidden">
          {renderFilterContent(false)}
        </div>
      )}

      {/* Mobile Drawer Layout */}
      {!desktopOnly && isOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex items-end justify-center">
          {/* Backdrop overlay */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" 
            onClick={onClose}
          ></div>
          
          {/* Bottom Sheet */}
          <div className="relative w-full max-h-[85vh] bg-white rounded-t-[32px] shadow-2xl z-10 flex flex-col overflow-hidden animate-slide-up">
            {renderFilterContent(true)}
          </div>
        </div>
      )}
    </>
  )
}