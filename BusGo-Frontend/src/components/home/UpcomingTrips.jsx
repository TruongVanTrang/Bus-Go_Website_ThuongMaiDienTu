import { useNavigate } from 'react-router-dom'
import { FiArrowRight, FiStar, FiClock, FiZap } from 'react-icons/fi'
import { MdDirectionsBus } from 'react-icons/md'
import { Button } from '@nextui-org/react'

const upcomingTrips = [
  { id: 1, from: 'Đà Nẵng', to: 'Huế', departureTime: '06:00', arrivalTime: '09:30', price: 120000, busType: 'Toyota 16 chỗ', rating: 4.8, amenities: ['Wifi', 'AC', 'Sạc điện'], occupancy: 0.85, seatsLeft: 3 },
  { id: 2, from: 'Đà Nẵng', to: 'Hội An', departureTime: '07:00', arrivalTime: '07:50', price: 80000, busType: 'Thaco 35 chỗ', rating: 4.6, amenities: ['AC', 'Toilet'], occupancy: 0.65, seatsLeft: 12 },
  { id: 3, from: 'Đà Nẵng', to: 'Quảng Ngãi', departureTime: '08:30', arrivalTime: '10:15', price: 95000, busType: 'Hyundai 24 chỗ', rating: 4.7, amenities: ['Wifi', 'AC'], occupancy: 0.45, seatsLeft: 20 },
  { id: 4, from: 'Đà Nẵng', to: 'Nha Trang', departureTime: '22:00', arrivalTime: '06:30+1', price: 250000, busType: 'Limousine 16 chỗ', rating: 4.9, amenities: ['Wifi', 'Ghế nằm'], occupancy: 0.70, seatsLeft: 5 },
]

// Tính khoảng cách % trên thanh timeline
const TIME_POSITIONS = {
  '06:00': 10, '07:00': 22, '08:30': 38, '22:00': 90,
}

export default function UpcomingTrips() {
  const navigate = useNavigate()

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-blue-600 text-sm font-bold uppercase tracking-widest mb-2">
            <FiZap size={13} className="inline mr-1 mb-0.5" />
            Sắp khởi hành
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Khởi hành trong 24h tới</h2>
          <p className="text-slate-400 text-sm mt-1">Đặt vé ngay trước khi hết chỗ</p>
        </div>
        <Button
          variant="bordered"
          size="sm"
          className="hidden sm:flex border-blue-200 text-blue-600 font-bold hover:bg-blue-50"
          endContent={<FiArrowRight size={14} />}
          onPress={() => navigate('/search')}
        >
          Xem tất cả
        </Button>
      </div>

      {/* ================================================================
          LAYOUT: Table-style (như Skyscanner / Vietnam Airlines results)
          Mỗi hàng = 1 chuyến, thông tin rõ ràng theo cột
      ================================================================ */}

      {/* Table header – ẩn trên mobile */}
      <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto] gap-4
                      px-5 pb-3 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
        <div>Chuyến đi</div>
        <div className="text-center w-28">Tiện ích</div>
        <div className="text-center w-20">Đánh giá</div>
        <div className="text-right w-36">Giá vé</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-100">
        {upcomingTrips.map((trip) => {
          const isCritical = trip.seatsLeft <= 5
          const pct = Math.round(trip.occupancy * 100)

          return (
            <button
              key={trip.id}
              onClick={() => navigate(`/booking/${trip.id}`, { state: { trip } })}
              className="w-full group text-left"
            >
              {/* Desktop Row */}
              <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center
                              px-5 py-5 hover:bg-blue-50/50 transition-colors duration-150 rounded-xl">

                {/* Route + Time */}
                <div className="flex items-center gap-5">
                  {/* Time block */}
                  <div className="flex-shrink-0 text-center w-14">
                    <div className="text-xl font-black text-slate-900">{trip.departureTime}</div>
                    <div className="text-xs text-slate-400 font-medium">{trip.arrivalTime}</div>
                  </div>

                  {/* Timeline bar */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-600 ring-2 ring-blue-100" />
                    <div className="w-px h-10 bg-blue-200" />
                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                  </div>

                  {/* Route info */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-bold text-slate-900">{trip.from}</span>
                      <FiArrowRight size={13} className="text-blue-400" />
                      <span className="text-base font-bold text-slate-900">{trip.to}</span>
                      {isCritical && (
                        <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                          Còn {trip.seatsLeft} chỗ
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <MdDirectionsBus size={13} />
                      <span>{trip.busType}</span>
                    </div>
                    {/* Occupancy strip */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1 w-20 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pct >= 80 ? 'bg-red-400' : pct >= 60 ? 'bg-blue-400' : 'bg-emerald-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-slate-400">{pct}% đã đặt</span>
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                <div className="w-28 flex flex-wrap gap-1 justify-center">
                  {trip.amenities.slice(0, 2).map((a) => (
                    <span key={a} className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-500">
                      {a}
                    </span>
                  ))}
                </div>

                {/* Rating */}
                <div className="w-20 flex flex-col items-center">
                  <div className="flex items-center gap-1 bg-blue-600 text-white text-xs font-black px-2 py-1 rounded-lg">
                    <FiStar size={10} style={{ fill: 'white' }} />
                    {trip.rating}
                  </div>
                </div>

                {/* Price + CTA */}
                <div className="w-36 flex items-center justify-end gap-3">
                  <div className="text-right">
                    <div className="text-blue-600 font-black text-xl">{trip.price.toLocaleString()}đ</div>
                    <div className="text-[11px] text-slate-400">/người</div>
                  </div>
                  <div className="px-4 py-2 bg-blue-600 group-hover:bg-blue-700
                                  rounded-xl text-white text-sm font-bold transition-colors">
                    Đặt
                  </div>
                </div>
              </div>

              {/* Mobile Card (giữ đơn giản) */}
              <div className="md:hidden flex items-start justify-between
                              py-4 px-1 hover:bg-blue-50/50 rounded-xl transition-colors">
                <div className="flex items-start gap-3">
                  <div className="text-center">
                    <div className="text-base font-black text-slate-900">{trip.departureTime}</div>
                    <div className="text-xs text-slate-400">{trip.arrivalTime}</div>
                  </div>
                  <div className="pt-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-bold text-slate-900">{trip.from}</span>
                      <FiArrowRight size={12} className="text-blue-400" />
                      <span className="font-bold text-slate-900">{trip.to}</span>
                    </div>
                    <div className="text-xs text-slate-400">{trip.busType}</div>
                    {isCritical && (
                      <div className="mt-1 text-[11px] font-bold text-red-600">
                        Còn {trip.seatsLeft} chỗ trống
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-blue-600 font-black text-base">{trip.price.toLocaleString()}đ</div>
                  <div className="text-[11px] text-slate-400">
                    <FiStar size={10} className="inline mr-0.5" style={{ fill: '#2563eb', color: '#2563eb' }} />
                    {trip.rating}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Mobile view all */}
      <div className="md:hidden mt-5 text-center">
        <Button
          variant="bordered"
          className="border-blue-200 text-blue-600 font-bold hover:bg-blue-50"
          endContent={<FiArrowRight size={14} />}
          onPress={() => navigate('/search')}
        >
          Xem tất cả chuyến xe
        </Button>
      </div>
    </div>
  )
}
