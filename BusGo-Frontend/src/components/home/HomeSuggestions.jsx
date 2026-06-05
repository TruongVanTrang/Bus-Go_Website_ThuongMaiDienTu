import { useState, useEffect } from 'react'
import { FiAlertCircle, FiClock, FiChevronRight, FiArrowRight, FiTrendingUp } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { StorageUtil } from '../../utils/helpers'

const MOST_BOOKED_ROUTES = [
  {
    id: 1,
    from: 'Cầu Rồng',
    to: 'Phố cổ Hội An',
    bookings: 1240,
    avgPrice: 60000,
    category: 'city',
    label: 'Nội thành',
    image: 'https://images.unsplash.com/photo-1568402102990-bc541580b59f?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 2,
    from: 'Đà Nẵng',
    to: 'Huế',
    bookings: 980,
    avgPrice: 120000,
    category: 'interCity',
    label: 'Ngoại thành',
    image: 'https://images.unsplash.com/photo-1605538032432-a9f0c8d9baac?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 3,
    from: 'Đà Nẵng',
    to: 'Quảng Nam',
    bookings: 756,
    avgPrice: 80000,
    category: 'interCity',
    label: 'Ngoại thành',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80'
  },
]

export default function HomeSuggestions() {
  const [recentActivity, setRecentActivity] = useState([])
  const [userInfo, setUserInfo] = useState({ emailVerified: true, phoneVerified: true, hasName: true })
  const navigate = useNavigate()

  useEffect(() => {
    const savedUser = StorageUtil.getUser()
    if (savedUser) {
      const savedUserInfo = localStorage.getItem('userInfo')
      if (savedUserInfo) {
        setUserInfo(JSON.parse(savedUserInfo))
      } else {
        setUserInfo({ emailVerified: true, phoneVerified: true, hasName: !!savedUser.name })
      }
    } else {
      setUserInfo({ emailVerified: true, phoneVerified: true, hasName: false })
    }

    const savedActivity = localStorage.getItem('recentSearches')
    if (savedActivity) {
      try {
        setRecentActivity(JSON.parse(savedActivity).slice(0, 3))
      } catch (e) {
        console.error('Error loading recent search:', e)
      }
    }
  }, [])

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

  const handleRecentActivityClick = (route) => {
    goSearch({ from: route.from, to: route.to, needDate: false })
  }

  return (
    <div className="w-full bg-white py-12 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Verification Alert */}
        {!userInfo.emailVerified && (
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-xl text-blue-600 shadow-sm shrink-0">
                <FiAlertCircle size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Email chưa được xác minh</h4>
                <p className="text-xs text-slate-500 mt-0.5">Xác minh email để bảo mật tài khoản và nhận hóa đơn điện tử tự động.</p>
              </div>
            </div>
            <button className="self-start sm:self-center px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
              Xác minh ngay
            </button>
          </div>
        )}

        {/* Lịch sử tìm kiếm gần đây */}
        {recentActivity.length > 0 && (
          <section className="animate-in fade-in duration-300">
            <div className="mb-6 flex items-center gap-2">
              <FiClock size={20} className="text-[#0c3d66]" />
              <h3 className="text-lg font-black text-[#0c3d66] uppercase tracking-wide">Tìm kiếm gần đây</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentActivity.map((activity, idx) => (
                <div 
                  key={idx} 
                  onClick={() => handleRecentActivityClick(activity)}
                  className="bg-slate-50 hover:bg-blue-50/40 border border-slate-200/80 hover:border-blue-200 rounded-2xl p-5 cursor-pointer hover:-translate-y-1 transition-all duration-300 shadow-sm flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between font-bold text-slate-800 text-sm mb-3">
                    <span className="truncate">{activity.from}</span>
                    <span className="text-blue-500 mx-2">➔</span>
                    <span className="truncate">{activity.to}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-400 font-bold">
                    <span>{new Date(activity.timestamp).toLocaleDateString('vi-VN')}</span>
                    <span className="flex items-center gap-0.5 text-blue-600">
                      Xem lại <FiChevronRight size={14} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tuyến đường phổ biến */}
        <section>
          <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FiTrendingUp className="text-blue-650" size={22} />
                <h3 className="text-xl font-black text-[#0c3d66] uppercase tracking-wide">Tuyến đường phổ biến</h3>
              </div>
              <p className="text-sm font-semibold text-slate-400">Các tuyến xe được hành khách lựa chọn nhiều nhất trên hệ thống</p>
            </div>
            <button 
              onClick={() => goSearch()}
              className="self-start md:self-end flex items-center gap-1 text-blue-600 font-extrabold text-xs uppercase tracking-wider hover:text-blue-700 transition-colors"
            >
              Xem tất cả tuyến đường <FiChevronRight />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MOST_BOOKED_ROUTES.map((route) => (
              <div 
                key={route.id} 
                onClick={() => goSearch({ from: route.from, to: route.to, category: route.category })}
                className="group cursor-pointer bg-slate-900 rounded-[32px] overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between h-[360px] relative border border-slate-100/10"
              >
                {/* Background Image with Zoom */}
                <div className="absolute inset-0 z-0">
                  <img 
                    src={route.image} 
                    alt={`${route.from} - ${route.to}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-[0.8] group-hover:brightness-90"
                  />
                  {/* High contrast gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-black/30 z-10"></div>
                </div>

                {/* Content Overlay */}
                <div className="relative z-20 flex flex-col justify-between h-full p-6 text-white">
                  {/* Card Header */}
                  <div className="flex justify-between items-center">
                    <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold border border-white/20 shadow-sm">
                      <span className="text-yellow-400">🔥</span>
                      <span>{route.bookings.toLocaleString()} đặt</span>
                    </div>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-100 bg-blue-600/70 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-blue-400/30">{route.label}</span>
                  </div>

                  {/* Route Details (Bottom Section) */}
                  <div className="space-y-4">
                    {/* Destination Names */}
                    <div>
                      <div className="flex items-center justify-between gap-2.5 mb-2.5">
                        <div className="flex-1 min-w-0 text-left">
                          <span className="text-[9px] font-bold text-slate-350 uppercase tracking-widest block mb-0.5">Khởi hành</span>
                          <span className="text-base font-black tracking-tight text-white drop-shadow-md truncate block">{route.from}</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 group-hover:bg-blue-600 group-hover:border-blue-500 transition-all duration-300 shadow-sm">
                          <FiArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <span className="text-[9px] font-bold text-slate-350 uppercase tracking-widest block mb-0.5">Điểm đến</span>
                          <span className="text-base font-black tracking-tight text-white drop-shadow-md truncate block">{route.to}</span>
                        </div>
                      </div>

                      {/* Progress Line */}
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-450 to-indigo-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(route.bookings / 15, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Pricing and Action Divider */}
                    <div className="flex items-center justify-between pt-3.5 border-t border-white/10">
                      <div>
                        <span className="text-[9px] font-semibold text-slate-300 uppercase tracking-widest block">Giá vé từ</span>
                        <span className="text-xl font-black text-blue-400 drop-shadow-sm">{(route.avgPrice).toLocaleString()}đ</span>
                      </div>
                      <span className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg border border-blue-500/30">
                        <FiChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
