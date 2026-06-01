import { useState, useEffect } from 'react'
import { FiAlertCircle, FiClock, FiChevronRight, FiArrowRight, FiTrendingUp, FiMapPin } from 'react-icons/fi'
import { MdSearch } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import { StorageUtil } from '../../utils/helpers'

// Tuyến được đặt nhiều nhất (nội thành + ngoại thành thực tế từ DB)
const MOST_BOOKED_ROUTES = [
  { id: 1, from: 'Cầu Rồng', to: 'Phố cổ Hội An', bookings: 1240, avgPrice: 60000, category: 'city', label: 'Nội thành' },
  { id: 2, from: 'Đà Nẵng', to: 'Huế', bookings: 980, avgPrice: 120000, category: 'interCity', label: 'Ngoại thành' },
  { id: 3, from: 'Đà Nẵng', to: 'Quảng Nam', bookings: 756, avgPrice: 80000, category: 'interCity', label: 'Ngoại thành' },
]



export default function HomeSuggestions() {
  const [recentActivity, setRecentActivity] = useState([])
  const [userInfo, setUserInfo] = useState({ emailVerified: true, phoneVerified: true, hasName: true })
  const navigate = useNavigate()

  useEffect(() => {
    // Load user info
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

    // Tải lịch sử tìm kiếm gần đây
    const savedActivity = localStorage.getItem('recentSearches')
    if (savedActivity) {
      try {
        setRecentActivity(JSON.parse(savedActivity).slice(0, 3))
      } catch (e) {
        console.error('Error loading recent search:', e)
      }
    }

    // "Khởi hành trong 24h tới" — Removed to avoid duplication with UpcomingTrips
  }, [])

  // Điều hướng đến trang tìm kiếm với params
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
    <div className="w-full relative z-10 bg-blue-50 pt-4 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Information Alerts */}
        {!userInfo.emailVerified && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/50 p-2 rounded-full text-amber-500">
                <FiAlertCircle size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900">⚠️ Email chưa được xác minh</h4>
                <p className="text-xs text-amber-800/80 mt-0.5">Xác minh email để bảo mật tài khoản và nhận thông báo đặt vé</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-white text-amber-600 font-semibold text-sm rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              Xác minh
            </button>
          </div>
        )}

        {/* Lịch sử tìm kiếm gần đây */}
        {recentActivity.length > 0 && (
          <section>
            <div className="mb-6 border-b-2 border-slate-100 pb-4">
              <div className="flex items-center gap-3 mb-1">
                <FiClock size={24} className="text-slate-700" />
                <h3 className="text-2xl font-bold text-slate-900">Hoạt động gần đây</h3>
              </div>
              <p className="text-sm font-medium text-slate-500">Những tuyến bạn vừa tìm kiếm</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentActivity.map((activity, idx) => (
                <div 
                  key={idx} 
                  onClick={() => handleRecentActivityClick(activity)}
                  className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-5 rounded-2xl cursor-pointer hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300 shadow-sm"
                >
                  <div className="flex items-center gap-3 font-bold text-lg mb-4">
                    <span className="truncate">{activity.from}</span>
                    <span>↔️</span>
                    <span className="truncate">{activity.to}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-white/90 font-medium">
                    <span>{new Date(activity.timestamp).toLocaleDateString('vi-VN')}</span>
                    <span className="flex items-center gap-1 font-semibold">
                      Xem lại <FiChevronRight size={16} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 🔥 Tuyến đường được đặt nhiều nhất */}
        <section>
          <div className="mb-6 border-b border-slate-200 pb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg">
                  <FiTrendingUp className="text-white" size={24} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Tuyến đường phổ biến</h3>
              </div>
              <p className="text-sm font-medium text-slate-500">Các tuyến xe được hành khách lựa chọn nhiều nhất</p>
            </div>
            <button className="hidden sm:flex items-center gap-1 text-blue-600 font-semibold hover:text-blue-700 text-sm transition-colors">
              Xem tất cả <FiChevronRight />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MOST_BOOKED_ROUTES.map((route) => (
              <div 
                key={route.id} 
                onClick={() => goSearch({ from: route.from, to: route.to, category: route.category })}
                className="group cursor-pointer bg-white border-2 border-slate-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all duration-300"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 px-2.5 py-1 rounded-full text-xs font-bold border border-red-200">
                    <span>🔥</span>
                    <span>{route.bookings.toLocaleString()}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded">{route.label}</span>
                </div>

                {/* Route Info */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Từ</div>
                      <div className="text-base font-black text-slate-900 truncate">{route.from}</div>
                    </div>
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                      <FiArrowRight size={16} className="font-bold" />
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Đến</div>
                      <div className="text-base font-black text-slate-900 truncate">{route.to}</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(route.bookings / 15, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-end justify-between pt-3 border-t border-slate-100">
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-0.5">Giá từ</div>
                    <div className="text-lg font-black text-blue-600">{(route.avgPrice / 1000).toFixed(0)}k</div>
                  </div>
                  <button className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
                    <FiChevronRight size={16} className="font-bold" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full sm:hidden mt-3 py-2.5 bg-slate-50 text-blue-600 font-semibold rounded-lg border border-slate-200">
            Xem tất cả tuyến đường
          </button>
        </section>

      </div>
    </div>
  )
}
