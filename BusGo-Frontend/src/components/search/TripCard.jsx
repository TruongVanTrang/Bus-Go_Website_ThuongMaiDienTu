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

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
        
        {/* Favorite Button */}
        <button
          onClick={handleAddToFavorite}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-slate-100 hover:bg-slate-50 transition-colors shadow-sm"
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
                <span className="text-sm font-black text-blue-600 tracking-wide uppercase">BusGo</span>
                <span className="text-xs font-medium text-slate-500 px-2 py-0.5 bg-slate-100 rounded-full">Điều hành bởi BusGo</span>
              </div>
              
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-black text-slate-900 leading-none">{trip.departureTime}</span>
                    <span className="text-sm font-bold text-blue-600 mb-0.5">({new Date(trip.date).toLocaleDateString('vi-VN')})</span>
                  </div>
                  <div className="text-sm font-medium text-slate-500 mt-1">{trip.from}</div>
                </div>
                
                <div className="flex flex-col items-center justify-center px-4">
                  <div className="text-xs font-bold text-slate-400 mb-1 flex items-center gap-1">
                    <FiClock /> {trip.duration}
                  </div>
                  <div className="w-16 h-px bg-slate-300 relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-3xl font-black text-slate-900 leading-none">{trip.arrivalTime}</div>
                  <div className="text-sm font-medium text-slate-500 mt-1">{trip.to}</div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-md">
                  <FiStar size={14} className="fill-amber-500" />
                  <span className="font-bold text-sm">{trip.rating}</span>
                </div>
                <span className="text-xs font-medium text-slate-400">({trip.reviewCount || 0} đánh giá)</span>
              </div>
            </div>
          </div>

          {/* Middle Info */}
          <div className="w-full md:w-64 p-5 md:p-6 md:border-r border-slate-100 bg-slate-50/50 flex flex-col justify-center">
            
            <div className="mb-5">
              <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Tiện nghi</div>
              <div className="flex flex-wrap gap-1.5">
                {trip.amenities.map((amenity, idx) => (
                  <span key={idx} className="bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded text-[11px] font-semibold">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ghế trống</span>
                <span className="text-xs font-bold text-slate-700">{trip.seatsAvailable} / {trip.totalSeats}</span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${trip.seatsAvailable > 5 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${100 - seatPercentage}%` }}
                ></div>
              </div>
              <div className="text-[11px] font-medium text-slate-500 mt-1.5 capitalize">
                {busTypeName}
              </div>
            </div>

          </div>

          {/* Price & Action (Right) */}
          <div className="w-full md:w-56 p-5 md:p-6 flex flex-col justify-between items-end bg-white">
            <div className="text-right w-full">
              <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Giá vé</div>
              <div className="text-2xl font-black text-blue-600 leading-none">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(trip.price)}
              </div>
            </div>

            <div className="w-full flex flex-col gap-2 mt-4">
              <button
                onClick={() => setShowDetailsModal(true)}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <FiInfo /> Xem chi tiết
              </button>

              <button
                onClick={onSelect}
                className="w-full py-2.5 bg-slate-900 hover:bg-blue-600 text-white font-bold text-sm rounded-xl transition-colors shadow-sm"
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
