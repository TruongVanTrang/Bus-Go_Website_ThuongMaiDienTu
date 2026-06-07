import { useNavigate } from 'react-router-dom'
import { FiStar, FiAward, FiTrendingUp, FiArrowRight, FiWifi, FiZap } from 'react-icons/fi'
import { MdAcUnit, MdLocalFireDepartment } from 'react-icons/md'

const HIGH_QUALITY_TRIPS = [
  {
    id: 'hq-1',
    from: 'Đà Nẵng', to: 'Huế',
    rating: 4.9, reviews: 324,
    amenities: ['AC', 'Wifi', 'Phone Charger'],
    price: 120000, originalPrice: 150000, discount: 20,
    busType: 'Xe 35 chỗ', tag: 'Đánh giá cao',
    departure: '06:00', category: 'interCity'
  },
  {
    id: 'hq-2',
    from: 'Cầu Rồng', to: 'Phố cổ Hội An',
    rating: 4.7, reviews: 287,
    amenities: ['AC', 'Wifi'],
    price: 60000, originalPrice: 60000, discount: 0,
    busType: 'Xe 16 chỗ', tag: 'Phổ biến nhất',
    departure: '08:00', category: 'city'
  },
  {
    id: 'hq-3',
    from: 'Đà Nẵng', to: 'Quảng Ngãi',
    rating: 4.8, reviews: 156,
    amenities: ['AC', 'Wifi', 'Pillow & Blanket'],
    price: 150000, originalPrice: 180000, discount: 17,
    busType: 'Xe 35 chỗ', tag: 'Dịch vụ VIP',
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
    <div className="w-full bg-[#f8fafc] py-12 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mb-8 flex items-center gap-2">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shadow-sm">
            <FiStar className="fill-blue-600 text-blue-600" size={20} />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#0c3d66] uppercase tracking-wide">Dịch vụ chất lượng cao</h3>
            <p className="text-sm font-semibold text-slate-400 mt-1">Các chuyến đi chất lượng vượt trội được hành khách bầu chọn</p>
          </div>
        </div>
        
        {/* Trips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {HIGH_QUALITY_TRIPS.map((trip) => (
            <div 
              key={trip.id} 
              className="group bg-white border border-slate-200/60 rounded-[32px] p-6 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden h-[380px]"
              onClick={() => goSearch({ from: trip.from, to: trip.to, category: trip.category })}
            >
              {/* Ticket Left Notch */}
              <div className="absolute -left-3.5 bottom-[84px] w-7 h-7 rounded-full bg-[#f8fafc] border border-slate-200/60 z-15 shadow-[inset_-3px_0_6px_rgba(0,0,0,0.02)]"></div>
              {/* Ticket Right Notch */}
              <div className="absolute -right-3.5 bottom-[84px] w-7 h-7 rounded-full bg-[#f8fafc] border border-slate-200/60 z-15 shadow-[inset_3px_0_6px_rgba(0,0,0,0.02)]"></div>
              {/* Ticket Dashed Separator Line */}
              <div className="absolute left-6 right-6 bottom-[98px] border-t-2 border-dashed border-slate-200/80 z-10"></div>

              <div className="flex-1 flex flex-col justify-between pb-6">
                <div>
                  {/* Card Header */}
                  <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
                      <FiAward size={12} />
                      {trip.tag}
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full text-[10px] border border-amber-100 font-bold">
                      <FiStar className="text-amber-500 fill-amber-500" size={11} />
                      <span className="text-slate-800">{trip.rating}</span>
                      <span className="text-slate-400 font-semibold">({trip.reviews})</span>
                    </div>
                  </div>
                  
                  {/* Route Info */}
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-[9px] font-bold text-slate-450 uppercase tracking-widest mb-1">Khởi hành</div>
                      <div className="text-base font-black text-slate-850 truncate">{trip.from}</div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 border border-slate-100 shadow-inner">
                      <FiArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <div className="text-[9px] font-bold text-slate-450 uppercase tracking-widest mb-1">Điểm đến</div>
                      <div className="text-base font-black text-slate-850 truncate">{trip.to}</div>
                    </div>
                  </div>
                  
                  {/* Bus Type and Departure */}
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-blue-50/60 text-[#0c3d66] border border-blue-100/50 shadow-sm">
                      {trip.busType}
                    </span>
                    <span className="text-[10px] font-extrabold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                      🕐 {trip.departure}
                    </span>
                  </div>
                </div>
                
                {/* Amenities */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {trip.amenities.map((amenity, aIdx) => {
                    let icon = null
                    if (amenity === 'Wifi') icon = <FiWifi size={10} />
                    else if (amenity === 'AC') icon = <MdAcUnit size={10} />
                    else if (amenity === 'Phone Charger') icon = <FiZap size={10} />
                    else if (amenity === 'Pillow & Blanket') icon = '🛏️'
                    
                    return (
                      <div key={aIdx} className="flex items-center gap-1.5 text-[9px] font-extrabold text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                        {icon}
                        <span>{amenity}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              {/* Card Footer (Ticket Stub) */}
              <div className="h-[74px] flex items-center justify-between gap-4 pt-2">
                <div className="min-w-0 text-left">
                  {trip.discount > 0 ? (
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-slate-400 line-through mb-0.5">{(trip.originalPrice).toLocaleString()}đ</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-red-500">{(trip.price).toLocaleString()}đ</span>
                        <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md border border-red-100 font-sans">-{trip.discount}%</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Giá vé</span>
                      <span className="text-xl font-black text-[#0c3d66]">{(trip.price).toLocaleString()}đ</span>
                    </div>
                  )}
                </div>
                
                <button className="px-5 py-2.5 bg-blue-600 text-white font-extrabold text-xs rounded-2xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/10 transition-all flex items-center gap-1.5 shadow-md shrink-0">
                  <span>Đặt ngay</span>
                  <FiArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
