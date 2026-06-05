import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiTruck, FiClock, FiArrowRight, FiZap, FiAward } from 'react-icons/fi'
import { MdDirectionsBus, MdAirlineSeatReclineExtra } from 'react-icons/md'
import { GiCompass, GiSunrise, GiSunset } from 'react-icons/gi'

export default function MultiSearchMethods() {
  const navigate = useNavigate()
  const [activeMethod, setActiveMethod] = useState('routes')

  // Popular Routes Data
  const popularRoutes = [
    { from: 'Cầu Rồng', to: 'Phố cổ Hội An', popularity: 95, trips: 16, category: 'city' },
    { from: 'Đà Nẵng', to: 'Huế', popularity: 90, trips: 32, category: 'interCity' },
    { from: 'Đà Nẵng', to: 'Quảng Nam', popularity: 88, trips: 32, category: 'interCity' },
    { from: 'Đà Nẵng', to: 'Quảng Bình', popularity: 75, trips: 16, category: 'interCity' }
  ]

  // Vehicle Types Data
  const vehicleTypes = [
    { type: 'Xe 16 chỗ', id: 'mini_16', name: 'Cao cấp, nhỏ gọn', icon: FiTruck, price: 'từ 80k', trips: 40 },
    { type: 'Xe 35 chỗ', id: 'coach_29_35', name: 'Rộng rãi, tiện nghi', icon: MdDirectionsBus, price: 'từ 100k', trips: 60 },
    { type: 'Xe 9 chỗ', id: 'mini_9', name: 'Không gian gia đình', icon: MdAirlineSeatReclineExtra, price: 'từ 90k', trips: 15 },
    { type: 'Limousine', id: 'coach_suburb', name: 'Đẳng cấp thương gia', icon: FiAward, price: 'từ 120k', trips: 20 }
  ]

  // Time Period Data
  const timePeriods = [
    { id: 'morning', label: 'Sáng', time: '05:00 - 12:00', icon: GiSunrise, trips: 45 },
    { id: 'afternoon', label: 'Chiều', time: '12:00 - 17:00', icon: FiZap, trips: 38 },
    { id: 'night', label: 'Tối', time: '17:00 - 23:59', icon: GiSunset, trips: 22 }
  ]

  const handleRouteSearch = (from, to, category) => {
    navigate('/search', { state: { from, to, category } })
  }

  const handleVehicleSearch = (vehicleId) => {
    navigate('/search', { state: { busType: vehicleId } })
  }

  const handleTimeSearch = (timeId) => {
    navigate('/search', { state: { departureTime: timeId } })
  }

  return (
    <div className="w-full bg-white py-12 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Phương thức tìm kiếm</span>
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">Tìm kiếm theo cách bạn muốn</h2>
          <p className="text-sm font-semibold text-slate-400 max-w-xl mx-auto">Khám phá các tuyến đường, phương tiện và khung giờ phù hợp với nhu cầu của bạn</p>
        </div>

        {/* Method Tabs */}
        <div className="flex justify-center gap-3 mb-10">
          {[
            { id: 'routes', label: 'Theo Tuyến Đường', icon: GiCompass },
            { id: 'vehicles', label: 'Theo Phương Tiện', icon: MdDirectionsBus },
            { id: 'time', label: 'Theo Thời Gian', icon: FiClock }
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeMethod === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveMethod(tab.id)}
                className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-slate-100'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Routes Tab */}
        {activeMethod === 'routes' && (
          <div className="animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Info Card */}
              <div className="bg-blue-50/60 p-6 rounded-2xl border border-blue-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm shrink-0">
                      <GiCompass size={18} />
                    </div>
                    <h3 className="text-base font-extrabold text-[#0c3d66]">Tuyến đường phổ biến</h3>
                  </div>
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-6">
                    Các tuyến đường được yêu thích nhất bởi hành khách BusGo. Khám phá ngay các điểm đến hấp dẫn.
                  </p>
                  <ul className="space-y-2.5 text-xs font-bold text-slate-650">
                    <li className="flex items-center gap-2"><span className="text-blue-600">✓</span> Hàng chục chuyến/ngày</li>
                    <li className="flex items-center gap-2"><span className="text-blue-600">✓</span> Điểm dừng chân đón trả đa dạng</li>
                    <li className="flex items-center gap-2"><span className="text-blue-600">✓</span> Giá cước ưu đãi ổn định</li>
                  </ul>
                </div>
              </div>

              {/* Routes Grid */}
              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {popularRoutes.map((route, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleRouteSearch(route.from, route.to, route.category)}
                    className="bg-white rounded-2xl p-5 border border-slate-200/80 cursor-pointer hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between font-bold text-slate-800 mb-4 text-xs">
                        <span className="truncate">{route.from}</span>
                        <FiArrowRight className="text-slate-300 group-hover:text-blue-500 transition-colors mx-2 shrink-0" size={14} />
                        <span className="truncate">{route.to}</span>
                      </div>

                      <div className="space-y-3 mb-5">
                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5">
                            <span>Mức độ phổ biến</span>
                            <span className="text-blue-600">{route.popularity}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${route.popularity}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-slate-50 pt-3 mt-2">
                      <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50/60 border border-blue-100/50 px-2 py-0.5 rounded-md">
                        {route.trips} chuyến/ngày
                      </span>
                      <span className="text-[10px] font-bold text-[#0c3d66] group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                        Tìm vé <FiArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Vehicles Tab */}
        {activeMethod === 'vehicles' && (
          <div className="animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Vehicles Grid */}
              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {vehicleTypes.map((vehicle, idx) => {
                  const Icon = vehicle.icon
                  return (
                    <div
                      key={idx}
                      onClick={() => handleVehicleSearch(vehicle.id)}
                      className="bg-white rounded-2xl p-5 border border-slate-200/80 cursor-pointer hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl mb-4 group-hover:scale-105 transition-transform duration-300 border border-blue-100">
                          <Icon size={24} />
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-800 mb-1">{vehicle.type}</h4>
                        <p className="text-[11px] font-bold text-slate-400 mb-4">{vehicle.name}</p>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-slate-50 mt-2">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-slate-400">Giá chỉ</span>
                          <span className="text-blue-600">{vehicle.price}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-slate-400">Số chuyến</span>
                          <span className="text-slate-700">{vehicle.trips}+ chuyến</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Info Card */}
              <div className="bg-blue-50/60 p-6 rounded-2xl border border-blue-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm shrink-0">
                      <MdDirectionsBus size={18} />
                    </div>
                    <h3 className="text-base font-extrabold text-[#0c3d66]">Lựa chọn xe</h3>
                  </div>
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-6">
                    Đa dạng các loại phương tiện từ dòng limousine cao cấp đến các loại xe giường nằm tiện nghi.
                  </p>
                  <ul className="space-y-2.5 text-xs font-bold text-slate-650">
                    <li className="flex items-center gap-2"><span className="text-blue-600">✓</span> Limousine / 9 chỗ</li>
                    <li className="flex items-center gap-2"><span className="text-blue-600">✓</span> Xe khách / 35 chỗ</li>
                    <li className="flex items-center gap-2"><span className="text-blue-600">✓</span> Trang bị nước uống, điều hòa</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Time Tab */}
        {activeMethod === 'time' && (
          <div className="animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Info Card */}
              <div className="bg-blue-50/60 p-6 rounded-2xl border border-blue-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm shrink-0">
                      <FiClock size={18} />
                    </div>
                    <h3 className="text-base font-extrabold text-[#0c3d66]">Chọn khung giờ</h3>
                  </div>
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-6">
                    Tìm kiếm các chuyến xe có lịch trình khởi hành thích hợp nhất với quỹ thời gian của bạn.
                  </p>
                  <ul className="space-y-2.5 text-xs font-bold text-slate-650">
                    <li className="flex items-center gap-2"><span className="text-blue-600">✓</span> Sáng: 05:00 - 12:00</li>
                    <li className="flex items-center gap-2"><span className="text-blue-600">✓</span> Chiều: 12:00 - 17:00</li>
                    <li className="flex items-center gap-2"><span className="text-blue-600">✓</span> Tối: 17:00 - 23:59</li>
                  </ul>
                </div>
              </div>

              {/* Time Periods Grid */}
              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {timePeriods.map(period => {
                  const Icon = period.icon
                  return (
                    <div
                      key={period.id}
                      onClick={() => handleTimeSearch(period.id)}
                      className="bg-white rounded-2xl p-5 border border-slate-200/80 cursor-pointer hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl mb-4 group-hover:scale-105 transition-transform duration-300 border border-blue-100">
                          <Icon size={24} />
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-800 mb-1">{period.label}</h4>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1 rounded-lg">
                          {period.time}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 border-t border-slate-50 pt-3 mt-4 text-[10px] font-bold">
                        <span className="text-slate-400">Tổng chuyến</span>
                        <span className="text-blue-600">{period.trips}+ chuyến</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
