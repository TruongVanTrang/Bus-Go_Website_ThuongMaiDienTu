import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiTruck, FiClock, FiArrowRight, FiZap, FiAward } from 'react-icons/fi'
import { MdDirectionsBus, MdAirlineSeatReclineExtra, MdLocalFireDepartment } from 'react-icons/md'
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
    { type: 'Xe 16 chỗ', id: 'mini_16', name: 'Cao cấp, nhỏ gọn', icon: FiTruck, color: 'from-blue-500 to-cyan-500', bgColor: 'from-blue-50 to-cyan-50', borderColor: 'border-blue-200', price: 'từ 80k', trips: 40 },
    { type: 'Xe 35 chỗ', id: 'coach_29_35', name: 'Rộng rãi, tiện nghi', icon: MdDirectionsBus, color: 'from-indigo-500 to-purple-500', bgColor: 'from-indigo-50 to-purple-50', borderColor: 'border-indigo-200', price: 'từ 100k', trips: 60 },
    { type: 'Xe 9 chỗ', id: 'mini_9', name: 'Không gian gia đình', icon: MdAirlineSeatReclineExtra, color: 'from-emerald-500 to-teal-500', bgColor: 'from-emerald-50 to-teal-50', borderColor: 'border-emerald-200', price: 'từ 90k', trips: 15 },
    { type: 'Limousine', id: 'coach_suburb', name: 'Đẳng cấp thương gia', icon: FiAward, color: 'from-amber-500 to-orange-500', bgColor: 'from-amber-50 to-orange-50', borderColor: 'border-amber-200', price: 'từ 120k', trips: 20 }
  ]

  // Time Period Data
  const timePeriods = [
    { id: 'morning', label: 'Sáng', time: '05:00 - 12:00', icon: GiSunrise, color: 'from-orange-500 to-yellow-500', bgColor: 'from-orange-50 to-yellow-50', borderColor: 'border-orange-200', trips: 45 },
    { id: 'afternoon', label: 'Chiều', time: '12:00 - 17:00', icon: FiZap, color: 'from-yellow-500 to-amber-500', bgColor: 'from-yellow-50 to-amber-50', borderColor: 'border-yellow-200', trips: 38 },
    { id: 'night', label: 'Tối', time: '17:00 - 23:59', icon: GiSunset, color: 'from-indigo-500 to-purple-500', bgColor: 'from-indigo-50 to-purple-50', borderColor: 'border-indigo-200', trips: 22 }
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
    <div className="w-full relative z-10 bg-gradient-to-b from-white via-slate-50 to-white py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-1 w-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">PHƯƠNG THỨC TÌM KIẾM</span>
            <div className="h-1 w-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-3">Tìm kiếm theo cách bạn muốn</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">Khám phá các tuyến đường, phương tiện và khung giờ phù hợp với nhu cầu của bạn</p>
        </div>

        {/* Method Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <button
            className={`flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${
              activeMethod === 'routes'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                : 'bg-white text-slate-600 hover:bg-blue-50 border-2 border-slate-200 hover:border-blue-400'
            }`}
            onClick={() => setActiveMethod('routes')}
          >
            <GiCompass size={20} />
            <span>Theo Tuyến Đường</span>
          </button>
          <button
            className={`flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${
              activeMethod === 'vehicles'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
                : 'bg-white text-slate-600 hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-400'
            }`}
            onClick={() => setActiveMethod('vehicles')}
          >
            <MdDirectionsBus size={20} />
            <span>Theo Phương Tiện</span>
          </button>
          <button
            className={`flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${
              activeMethod === 'time'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-500/30 scale-105'
                : 'bg-white text-slate-600 hover:bg-amber-50 border-2 border-slate-200 hover:border-amber-400'
            }`}
            onClick={() => setActiveMethod('time')}
          >
            <FiClock size={20} />
            <span>Theo Thời Gian</span>
          </button>
        </div>

        {/* Routes Tab */}
        {activeMethod === 'routes' && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Info Card */}
              <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 p-8 rounded-2xl border-2 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl">
                    <GiCompass className="text-white" size={24} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">Tuyến đường phổ biến</h3>
                </div>
                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                  Các tuyến đường được yêu thích nhất bởi khách hàng BusGo. Đặt vé thường xuyên sẽ nhận ưu đãi đặc biệt.
                </p>
                <ul className="space-y-3 text-sm font-semibold text-slate-700">
                  <li className="flex items-center gap-2"><span className="text-blue-500 font-black text-lg">✓</span> Tuyến phổ biến nhất</li>
                  <li className="flex items-center gap-2"><span className="text-blue-500 font-black text-lg">✓</span> Số chuyến mỗi ngày</li>
                  <li className="flex items-center gap-2"><span className="text-blue-500 font-black text-lg">✓</span> Giá vé cạnh tranh</li>
                </ul>
              </div>

              {/* Routes Grid */}
              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {popularRoutes.map((route, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleRouteSearch(route.from, route.to, route.category)}
                    className="bg-white rounded-2xl p-5 border-2 border-slate-200 cursor-pointer hover:border-blue-500 hover:shadow-xl hover:-translate-y-2 transition-all group overflow-hidden relative"
                  >
                    {/* Background gradient on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
                    
                    <div className="flex items-center justify-between font-bold text-base text-slate-900 mb-4">
                      <span className="truncate text-sm font-bold">{route.from}</span>
                      <FiArrowRight className="text-slate-300 group-hover:text-blue-500 transition-colors mx-1 shrink-0 group-hover:scale-125" size={18} />
                      <span className="truncate text-sm font-bold">{route.to}</span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                          <span>Mức độ phổ biến</span>
                          <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">{route.popularity}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${route.popularity}%` }}
                          />
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-200">
                        <FiClock size={13} />
                        {route.trips} chuyến/ngày
                      </div>
                    </div>

                    <button className="w-full py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-bold text-xs rounded-lg group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:text-white transition-all flex items-center justify-center gap-1.5 border border-blue-200 group-hover:border-transparent">
                      Tìm vé <FiArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Vehicles Tab */}
        {activeMethod === 'vehicles' && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Vehicles Grid */}
              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {vehicleTypes.map((vehicle, idx) => {
                  const IconComponent = vehicle.icon
                  return (
                    <div
                      key={idx}
                      onClick={() => handleVehicleSearch(vehicle.id)}
                      className={`bg-gradient-to-br ${vehicle.bgColor} rounded-2xl p-6 border-2 ${vehicle.borderColor} cursor-pointer hover:shadow-2xl hover:-translate-y-2 transition-all group overflow-hidden relative`}
                    >
                      {/* Animated background */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className={`absolute inset-0 bg-gradient-to-br ${vehicle.bgColor}`}></div>
                      </div>
                      
                      <div className="relative z-10 flex flex-col items-center text-center">
                        <div className={`p-4 bg-gradient-to-br ${vehicle.color} rounded-2xl mb-4 group-hover:scale-125 transition-transform duration-300 shadow-lg`}>
                          <IconComponent className="text-white" size={32} />
                        </div>
                        <h4 className="text-lg font-black text-slate-900 mb-1">{vehicle.type}</h4>
                        <p className="text-sm font-semibold text-slate-600 mb-4">{vehicle.name}</p>

                        <div className="flex items-center justify-center gap-2 w-full mb-4 flex-wrap">
                          <span className={`bg-gradient-to-r ${vehicle.color} text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md`}>{vehicle.price}</span>
                          <span className="bg-white text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold border-2 border-slate-200">{vehicle.trips}+ chuyến</span>
                        </div>

                        <button className={`w-full py-2.5 bg-white text-blue-600 font-bold text-xs rounded-lg group-hover:bg-gradient-to-r group-hover:${vehicle.color} group-hover:text-black transition-all flex items-center justify-center gap-1.5 border-2 border-slate-200 group-hover:border-transparent`}>
                          Xem xe <FiArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Info Card */}
              <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8 rounded-2xl border-2 border-indigo-200 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
                    <MdDirectionsBus className="text-white" size={24} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">Lựa chọn phương tiện</h3>
                </div>
                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                  Xem ảnh và thông tin chi tiết về các loại xe, sau đó chọn lịch trình phù hợp.
                </p>
                <ul className="space-y-3 text-sm font-semibold text-slate-700">
                  <li className="flex items-center gap-2"><span className="text-indigo-500 font-black text-lg">✓</span> Hình ảnh & video</li>
                  <li className="flex items-center gap-2"><span className="text-indigo-500 font-black text-lg">✓</span> Tiện nghi & dịch vụ</li>
                  <li className="flex items-center gap-2"><span className="text-indigo-500 font-black text-lg">✓</span> Đánh giá khách hàng</li>
                  <li className="flex items-center gap-2"><span className="text-indigo-500 font-black text-lg">✓</span> Chuyến sắp tới</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Time Tab */}
        {activeMethod === 'time' && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Info Card */}
              <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-8 rounded-2xl border-2 border-amber-200 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl">
                    <FiClock className="text-white" size={24} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">Tìm theo khung giờ</h3>
                </div>
                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                  Chọn thời gian khởi hành từ sáng sớm đến tối muộn. Hệ thống sẽ hiển thị tất cả chuyến phù hợp.
                </p>
                <ul className="space-y-3 text-sm font-semibold text-slate-700">
                  <li className="flex items-center gap-2"><span className="text-amber-500 font-black text-lg">✓</span> Sáng: 05:00 - 12:00</li>
                  <li className="flex items-center gap-2"><span className="text-amber-500 font-black text-lg">✓</span> Chiều: 12:00 - 17:00</li>
                  <li className="flex items-center gap-2"><span className="text-amber-500 font-black text-lg">✓</span> Tối: 17:00 - 23:59</li>
                </ul>
              </div>

              {/* Time Periods Grid */}
              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {timePeriods.map(period => {
                  const IconComponent = period.icon
                  return (
                    <div
                      key={period.id}
                      onClick={() => handleTimeSearch(period.id)}
                      className={`bg-gradient-to-br ${period.bgColor} rounded-2xl p-6 border-2 ${period.borderColor} cursor-pointer hover:shadow-2xl hover:-translate-y-2 transition-all group overflow-hidden relative`}
                    >
                      {/* Animated background */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className={`absolute inset-0 bg-gradient-to-br ${period.bgColor}`}></div>
                      </div>
                      
                      <div className="relative z-10 flex flex-col items-center text-center">
                        <div className={`p-4 bg-gradient-to-br ${period.color} rounded-2xl mb-4 group-hover:scale-125 transition-transform duration-300 shadow-lg`}>
                          <IconComponent className="text-white" size={32} />
                        </div>
                        <h4 className="text-lg font-black text-slate-900 mb-2">{period.label}</h4>
                        <p className={`text-xs font-bold bg-white px-3 py-1.5 rounded-lg mb-3 border-2 ${period.borderColor}`}>
                          {period.time}
                        </p>

                        <div className="w-full flex justify-center mb-4">
                          <span className="text-xs font-bold text-slate-600 bg-white border-2 border-slate-200 px-3 py-1.5 rounded-full">{period.trips}+ chuyến</span>
                        </div>

                        <button className={`mt-auto w-full py-2.5 bg-white text-slate-700 font-bold text-xs rounded-lg group-hover:bg-gradient-to-r group-hover:${period.color} group-hover:text-blue-600 transition-all flex items-center justify-center gap-1.5 border-2 border-slate-200 group-hover:border-transparent`}>
                          Tìm vé <FiArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
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
