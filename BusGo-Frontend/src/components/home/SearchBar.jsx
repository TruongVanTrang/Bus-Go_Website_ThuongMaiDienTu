import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiMapPin, FiCalendar, FiClock } from 'react-icons/fi'
import { BUS_CATEGORIES, BUS_TYPES, CITY_STOPS, INTERCITY_ROUTES, DEPARTURE_TIMES } from '../../utils/constants'

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
    { id: 1, icon: '🚐', label: 'Xe 16 chỗ cao cấp', state: { busType: 'mini_16' } },
    { id: 5, icon: '🛏️', label: 'Xe giường nằm', state: { busType: 'sleeper_36' } },
    { id: 2, icon: '📡', label: 'Có WiFi & Sạc', state: { amenities: ['Wifi', 'Phone Charger'] } },
    { id: 3, icon: '🌙', label: 'Chuyến đêm', state: { departureTime: 'night' } },
    { id: 4, icon: '💰', label: 'Giá dưới 200k', state: { priceRange: [0, 200000] } },
    { id: 6, icon: '🚌', label: 'Xe 35 chỗ', state: { busType: 'coach_29_35' } }
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
    <div 
      className="relative w-full min-h-[600px] flex items-center justify-center bg-cover bg-center py-20 px-4"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop')" }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40"></div>
      
      <div className="relative z-10 w-full max-w-6xl flex flex-col items-center">
        
        <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 text-center drop-shadow-md">
          Tìm và đặt vé xe thông minh dễ dàng
        </h1>
        <p className="text-lg md:text-xl text-white/95 mb-8 text-center font-medium drop-shadow">
          Khám phá các tuyến xe nội - ngoại thành Đà Nẵng của chúng tôi - BusGo
        </p>

        {/* Smart Suggestion Tags */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10 w-full max-w-4xl">
          <span className="text-white font-bold text-sm uppercase tracking-wide drop-shadow-md hidden md:inline-block mr-2">Tìm kiếm nhanh:</span>
          {smartTags.map(tag => (
            <button
              key={tag.id}
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/40 rounded-full text-white text-sm font-semibold transition-all backdrop-blur-md shadow-sm"
              onClick={() => {
                setShowSmartTags(false)
                navigate('/search', { state: tag.state })
              }}
              title={tag.label}
            >
              <span>{tag.icon}</span>
              <span>{tag.label}</span>
            </button>
          ))}
        </div>

        {/* Search Card */}
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl p-6 md:p-8 animate-[fadeIn_0.5s_ease-out]">
          {/* Category Tabs */}
          <div className="flex justify-center md:justify-start gap-4 mb-6 border-b border-slate-100 pb-4">
            <button
              type="button"
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[15px] transition-all ${
                formData.category === 'city' 
                ? 'bg-primary-50 text-primary-600 border-2 border-primary-500 shadow-sm' 
                : 'bg-white text-slate-500 hover:bg-slate-50 border-2 border-transparent'
              }`}
              onClick={() => handleCategorySelect('city')}
            >
              <span className="text-xl">🏢</span>
              Tuyến Nội thành
            </button>
            <button
              type="button"
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[15px] transition-all ${
                formData.category === 'interCity' 
                ? 'bg-primary-50 text-primary-600 border-2 border-primary-500 shadow-sm' 
                : 'bg-white text-slate-500 hover:bg-slate-50 border-2 border-transparent'
              }`}
              onClick={() => handleCategorySelect('interCity')}
            >
              <span className="text-xl">🗺️</span>
              Tuyến Ngoại thành
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* From */}
            <div className="flex flex-col gap-2">
              <label className="font-bold text-slate-700 text-[13px] uppercase tracking-wide flex items-center gap-2">
                <FiMapPin className="text-primary-500 w-4 h-4" />
                Điểm đi
              </label>
              <select
                className="w-full border border-slate-300 rounded-xl px-4 py-3.5 text-[15px] text-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all cursor-pointer bg-slate-50 hover:bg-white"
                name="from"
                value={formData.from}
                onChange={handleChange}
              >
                <option value="">-- Chọn điểm đi --</option>
                {formData.category === 'city' ? (
                  CITY_STOPS.map((stop, idx) => (
                    <option key={idx} value={stop}>{stop}</option>
                  ))
                ) : (
                  Array.from(new Set(INTERCITY_ROUTES.map(r => r.from))).map((city, idx) => (
                    <option key={idx} value={city}>{city}</option>
                  ))
                )}
              </select>
            </div>

            {/* To */}
            <div className="flex flex-col gap-2">
              <label className="font-bold text-slate-700 text-[13px] uppercase tracking-wide flex items-center gap-2">
                <FiMapPin className="text-primary-500 w-4 h-4" />
                Điểm đến
              </label>
              <select
                className="w-full border border-slate-300 rounded-xl px-4 py-3.5 text-[15px] text-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all cursor-pointer bg-slate-50 hover:bg-white"
                name="to"
                value={formData.to}
                onChange={handleChange}
              >
                <option value="">-- Chọn điểm đến --</option>
                {formData.category === 'city' ? (
                  CITY_STOPS.map((stop, idx) => (
                    <option key={idx} value={stop}>{stop}</option>
                  ))
                ) : (
                  formData.from && Array.from(new Set(INTERCITY_ROUTES.filter(r => r.from === formData.from).map(r => r.to))).map((city, idx) => (
                    <option key={idx} value={city}>{city}</option>
                  ))
                )}
              </select>
            </div>

            {/* Date */}
            <div className="flex flex-col gap-2">
              <label className="font-bold text-slate-700 text-[13px] uppercase tracking-wide flex items-center gap-2">
                <FiCalendar className="text-primary-500 w-4 h-4" />
                Ngày đi
              </label>
              <input
                type="date"
                className="w-full border border-slate-300 rounded-xl px-4 py-3.5 text-[15px] text-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all cursor-pointer bg-slate-50 hover:bg-white"
                name="date"
                value={formData.date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Departure Time */}
            <div className="flex flex-col gap-2">
              <label className="font-bold text-slate-700 text-[13px] uppercase tracking-wide flex items-center gap-2">
                <FiClock className="text-primary-500 w-4 h-4" />
                Giờ khởi hành
              </label>
              <select
                className="w-full border border-slate-300 rounded-xl px-4 py-3.5 text-[15px] text-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all cursor-pointer bg-slate-50 hover:bg-white"
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

            {/* Submit Button */}
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex justify-center items-center gap-2 h-[50px] md:h-[54px]"
              >
                Tìm vé xe
              </button>
            </div>
          </form>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 md:gap-12 mt-12 pt-8 border-t border-white/20 w-full max-w-4xl">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-extrabold text-white mb-1 drop-shadow-sm">500+</div>
            <div className="text-white/90 text-sm md:text-base font-medium">Tuyến đường</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-extrabold text-white mb-1 drop-shadow-sm">10,000+</div>
            <div className="text-white/90 text-sm md:text-base font-medium">Chuyến/ngày</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-extrabold text-white mb-1 drop-shadow-sm">100K+</div>
            <div className="text-white/90 text-sm md:text-base font-medium">Khách hài lòng</div>
          </div>
        </div>

      </div>
    </div>
  )
}
