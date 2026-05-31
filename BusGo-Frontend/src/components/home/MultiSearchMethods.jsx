import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiMapPin, FiTruck, FiClock, FiArrowRight } from 'react-icons/fi'

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
    { type: 'Xe 16 chỗ', id: 'mini_16', name: 'Cao cấp, nhỏ gọn', icon: '🚐', price: 'từ 80k', trips: 40 },
    { type: 'Xe 35 chỗ', id: 'coach_29_35', name: 'Rộng rãi, tiện nghi', icon: '🚌', price: 'từ 100k', trips: 60 },
    { type: 'Xe 9 chỗ', id: 'mini_9', name: 'Không gian gia đình', icon: '🚍', price: 'từ 90k', trips: 15 },
    { type: 'Limousine', id: 'coach_suburb', name: 'Đẳng cấp thương gia', icon: '✨', price: 'từ 120k', trips: 20 }
  ]

  // Time Period Data
  const timePeriods = [
    { id: 'morning', label: 'Sáng', time: '05:00 - 12:00', icon: '🌅', trips: 45 },
    { id: 'afternoon', label: 'Chiều', time: '12:00 - 17:00', icon: '☀️', trips: 38 },
    { id: 'night', label: 'Tối', time: '17:00 - 23:59', icon: '🌙', trips: 22 }
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
    <div className="w-full relative z-10 bg-slate-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-slate-900 mb-4">Tìm kiếm theo cách bạn muốn</h2>
          <p className="text-slate-600 font-medium">Khám phá các tuyến đường và phương tiện theo nhu cầu của bạn</p>
        </div>

        {/* Method Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <button
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${
              activeMethod === 'routes'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md -translate-y-0.5'
                : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-blue-600 border border-slate-200'
            }`}
            onClick={() => setActiveMethod('routes')}
          >
            <FiMapPin size={20} />
            <span>Theo Tuyến Đường</span>
          </button>
          <button
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${
              activeMethod === 'vehicles'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md -translate-y-0.5'
                : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-blue-600 border border-slate-200'
            }`}
            onClick={() => setActiveMethod('vehicles')}
          >
            <FiTruck size={20} />
            <span>Theo Phương Tiện</span>
          </button>
          <button
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${
              activeMethod === 'time'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md -translate-y-0.5'
                : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-blue-600 border border-slate-200'
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Chọn tuyến đường phổ biến</h3>
                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                  Các tuyến đường được yêu thích nhất bởi khách hàng BusGo. Đặt vé thường xuyên trên những tuyến này sẽ giúp bạn nhận được ưu đãi đặc biệt.
                </p>
                <ul className="space-y-3 text-sm font-semibold text-slate-700">
                  <li className="flex items-center gap-2"><span className="text-blue-500">✓</span> Tuyến nào phổ biến nhất</li>
                  <li className="flex items-center gap-2"><span className="text-blue-500">✓</span> Số chuyến xe mỗi ngày</li>
                  <li className="flex items-center gap-2"><span className="text-blue-500">✓</span> Giá vé cạnh tranh</li>
                </ul>
              </div>

              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {popularRoutes.map((route, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleRouteSearch(route.from, route.to, route.category)}
                    className="bg-white rounded-2xl p-5 border border-slate-200 cursor-pointer hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 transition-all group"
                  >
                    <div className="flex items-center justify-between font-bold text-lg text-slate-900 mb-6">
                      <span className="truncate">{route.from}</span>
                      <FiArrowRight className="text-slate-300 group-hover:text-blue-500 transition-colors mx-2 shrink-0" />
                      <span className="truncate">{route.to}</span>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-500 mb-2">
                          <span>Mức độ phổ biến</span>
                          <span className="text-blue-600">{route.popularity}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full"
                            style={{ width: `${route.popularity}%` }}
                          />
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold">
                        <FiClock />
                        {route.trips} chuyến/ngày
                      </div>
                    </div>

                    <button className="w-full py-2.5 bg-slate-50 text-slate-700 font-bold text-sm rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center justify-center gap-2">
                      Tìm vé <FiArrowRight />
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vehicleTypes.map((vehicle, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleVehicleSearch(vehicle.id)}
                    className="bg-white rounded-2xl p-6 border border-slate-200 cursor-pointer hover:border-indigo-500 hover:shadow-lg hover:-translate-y-1 transition-all group flex flex-col items-center text-center"
                  >
                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{vehicle.icon}</div>
                    <h4 className="text-xl font-bold text-slate-900 mb-1">{vehicle.type}</h4>
                    <p className="text-sm font-medium text-slate-500 mb-6">{vehicle.name}</p>

                    <div className="flex items-center justify-center gap-4 w-full mb-6">
                      <span className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-bold">{vehicle.price}</span>
                      <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-sm font-semibold">{vehicle.trips}+ chuyến</span>
                    </div>

                    <button className="w-full py-2.5 bg-slate-50 text-slate-700 font-bold text-sm rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors flex items-center justify-center gap-2">
                      Xem xe <FiArrowRight />
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm lg:order-last order-first">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Lựa chọn theo phương tiện</h3>
                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                  Xem trước ảnh và thông tin chi tiết về các loại xe, sau đó chọn lịch trình phù hợp với bạn.
                </p>
                <ul className="space-y-3 text-sm font-semibold text-slate-700">
                  <li className="flex items-center gap-2"><span className="text-indigo-500">✓</span> Hình ảnh và video xe</li>
                  <li className="flex items-center gap-2"><span className="text-indigo-500">✓</span> Tiện nghi & dịch vụ</li>
                  <li className="flex items-center gap-2"><span className="text-indigo-500">✓</span> Đánh giá từ khách hàng</li>
                  <li className="flex items-center gap-2"><span className="text-indigo-500">✓</span> Những chuyến sắp tới</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Time Tab */}
        {activeMethod === 'time' && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Tìm theo khung giờ</h3>
                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                  Chọn thời gian mà bạn muốn khởi hành, từ sáng sớm đến tối muộn. Hệ thống sẽ hiển thị tất cả các chuyến xe phù hợp.
                </p>
                <ul className="space-y-3 text-sm font-semibold text-slate-700">
                  <li className="flex items-center gap-2"><span className="text-amber-500">✓</span> Sáng: 05:00 - 12:00</li>
                  <li className="flex items-center gap-2"><span className="text-amber-500">✓</span> Chiều: 12:00 - 17:00</li>
                  <li className="flex items-center gap-2"><span className="text-amber-500">✓</span> Tối: 17:00 - 23:59</li>
                </ul>
              </div>

              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {timePeriods.map(period => (
                  <div
                    key={period.id}
                    onClick={() => handleTimeSearch(period.id)}
                    className="bg-white rounded-2xl p-6 border border-slate-200 cursor-pointer hover:border-amber-500 hover:shadow-lg hover:-translate-y-1 transition-all group flex flex-col items-center text-center"
                  >
                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{period.icon}</div>
                    <h4 className="text-lg font-bold text-slate-900 mb-2">{period.label}</h4>
                    <p className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg mb-4">{period.time}</p>

                    <div className="w-full flex justify-center mb-6">
                      <span className="text-sm font-semibold text-slate-500 border border-slate-200 px-4 py-1.5 rounded-full">{period.trips}+ chuyến</span>
                    </div>

                    <button className="mt-auto w-full py-2.5 bg-slate-50 text-slate-700 font-bold text-sm rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-colors flex items-center justify-center gap-2">
                      Tìm vé <FiArrowRight />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
