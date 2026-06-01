import { useEffect } from 'react'
import { FiX, FiClock, FiEdit2, FiWifi, FiCheck } from 'react-icons/fi'
import BusStopTimeline from './BusStopTimeline'
import { BUS_TYPES } from '../../utils/constants'

export default function TripDetailsModal({ trip, onClose, onBook }) {
  // Khóa scroll body khi modal mở
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  if (!trip) return null

  const progressStops = trip.stops || []
  const busTypeName = Object.values(BUS_TYPES).find(b => b.id === trip.busType)?.name || 
    (trip.busType === '16-seater' ? 'Xe 16 chỗ' : trip.busType === '35-seater' ? 'Xe 35 chỗ' : trip.busType || 'Xe khách')

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-900">Chi tiết chuyến xe</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Route & Info */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Trip Time Info */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-3xl font-black text-slate-900 mb-1">{trip.departureTime}</div>
                  <div className="text-sm font-medium text-slate-500">{trip.from}</div>
                </div>
                
                <div className="flex flex-col items-center px-4">
                  <div className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1 bg-white px-2 py-1 rounded-full border border-slate-200">
                    <FiClock /> {trip.duration}
                  </div>
                  <div className="w-24 h-px bg-slate-300 relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500"></div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-3xl font-black text-slate-900 mb-1">{trip.arrivalTime}</div>
                  <div className="text-sm font-medium text-slate-500">{trip.to}</div>
                </div>
              </div>

              {/* Grid Info */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Thông tin chung</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nhà xe</div>
                    <div className="font-bold text-slate-800">{trip.operator}</div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Loại xe</div>
                    <div className="font-bold text-slate-800 capitalize">{busTypeName}</div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ghế trống</div>
                    <div className="font-bold text-green-600">{trip.seatsAvailable} <span className="text-slate-400 text-sm">/ {trip.totalSeats}</span></div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Đánh giá</div>
                    <div className="font-bold text-amber-500 flex items-center gap-1">
                      ⭐ {trip.rating} <span className="text-slate-400 text-xs ml-1">({trip.reviewCount || 0})</span>
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-2 bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Giá vé</div>
                    <div className="font-black text-2xl text-blue-600 leading-none">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(trip.price)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Mô tả chuyến xe</h3>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 text-sm font-medium text-slate-600 leading-relaxed">
                  {trip.description || 'Chuyến xe chất lượng cao với đầy đủ tiện nghi, đảm bảo mang đến trải nghiệm thoải mái nhất cho hành khách trên suốt hành trình.'}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Tiện nghi có sẵn</h3>
                <div className="flex flex-wrap gap-2">
                  {trip.amenities.map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
                      {amenity.includes('Wifi') && <FiWifi className="text-blue-500" />}
                      {amenity.includes('AC') && <span>❄️</span>}
                      {amenity.includes('Charger') && <span>🔌</span>}
                      {amenity.includes('Blanket') && <span>🛏️</span>}
                      {amenity.includes('Toilet') && <span>🚽</span>}
                      {amenity.includes('Pillow') && <span>🛌</span>}
                      <span className="text-xs font-bold text-slate-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Timeline */}
            <div className="lg:col-span-5">
              {progressStops && progressStops.length > 0 ? (
                <div className="sticky top-0">
                  <BusStopTimeline stops={progressStops} />
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center text-slate-500 font-medium h-full flex items-center justify-center">
                  Thông tin lộ trình chi tiết đang được cập nhật
                </div>
              )}
            </div>

          </div>
          
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-end gap-3">
          <button 
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
            onClick={onClose}
          >
            Đóng lại
          </button>
          <button
            className="px-8 py-2.5 bg-slate-900 hover:bg-blue-600 text-white font-bold rounded-xl flex items-center gap-2 transition-colors shadow-md"
            onClick={() => {
              onBook(trip)
              onClose()
            }}
          >
            <FiCheck size={18} />
            Đặt chuyến này
          </button>
        </div>
      </div>
    </div>
  )
}
