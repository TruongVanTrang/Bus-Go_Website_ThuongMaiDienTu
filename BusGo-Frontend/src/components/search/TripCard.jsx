import { FiClock, FiStar, FiHeart, FiInfo, FiBookmark } from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TripDetailsModal from './TripDetailsModal'
import { BUS_TYPES } from '../../utils/constants'
import { AuthUtil } from '../../utils/helpers'

export default function TripCard({ trip, onSelect }) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showFavToast, setShowFavToast] = useState(false)
  
  const seatPercentage = (trip.totalSeats - trip.seatsAvailable) / trip.totalSeats * 100

  const navigate = useNavigate()

  // Load favorite status from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('busgo_favorites')
    if (savedFavorites) {
      const favorites = JSON.parse(savedFavorites)
      setIsFavorite(favorites.some(fav => fav.tripId === trip.id))
    }
  }, [trip.id])

  const handleAddToFavorite = (e) => {
    e.stopPropagation()
    
    if (!AuthUtil.isAuthenticated()) {
      alert('Vui lòng đăng nhập để lưu tuyến xe yêu thích!')
      navigate('/login')
      return
    }
    
    let savedFavorites = localStorage.getItem('busgo_favorites')
    let favorites = savedFavorites ? JSON.parse(savedFavorites) : []

    if (isFavorite) {
      // Xóa khỏi yêu thích
      favorites = favorites.filter(fav => fav.tripId !== trip.id)
      setIsFavorite(false)
    } else {
      // Thêm vào yêu thích
      const newFavorite = {
        id: `TRIP${Date.now()}`,
        tripId: trip.id,
        from: trip.from,
        to: trip.to,
        operator: trip.operator,
        busType: trip.busType,
        departureTime: trip.departureTime,
        date: trip.date,
        averageRating: trip.rating,
        price: trip.price,
        type: 'trip'
      }
      favorites.push(newFavorite)
      setIsFavorite(true)

      // Hiện toast thông báo mỗi lần thêm
      setShowFavToast(true)
      setTimeout(() => setShowFavToast(false), 3500)
    }

    localStorage.setItem('busgo_favorites', JSON.stringify(favorites))
  }

  const busTypeName = Object.values(BUS_TYPES).find(b => b.id === trip.busType)?.name || 
    (trip.busType === '16-seater' ? 'Xe 16 chỗ' : trip.busType === '35-seater' ? 'Xe 35 chỗ' : trip.busType || 'Xe khách')

  return (
    <>
      {/* Toast thông báo yêu thích - chỉ hiện lần đầu */}
      {showFavToast && (
        <div className="fixed bottom-4 right-4 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 z-50 animate-fade-in">
          <FiBookmark className="text-blue-400" size={20} />
          <span className="text-sm font-medium">Chuyến xe yêu thích được lưu ở <strong>Lịch sử</strong></span>
        </div>
      )}

      <div className="bg-white rounded-[32px] border border-slate-200/80 hover:border-blue-300 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-350 relative overflow-hidden group">
        
        {/* Ticket Top Notch */}
        <div className="absolute top-0 right-[224px] translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-50 border border-slate-200/80 z-15 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.02)] hidden md:block"></div>
        {/* Ticket Bottom Notch */}
        <div className="absolute bottom-0 right-[224px] translate-x-1/2 translate-y-1/2 w-6 h-6 rounded-full bg-slate-50 border border-slate-200/80 z-15 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] hidden md:block"></div>
        {/* Ticket Dashed Divider Line */}
        <div className="absolute top-6 bottom-6 right-[224px] border-l-2 border-dashed border-slate-200/80 z-10 hidden md:block"></div>

        {/* Favorite Button */}
        <button
          onClick={handleAddToFavorite}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/85 backdrop-blur-sm rounded-full flex items-center justify-center border border-slate-100 hover:bg-slate-50 transition-colors shadow-sm"
          title={isFavorite ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
        >
          <FiHeart
            size={20}
            className={`transition-colors ${isFavorite ? 'text-red-500 fill-red-500' : 'text-slate-400 fill-transparent'}`}
          />
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Main Info (Left) */}
          <div className="flex-1 p-5 md:p-6 md:border-r border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-black text-blue-600 tracking-wider uppercase bg-blue-50 px-2 py-0.5 rounded-md">BusGo</span>
                <span className="text-[10px] font-extrabold text-slate-400">Điều hành bởi BusGo</span>
              </div>
              
              <div className="flex items-center justify-between gap-4 mt-2">
                <div className="text-left flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-3xl font-black text-slate-800 tracking-tight leading-none">{trip.departureTime}</span>
                    <span className="text-[10px] font-extrabold text-blue-600 uppercase bg-blue-50 px-1.5 py-0.5 rounded-md">({new Date(trip.date).toLocaleDateString('vi-VN')})</span>
                  </div>
                  <div className="text-xs font-extrabold text-slate-500 mt-2 truncate max-w-[160px] sm:max-w-none">{trip.from}</div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Khởi hành</span>
                </div>
                
                {/* Visual Trip Progress Timeline */}
                <div className="flex flex-col items-center justify-center px-4 shrink-0">
                  <div className="text-[10px] font-extrabold text-slate-450 mb-1.5 flex items-center gap-1">
                    <FiClock size={11} className="text-blue-500 animate-pulse" /> {trip.duration}
                  </div>
                  <div className="w-20 h-[3px] bg-blue-50 border border-blue-100 rounded-full relative flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.6)] absolute -left-1"></div>
                    <div className="w-2 h-2 rounded-full bg-red-500 absolute -right-1"></div>
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-[#004e92] border-2 border-white rounded-full shadow-sm z-10 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div className="text-[9px] font-extrabold text-blue-500 uppercase tracking-wider mt-2">Trực tiếp</div>
                </div>
                
                <div className="text-right flex-1 min-w-0">
                  <div className="flex items-baseline justify-end gap-1.5 flex-wrap">
                    <span className="text-3xl font-black text-slate-800 tracking-tight leading-none">{trip.arrivalTime}</span>
                  </div>
                  <div className="text-xs font-extrabold text-slate-500 mt-2 truncate max-w-[160px] sm:max-w-none">{trip.to}</div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Điểm đến</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg border border-amber-100">
                  <FiStar size={14} className="fill-amber-500" />
                  <span className="font-bold text-sm">{trip.rating}</span>
                </div>
                <span className="text-[11px] font-bold text-slate-400">({trip.reviewCount || 0} đánh giá)</span>
              </div>
            </div>
          </div>

          {/* Middle Info */}
          <div className="w-full md:w-64 p-5 md:p-6 flex flex-col justify-center gap-5">
            
            <div>
              <div className="text-[10px] font-black text-slate-400 mb-2.5 uppercase tracking-wider">Tiện nghi chuyến xe</div>
              <div className="flex flex-wrap gap-1.5">
                {trip.amenities.map((amenity, idx) => (
                  <span key={idx} className="bg-slate-50 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-full text-[10px] font-extrabold shadow-sm">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tình trạng chỗ</span>
                <span className="text-xs font-black text-slate-700">{trip.seatsAvailable} / {trip.totalSeats} ghế trống</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${trip.seatsAvailable > 5 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  style={{ width: `${100 - seatPercentage}%` }}
                ></div>
              </div>
              <div className="text-[10px] font-extrabold text-blue-600 bg-blue-50/60 border border-blue-100/50 px-2 py-0.5 rounded-md w-fit mt-2 capitalize">
                {busTypeName}
              </div>
            </div>

          </div>

          {/* Price & Action (Right - Ticket Stub) */}
          <div className="w-full md:w-56 p-5 md:p-6 flex flex-col justify-between items-stretch bg-slate-50/20 md:pl-8 text-right relative">
            <div className="w-full text-left md:text-right mt-2 md:mt-0">
              <span className="text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest block">Giá vé từ</span>
              <span className="text-2xl font-black text-blue-600 leading-none block">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(trip.price)}
              </span>
            </div>

            <div className="w-full flex flex-col gap-2.5 mt-6 md:mt-auto">
              <button
                onClick={() => setShowDetailsModal(true)}
                className="w-full py-2.5 bg-blue-50/70 hover:bg-blue-100/70 border border-blue-100 text-blue-700 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-sm"
              >
                <FiInfo size={13} />
                <span>Xem chi tiết</span>
              </button>

              <button
                onClick={onSelect}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-2xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 uppercase tracking-wider"
              >
                Chọn chuyến
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Trip Details Modal */}
      {showDetailsModal && (
        <TripDetailsModal
          trip={trip}
          onClose={() => setShowDetailsModal(false)}
          onBook={(trip) => onSelect()}
        />
      )}
    </>
  )
}
