import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardBody, Chip } from '@nextui-org/react'
import { FiClock, FiChevronRight, FiTrendingUp, FiStar, FiArrowRight, FiUsers } from 'react-icons/fi'
import { MdDirectionsBus } from 'react-icons/md'
import { StorageUtil } from '../../utils/helpers'

const MOST_BOOKED_ROUTES = [
  { id: 1, from: 'Cầu Rồng', to: 'Phố cổ Hội An', bookings: 1240, avgPrice: 60000, category: 'city', label: 'Nội thành', duration: '~50 phút' },
  { id: 2, from: 'Đà Nẵng', to: 'Huế', bookings: 980, avgPrice: 120000, category: 'interCity', label: 'Liên tỉnh', duration: '~3.5 giờ' },
  { id: 3, from: 'Đà Nẵng', to: 'Quảng Nam', bookings: 756, avgPrice: 80000, category: 'interCity', label: 'Liên tỉnh', duration: '~1.5 giờ' },
]

const HIGH_QUALITY_TRIPS = [
  { id: 'hq-1', from: 'Đà Nẵng', to: 'Huế', rating: 4.9, reviews: 324, amenities: ['AC', 'Wifi', 'Sạc điện'], price: 120000, originalPrice: 150000, discount: 20, busType: 'Xe 35 chỗ', tag: 'Đánh giá cao nhất', departure: '06:00', category: 'interCity' },
  { id: 'hq-2', from: 'Cầu Rồng', to: 'Phố cổ Hội An', rating: 4.7, reviews: 287, amenities: ['AC', 'Wifi'], price: 60000, originalPrice: 60000, discount: 0, busType: 'Xe 16 chỗ', tag: 'Phổ biến nhất', departure: '08:00', category: 'city' },
  { id: 'hq-3', from: 'Đà Nẵng', to: 'Quảng Ngãi', rating: 4.8, reviews: 156, amenities: ['AC', 'Wifi', 'Chăn gối'], price: 150000, originalPrice: 180000, discount: 17, busType: 'Xe 35 chỗ', tag: 'Premium', departure: '07:30', category: 'interCity' },
]

const TAG_STYLE = {
  'Đánh giá cao nhất': 'bg-blue-50 text-blue-700 border-blue-200',
  'Phổ biến nhất':     'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Premium':           'bg-violet-50 text-violet-700 border-violet-200',
}

export default function HomeSuggestions() {
  const [recentActivity, setRecentActivity] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const savedActivity = localStorage.getItem('recentSearches')
    if (savedActivity) {
      try { setRecentActivity(JSON.parse(savedActivity).slice(0, 3)) } catch (e) {}
    }
  }, [])

  const goSearch = (params = {}) => {
    const today = new Date().toISOString().split('T')[0]
    const urlParams = new URLSearchParams()
    if (params.from) urlParams.set('from', params.from)
    if (params.to) urlParams.set('to', params.to)
    urlParams.set('date', params.date || today)
    if (params.category) urlParams.set('category', params.category)
    navigate(`/search?${urlParams.toString()}`)
  }

  return (
    <div className="space-y-20">

      {/* === RECENT ACTIVITY === */}
      {recentActivity.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-5">
            <FiClock size={18} className="text-blue-500" />
            <h3 className="text-lg font-bold text-slate-800">Tìm kiếm gần đây</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {recentActivity.map((activity, idx) => (
              <button key={idx}
                onClick={() => goSearch({ from: activity.from, to: activity.to })}
                className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-200
                           hover:border-blue-300 hover:bg-blue-50 rounded-xl text-sm font-semibold
                           text-slate-700 hover:text-blue-600 transition-all shadow-sm group">
                <MdDirectionsBus size={16} className="text-blue-400" />
                {activity.from} → {activity.to}
                <FiChevronRight size={13} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ================================================================
          SECTION 1: TUYẾN PHỔ BIẾN
          Style: Google Flights "Destination" – Horizontal list với large number rank
      ================================================================ */}
      <section>
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-blue-600 text-sm font-bold uppercase tracking-widest mb-2">Được đặt nhiều nhất</p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Tuyến đường nổi bật</h2>
          </div>
          <button
            onClick={() => navigate('/search')}
            className="hidden sm:flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors">
            Xem tất cả <FiArrowRight size={15} />
          </button>
        </div>

        {/* List – Large Rank Number Style */}
        <div className="space-y-3">
          {MOST_BOOKED_ROUTES.map((route, idx) => (
            <button
              key={route.id}
              onClick={() => goSearch({ from: route.from, to: route.to, category: route.category })}
              className="w-full group flex items-center gap-5 sm:gap-8 px-6 py-5
                         bg-white border border-slate-100 hover:border-blue-200
                         hover:shadow-lg hover:shadow-blue-50 rounded-2xl
                         transition-all duration-200 text-left"
            >
              {/* Rank Number */}
              <div className="flex-shrink-0 w-10 text-center">
                <span className={`text-4xl font-black tabular-nums leading-none
                  ${idx === 0 ? 'text-blue-600' : idx === 1 ? 'text-blue-300' : 'text-slate-200'}`}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
              </div>

              {/* Route */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="font-bold text-slate-900 text-base">{route.from}</span>
                  <FiArrowRight size={14} className="text-blue-400 flex-shrink-0" />
                  <span className="font-bold text-slate-900 text-base">{route.to}</span>
                  <span className="hidden sm:inline-block px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full border border-blue-100">
                    {route.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <span className="flex items-center gap-1">
                    <FiClock size={12} /> {route.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiUsers size={12} /> {route.bookings.toLocaleString()} lượt/tháng
                  </span>
                </div>
              </div>

              {/* Price + Arrow */}
              <div className="flex-shrink-0 flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-medium">Từ</div>
                  <div className="text-blue-600 font-black text-xl">{route.avgPrice.toLocaleString()}đ</div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-blue-600 group-hover:bg-blue-700
                                flex items-center justify-center text-white
                                group-hover:translate-x-0.5 transition-all duration-200">
                  <FiArrowRight size={16} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ================================================================
          SECTION 2: CHUYẾN XE CHẤT LƯỢNG CAO
          Style: Booking.com "Featured Property" – 3 cards dọc có accent bar + rating badge
      ================================================================ */}
      <section>
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-blue-600 text-sm font-bold uppercase tracking-widest mb-2">Được đánh giá tốt nhất</p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Chuyến xe chất lượng cao</h2>
          </div>
          <button
            onClick={() => navigate('/search')}
            className="hidden sm:flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors">
            Tất cả chuyến <FiArrowRight size={15} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {HIGH_QUALITY_TRIPS.map((trip, idx) => (
            <button
              key={trip.id}
              onClick={() => goSearch({ from: trip.from, to: trip.to, category: trip.category })}
              className="group text-left bg-white border border-slate-100
                         hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50/60
                         rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
            >
              {/* Blue accent top bar – varies per card */}
              <div className={`h-1 w-full ${idx === 0 ? 'bg-blue-600' : idx === 1 ? 'bg-blue-400' : 'bg-blue-800'}`} />

              <div className="p-5">
                {/* Tag Row */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${TAG_STYLE[trip.tag]}`}>
                    {trip.tag}
                  </span>
                  {trip.discount > 0 && (
                    <span className="text-[11px] font-black text-white bg-red-500 px-2 py-0.5 rounded-full">
                      -{trip.discount}%
                    </span>
                  )}
                </div>

                {/* Route display */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-lg font-black text-slate-900">{trip.from}</span>
                    <FiArrowRight size={14} className="text-blue-400 flex-shrink-0" />
                    <span className="text-lg font-black text-slate-900">{trip.to}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <MdDirectionsBus size={13} />
                    <span>{trip.busType}</span>
                    <span>·</span>
                    <FiClock size={12} />
                    <span>Khởi hành {trip.departure}</span>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1.5 mb-4">
                  <div className="flex items-center gap-0.5 bg-blue-600 text-white text-xs font-black px-2 py-0.5 rounded-lg">
                    <FiStar size={10} style={{ fill: 'white' }} />
                    <span>{trip.rating}</span>
                  </div>
                  <span className="text-xs text-slate-400">{trip.reviews} đánh giá</span>
                </div>

                {/* Amenities */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {trip.amenities.map((a) => (
                    <span key={a} className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-500">
                      {a}
                    </span>
                  ))}
                </div>

                {/* Price + CTA */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div>
                    {trip.discount > 0 && (
                      <div className="text-xs text-slate-400 line-through">{trip.originalPrice.toLocaleString()}đ</div>
                    )}
                    <div className="text-blue-600 font-black text-xl">{trip.price.toLocaleString()}đ</div>
                  </div>
                  <span className="text-sm font-bold text-blue-600 group-hover:text-blue-700
                                   flex items-center gap-1 transition-colors">
                    Tìm chuyến <FiChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

    </div>
  )
}
