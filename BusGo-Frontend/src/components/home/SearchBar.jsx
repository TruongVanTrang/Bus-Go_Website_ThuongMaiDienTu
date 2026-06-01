import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, CalendarDays, Search, Bus, ChevronDown, Clock, Check } from 'lucide-react'
import { Card, CardBody, Button } from '@nextui-org/react'
import { BUS_CATEGORIES, CITY_STOPS, INTERCITY_ROUTES, DEPARTURE_TIMES } from '../../utils/constants'

export default function SearchBar() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    category: 'city',
    from: '',
    to: '',
    date: '',
    departureTime: ''
  })

  const handleCategorySelect = (categoryId) => {
    setFormData({ category: categoryId, from: '', to: '', date: '', departureTime: '' })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (!formData.from || !formData.to || !formData.date || !formData.category) {
      alert('Vui lòng điền đầy đủ thông tin: Điểm đi, Điểm đến, Ngày đi')
      return
    }
    const params = new URLSearchParams(formData)
    navigate(`/search?${params.toString()}`)
  }

  return (
    <Card
      className="w-full max-w-sm lg:max-w-md shadow-[0_25px_60px_-15px_rgba(30,58,138,0.25)] border border-white/60"
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <CardBody className="p-6 sm:p-7">

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-black text-blue-950 tracking-tight">Tìm chuyến đi</h2>
          <p className="text-slate-500 text-xs mt-1 font-semibold">Đặt vé nhanh chỉ 3 phút</p>
        </div>

        {/* Category Tabs */}
        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl mb-5 border border-slate-200/50">
          {[
            { id: 'city', icon: <Bus size={14} />, label: 'Nội thành' },
            { id: 'interCity', icon: <MapPin size={14} />, label: 'Liên tỉnh' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleCategorySelect(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                formData.category === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/40'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="space-y-4">

          {/* From & To Horizontal Joined */}
          <div className="flex items-center w-full bg-white border border-slate-200 rounded-xl shadow-sm focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100 transition-all">
            {/* From */}
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 z-10 pointer-events-none" size={16} />
              <select
                name="from"
                value={formData.from}
                onChange={handleChange}
                className="w-full pl-9 pr-7 py-3.5 bg-transparent border-r border-slate-200 hover:bg-slate-50 focus:outline-none text-slate-800 font-semibold text-[13px] transition-all cursor-pointer appearance-none rounded-l-xl"
              >
                <option value="" disabled hidden>Điểm đi</option>
                {formData.category === 'city'
                  ? CITY_STOPS.map((stop, i) => <option key={i} value={stop}>{stop}</option>)
                  : Array.from(new Set(INTERCITY_ROUTES.map(r => r.from))).map((city, i) => <option key={i} value={city}>{city}</option>)
                }
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>

            {/* To */}
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-500 z-10 pointer-events-none" size={16} />
              <select
                name="to"
                value={formData.to}
                onChange={handleChange}
                className="w-full pl-9 pr-7 py-3.5 bg-transparent hover:bg-slate-50 focus:outline-none text-slate-800 font-semibold text-[13px] transition-all cursor-pointer appearance-none rounded-r-xl"
              >
                <option value="" disabled hidden>Điểm đến</option>
                {formData.category === 'city'
                  ? CITY_STOPS.map((stop, i) => <option key={i} value={stop}>{stop}</option>)
                  : formData.from
                    ? Array.from(new Set(INTERCITY_ROUTES.filter(r => r.from === formData.from).map(r => r.to))).map((city, i) => <option key={i} value={city}>{city}</option>)
                    : []
                }
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 z-10 pointer-events-none" size={16} />
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full pl-9 pr-2 py-3.5 bg-white border border-slate-200 hover:border-blue-400 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:outline-none rounded-xl text-slate-800 font-semibold text-[13px] transition-all cursor-pointer shadow-sm"
              />
            </div>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 z-10 pointer-events-none" size={16} />
              <select
                name="departureTime"
                value={formData.departureTime}
                onChange={handleChange}
                className="w-full pl-9 pr-7 py-3.5 bg-white border border-slate-200 hover:border-blue-400 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:outline-none rounded-xl text-slate-800 font-semibold text-[13px] transition-all cursor-pointer appearance-none shadow-sm"
              >
                <option value="">Tất cả giờ</option>
                {Object.entries(DEPARTURE_TIMES).map(([key, time]) => (
                  <option key={key} value={key}>{time.start}-{time.end}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
          </div>

          {/* Search Button */}
          <Button
            type="submit"
            className="w-full h-14 bg-blue-600 hover:bg-blue-700
                       text-white font-extrabold text-base rounded-xl
                       shadow-lg shadow-blue-600/25 transition-all duration-300
                       hover:-translate-y-0.5 mt-2"
            size="lg"
            startContent={<Search size={20} />}
          >
            Tìm Vé Ngay
          </Button>
        </form>

        {/* Bottom hints */}
        <div className="flex items-center justify-center gap-4 mt-5">
          {['Miễn phí đặt vé', 'Hoàn tiền 100%'].map((hint) => (
            <span key={hint} className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
              <Check size={12} className="text-blue-600" />
              {hint}
            </span>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}
