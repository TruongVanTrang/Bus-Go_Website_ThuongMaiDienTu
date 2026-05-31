import { useState, useEffect } from 'react'
import { FiAlertCircle, FiClock, FiChevronRight } from 'react-icons/fi'
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
    <div className="w-full relative z-10 bg-blue-50 pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
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
          <div className="mb-8 border-b border-slate-200 pb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-2xl">🔥</span>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Tuyến đường phổ biến</h3>
              </div>
              <p className="text-sm font-medium text-slate-500">Các tuyến xe được hành khách lựa chọn nhiều nhất</p>
            </div>
            <button className="hidden sm:flex items-center gap-1 text-blue-600 font-semibold hover:text-blue-700 text-sm transition-colors">
              Xem tất cả <FiChevronRight />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MOST_BOOKED_ROUTES.map((route) => (
              <div 
                key={route.id} 
                onClick={() => goSearch({ from: route.from, to: route.to, category: route.category })}
                className="group cursor-pointer bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-blue-200 transition-all duration-300 relative overflow-hidden flex flex-col"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1 rounded-full text-[13px] font-semibold">
                    <span className="text-xs">🔥</span>
                    <span>{route.bookings.toLocaleString()} lượt đặt</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md">{route.label}</span>
                </div>

                <div className="flex items-center gap-4 mb-8">
                  <h4 className="text-lg font-bold text-slate-900">{route.from}</h4>
                  <div className="flex-1 flex items-center">
                    <div className="w-2 h-2 rounded-full border-2 border-slate-300"></div>
                    <div className="flex-1 border-t-2 border-dashed border-slate-200 relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors">
                        <FiChevronRight size={16} />
                      </div>
                    </div>
                    <div className="w-2 h-2 rounded-full border-2 border-blue-500 bg-white"></div>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">{route.to}</h4>
                </div>

                <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-500 mb-0.5">Giá vé từ</span>
                    <span className="text-lg font-black text-blue-600">{route.avgPrice.toLocaleString()}đ</span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FiChevronRight size={20} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full sm:hidden mt-4 py-3 bg-slate-50 text-blue-600 font-semibold rounded-xl border border-slate-200">
            Xem tất cả tuyến đường
          </button>
        </section>

      </div>
    </div>
  )
}
