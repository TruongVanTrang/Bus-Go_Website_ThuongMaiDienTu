import { useNavigate } from 'react-router-dom'
import { FiStar, FiAward, FiTrendingUp, FiArrowRight, FiWifi, FiZap } from 'react-icons/fi'
import { MdAcUnit, MdLocalFireDepartment } from 'react-icons/md'

// Chuyến xe chất lượng cao (đánh giá cao nhất, tuyến thực tế)
const HIGH_QUALITY_TRIPS = [
  {
    id: 'hq-1',
    from: 'Đà Nẵng', to: 'Huế',
    rating: 4.9, reviews: 324,
    amenities: ['AC', 'Wifi', 'Phone Charger'],
    price: 120000, originalPrice: 150000, discount: 20,
    busType: 'Xe 35 chỗ', tag: 'BEST RATED',
    departure: '06:00', category: 'interCity'
  },
  {
    id: 'hq-2',
    from: 'Cầu Rồng', to: 'Phố cổ Hội An',
    rating: 4.7, reviews: 287,
    amenities: ['AC', 'Wifi'],
    price: 60000, originalPrice: 60000, discount: 0,
    busType: 'Xe 16 chỗ', tag: 'POPULAR',
    departure: '08:00', category: 'city'
  },
  {
    id: 'hq-3',
    from: 'Đà Nẵng', to: 'Quảng Ngãi',
    rating: 4.8, reviews: 156,
    amenities: ['AC', 'Wifi', 'Pillow & Blanket'],
    price: 150000, originalPrice: 180000, discount: 17,
    busType: 'Xe 35 chỗ', tag: 'PREMIUM',
    departure: '07:30', category: 'interCity'
  }
]

export default function FeaturedTrips() {
  const navigate = useNavigate()

  const goSearch = (params = {}) => {
    const today = new Date().toISOString().split('T')[0]
    const urlParams = new URLSearchParams()
    if (params.from) urlParams.set('from', params.from)
    if (params.to) urlParams.set('to', params.to)
    if (params.date) urlParams.set('date', params.date)
    else if (params.needDate !== false) urlParams.set('date', today)
    if (params.category) urlParams.set('category', params.category)
    navigate(`/search?${urlParams.toString()}`)
  }

  return (
    <div className="w-full relative z-10 bg-gradient-to-b from-white via-blue-50/30 to-white py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 border-b border-slate-200 pb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-lg">
                <FiStar className="text-white" size={24} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Dịch vụ chất lượng cao</h3>
            </div>
            <p className="text-sm font-medium text-slate-500">Được đánh giá xuất sắc bởi hàng ngàn hành khách</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {HIGH_QUALITY_TRIPS.map((trip, idx) => (
            <div 
              key={trip.id} 
              className="group relative rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
              onClick={() => goSearch({ from: trip.from, to: trip.to, category: trip.category })}
            >
              {/* Background gradient based on index */}
              <div className={`absolute inset-0 bg-gradient-to-br ${
                idx === 0 ? 'from-blue-500 via-indigo-500 to-purple-600' :
                idx === 1 ? 'from-emerald-500 via-teal-500 to-cyan-600' :
                'from-amber-500 via-orange-500 to-red-600'
              } opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

              {/* White card */}
              <div className="relative z-10 bg-white rounded-xl border border-slate-200 group-hover:border-transparent transition-colors overflow-hidden flex flex-col h-full">
                
                {/* Header with tag and rating */}
                <div className="p-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-50/50 flex justify-between items-center gap-2">
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                    idx === 0 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    idx === 1 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {idx === 0 && <MdLocalFireDepartment size={12} />}
                    {idx === 1 && <FiTrendingUp size={12} />}
                    {idx === 2 && <FiAward size={12} />}
                    {trip.tag}
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded text-[10px]">
                    <FiStar className="text-amber-400 fill-amber-400" size={12} />
                    <span className="font-bold text-slate-900">{trip.rating}</span>
                    <span className="font-medium text-slate-500">({trip.reviews})</span>
                  </div>
                </div>
                
                {/* Body */}
                <div className="p-3 flex-1">
                  {/* Route */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Từ</div>
                      <div className="text-sm font-black text-slate-900 truncate">{trip.from}</div>
                    </div>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 flex-shrink-0 ${
                      idx === 0 ? 'bg-blue-50 border-blue-200 text-blue-600' :
                      idx === 1 ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                      'bg-amber-50 border-amber-200 text-amber-600'
                    }`}>
                      <FiArrowRight size={14} className="font-bold" />
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Đến</div>
                      <div className="text-sm font-black text-slate-900 truncate">{trip.to}</div>
                    </div>
                  </div>
                  
                  {/* Trip details */}
                  <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      idx === 0 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      idx === 1 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {trip.busType}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      🕐 {trip.departure}
                    </span>
                  </div>
                  
                  {/* Amenities */}
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {trip.amenities.slice(0, 2).map((amenity, idx) => {
                      let icon = null
                      if (amenity === 'Wifi') icon = <FiWifi size={10} />
                      else if (amenity === 'AC') icon = <MdAcUnit size={10} />
                      else if (amenity === 'Phone Charger') icon = <FiZap size={10} />
                      else if (amenity === 'Pillow & Blanket') icon = '🛏️'
                      
                      return (
                        <div key={idx} className="flex items-center gap-0.5 text-[9px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-1 rounded border border-slate-200">
                          {icon}
                          <span>{amenity}</span>
                        </div>
                      )
                    })}
                    {trip.amenities.length > 2 && (
                      <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-1 rounded">
                        +{trip.amenities.length - 2}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Footer with price and button */}
                <div className="p-3 pt-0 mt-auto flex items-end justify-between border-t border-slate-100 gap-2">
                  <div className="min-w-0">
                    {trip.discount > 0 ? (
                      <div className="flex flex-col">
                        <span className="text-[9px] font-medium text-slate-400 line-through mb-0.5">{trip.originalPrice.toLocaleString()}đ</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">{trip.price.toLocaleString()}đ</span>
                          <span className="text-[8px] font-bold text-red-500 bg-red-50 px-1 py-0.5 rounded">-{trip.discount}%</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-[9px] font-medium text-slate-500 mb-0.5">Giá vé</span>
                        <span className="text-base font-black text-slate-900">{trip.price.toLocaleString()}đ</span>
                      </div>
                    )}
                  </div>
                  <button className={`px-3 py-1.5 font-bold text-[10px] rounded transition-all flex items-center gap-1 border-2 flex-shrink-0 ${
                    idx === 0 ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' :
                    idx === 1 ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700' :
                    'bg-amber-600 text-white border-amber-600 hover:bg-amber-700'
                  }`}>
                    Chọn <FiArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:translate-x-full pointer-events-none"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
