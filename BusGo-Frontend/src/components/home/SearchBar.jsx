import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiMapPin, FiCalendar, FiClock } from 'react-icons/fi'
import { CITY_STOPS, INTERCITY_ROUTES, DEPARTURE_TIMES } from '../../utils/constants'

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

  const popularRoutePills = [
    { label: 'Nội thành Đà Nẵng', state: { category: 'city', from: 'Đà Nẵng' } },
    { label: 'Đà Nẵng → Huế', state: { category: 'interCity', from: 'Đà Nẵng', to: 'Huế' } },
    { label: 'Đà Nẵng → Quảng Nam', state: { category: 'interCity', from: 'Đà Nẵng', to: 'Quảng Nam' } }
  ]

  return (
    <div 
      className="relative w-full min-h-[640px] md:h-[720px] flex items-center py-12 md:py-0 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/banner.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] z-10"></div>
      
      <div className="relative z-20 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Left Column: Heading and Stats */}
        <div className="lg:col-span-7 flex flex-col justify-center text-left text-white h-full">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-bold border border-white/15 mb-6 w-fit shadow-sm">
            <span className="text-[#0066cc] animate-pulse">●</span> Nền tảng đặt vé #1 miền Trung
          </div>

          <h1 className="text-4xl md:text-[54px] font-black leading-[1.12] tracking-tight mb-6">
            Đặt vé xe<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[#3b82f6] drop-shadow-sm">thông minh</span> cực<br />
            nhanh
          </h1>

          <p className="text-slate-200 text-sm md:text-base font-medium max-w-lg mb-8 leading-relaxed">
            Tìm kiếm và đặt vé xe bus, xe khách liên tỉnh chỉ trong vài giây. An toàn · Tiện lợi · Giá tốt nhất.
          </p>

          {/* Quick Route Pills */}
          <div className="flex flex-wrap gap-2.5 mb-8 md:mb-12">
            {popularRoutePills.map((pill, idx) => (
              <button
                key={idx}
                type="button"
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-[12px] font-bold border border-white/20 transition-all shadow-sm"
                onClick={() => navigate('/search', { state: pill.state })}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-4 gap-4 pt-8 border-t border-white/10 w-full max-w-lg">
            <div>
              <div className="text-xl md:text-2xl font-black">100K+</div>
              <div className="text-white/60 text-[10px] md:text-[11px] font-bold uppercase mt-1 leading-snug">Khách hàng<br />tin dùng</div>
            </div>
            <div>
              <div className="text-xl md:text-2xl font-black">500+</div>
              <div className="text-white/60 text-[10px] md:text-[11px] font-bold uppercase mt-1 leading-snug">Tuyến đường</div>
            </div>
            <div>
              <div className="text-xl md:text-2xl font-black">4.9</div>
              <div className="text-white/60 text-[10px] md:text-[11px] font-bold uppercase mt-1 leading-snug">Đánh giá<br />trung bình</div>
            </div>
            <div>
              <div className="text-xl md:text-2xl font-black">24/7</div>
              <div className="text-white/60 text-[10px] md:text-[11px] font-bold uppercase mt-1 leading-snug">Hỗ trợ<br />khách hàng</div>
            </div>
          </div>
        </div>

        {/* Right Column: Search Card */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="w-full max-w-[400px] bg-slate-50/95 backdrop-blur-md rounded-[40px] shadow-2xl p-5 md:p-6 border border-slate-100/10">
            <div className="text-center mb-5">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Tìm chuyến đi</h2>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">Đặt vé nhanh chỉ 3 phút</p>
            </div>

            {/* Category Tabs */}
            <div className="flex bg-slate-200/50 p-1 rounded-3xl mb-5">
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-extrabold text-[11px] transition-all duration-200 ${
                  formData.category === 'city' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => handleCategorySelect('city')}
              >
                <span>🚌</span>
                Nội thành
              </button>
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-extrabold text-[11px] transition-all duration-200 ${
                  formData.category === 'interCity' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => handleCategorySelect('interCity')}
              >
                <span>🗺️</span>
                Liên tỉnh
              </button>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="space-y-3.5">
              {/* Form Grid */}
              <div className="grid grid-cols-2 gap-3.5">
                {/* From */}
                <div className="relative flex flex-col">
                  <span className="absolute left-4 top-[22px] -translate-y-1/2 text-slate-400 pointer-events-none z-10">
                    <FiMapPin size={14} />
                  </span>
                  <select
                    className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-2xl text-[11px] text-slate-800 font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer appearance-none shadow-sm h-[44px]"
                    name="from"
                    value={formData.from}
                    onChange={handleChange}
                  >
                    <option value="">Điểm đi</option>
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
                  <span className="absolute right-3.5 top-[22px] -translate-y-1/2 pointer-events-none text-slate-400 text-[9px]">▼</span>
                </div>

                {/* To */}
                <div className="relative flex flex-col">
                  <span className="absolute left-4 top-[22px] -translate-y-1/2 text-slate-400 pointer-events-none z-10">
                    <FiMapPin size={14} />
                  </span>
                  <select
                    className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-2xl text-[11px] text-slate-800 font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer appearance-none shadow-sm h-[44px]"
                    name="to"
                    value={formData.to}
                    onChange={handleChange}
                  >
                    <option value="">Điểm đến</option>
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
                  <span className="absolute right-3.5 top-[22px] -translate-y-1/2 pointer-events-none text-slate-400 text-[9px]">▼</span>
                </div>

                {/* Date */}
                <div className="relative flex flex-col">
                  <span className="absolute left-4 top-[22px] -translate-y-1/2 text-slate-400 pointer-events-none z-10">
                    <FiCalendar size={14} />
                  </span>
                  <input
                    type="date"
                    className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-2xl text-[11px] text-slate-800 font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer shadow-sm h-[44px]"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* Departure Time */}
                <div className="relative flex flex-col">
                  <span className="absolute left-4 top-[22px] -translate-y-1/2 text-slate-400 pointer-events-none z-10">
                    <FiClock size={14} />
                  </span>
                  <select
                    className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-2xl text-[11px] text-slate-800 font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer appearance-none shadow-sm h-[44px]"
                    name="departureTime"
                    value={formData.departureTime}
                    onChange={handleChange}
                  >
                    <option value="">Tất cả giờ</option>
                    {Object.entries(DEPARTURE_TIMES).map(([key, time]) => (
                      <option key={key} value={key}>
                        {time.label}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-3.5 top-[22px] -translate-y-1/2 pointer-events-none text-slate-400 text-[9px]">▼</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-2xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex justify-center items-center gap-2 text-xs uppercase tracking-wider h-[46px]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Tìm Vé Ngay</span>
              </button>

              {/* Checkbox marks */}
              <div className="flex justify-center gap-6 text-[10px] text-slate-500 font-bold pt-1">
                <span className="flex items-center gap-1.5">
                  <span className="text-blue-600 text-xs">✓</span> Miễn phí đặt vé
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-blue-600 text-xs">✓</span> Hoàn tiền 100%
                </span>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  )
}
