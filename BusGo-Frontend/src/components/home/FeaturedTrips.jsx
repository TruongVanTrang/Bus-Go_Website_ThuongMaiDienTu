import { useNavigate } from 'react-router-dom'

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
    <div className="w-full relative z-10 bg-white py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 border-b border-slate-200 pb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">⭐</span>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Dịch vụ chất lượng cao</h3>
            </div>
            <p className="text-sm font-medium text-slate-500">Được đánh giá xuất sắc bởi hàng ngàn hành khách</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {HIGH_QUALITY_TRIPS.map((trip) => (
            <div 
              key={trip.id} 
              className="bg-white rounded-2xl border border-slate-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-blue-200 transition-all duration-300 relative flex flex-col"
            >
              {/* Discount Badge */}
              {trip.discount > 0 && (
                <div className="absolute -top-3 -right-3 w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg border-2 border-white z-10">
                  -{trip.discount}%
                </div>
              )}
              
              {/* Header: Tag & Rating */}
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                <div className="inline-block bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                  {trip.tag}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-400 text-sm">★</span>
                  <span className="font-bold text-slate-900 text-sm">{trip.rating}</span>
                  <span className="text-[11px] font-medium text-slate-400">({trip.reviews})</span>
                </div>
              </div>
              
              {/* Body: Route & Info */}
              <div className="p-4 flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1">
                    <div className="text-[11px] font-medium text-slate-400 mb-0.5">Từ</div>
                    <div className="text-sm font-bold text-slate-900 truncate">{trip.from}</div>
                  </div>
                  <div className="px-2 text-slate-300 text-sm">→</div>
                  <div className="flex-1 text-right">
                    <div className="text-[11px] font-medium text-slate-400 mb-0.5">Đến</div>
                    <div className="text-sm font-bold text-slate-900 truncate">{trip.to}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-semibold">
                    {trip.busType}
                  </span>
                  <span className="text-[10px] text-slate-400">•</span>
                  <span className="text-[11px] font-semibold text-slate-600">Khởi hành: {trip.departure}</span>
                </div>
                
                <div className="flex flex-wrap gap-1.5">
                  {trip.amenities.map((amenity, idx) => (
                    <span key={idx} className="text-slate-500 text-[10px] flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                      {amenity === 'Wifi' && '📡 '}
                      {amenity === 'AC' && '❄️ '}
                      {amenity === 'Phone Charger' && '🔌 '}
                      {amenity === 'Pillow & Blanket' && '🛏️ '}
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Footer: Price & Button */}
              <div className="p-4 pt-0 mt-auto flex items-end justify-between">
                <div>
                  {trip.discount > 0 ? (
                    <div className="flex flex-col">
                      <span className="text-[10px] font-medium text-slate-400 line-through mb-0.5">{trip.originalPrice.toLocaleString()}đ</span>
                      <span className="text-lg font-black text-blue-600">{trip.price.toLocaleString()}đ</span>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <span className="text-[10px] font-medium text-slate-500 mb-0.5">Giá vé</span>
                      <span className="text-lg font-black text-blue-600">{trip.price.toLocaleString()}đ</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => goSearch({ from: trip.from, to: trip.to, category: trip.category })}
                  className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
                >
                  Chọn chuyến
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
