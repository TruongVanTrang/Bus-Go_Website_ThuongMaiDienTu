import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { StorageUtil } from '@/utils/helpers'
import { Menu, Search, Bell } from 'lucide-react'
import axios from 'axios'
import './AdminTopbar.css'

const API = 'http://localhost:5000/api'

function AdminTopbar({ userName, userRole, onMenuToggle }) {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)

  const token = () => StorageUtil.getToken()
  const headers = () => ({ Authorization: `Bearer ${token()}` })

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API}/admin/notifications`, { headers: headers() })
      setNotifications(res.data || [])
    } catch (e) {
      console.error('Error fetching admin notifications:', e)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll notifications every 10 seconds for real-time alerts
    const interval = setInterval(fetchNotifications, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleMarkAllRead = async () => {
    try {
      await axios.put(`${API}/admin/notifications/mark-read`, {}, { headers: headers() })
      setNotifications(prev => prev.map(n => ({ ...n, daDoc: true })))
    } catch (e) {
      console.error(e)
    }
  }



  const today = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  const unreadCount = notifications ? notifications.filter(n => !n.daDoc).length : 0

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 h-16 flex items-center justify-between px-6 md:px-8 font-sans">
      {/* Mobile Menu Toggle Button */}
      <div className="flex items-center gap-4 lg:hidden">
        <button 
          onClick={onMenuToggle}
          className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl border-none cursor-pointer transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Search Input */}
      <div className="hidden md:flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm nhanh chuyến xe, hành khách..."
            id="admin-topbar-search"
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-full bg-slate-50/50 text-slate-700 font-semibold text-sm focus:outline-none focus:border-[#004b87] focus:ring-4 focus:ring-[#004b87]/5 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Right side items */}
      <div className="flex items-center gap-4 ml-auto">
        <span className="hidden sm:inline-block text-xs font-bold text-slate-400">{today}</span>

        {/* Notifications Bell */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="relative p-2.5 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-full border-none bg-transparent cursor-pointer transition-colors"
            title="Thông báo"
            id="admin-bell-btn"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 flex items-center justify-center text-[10px] font-black text-white bg-red-500 rounded-full border border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowNotifDropdown(false)} 
              />
              <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden max-h-[400px] flex flex-col">
                <div className="p-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-800">Thông báo hệ thống</span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllRead}
                      className="text-xs text-[#004b87] hover:underline font-bold bg-transparent border-none cursor-pointer"
                    >
                      Đọc tất cả
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto divide-y divide-slate-50">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs font-bold">Không có thông báo mới</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.maThongBao}
                        className={`p-3.5 flex flex-col gap-1 cursor-pointer transition-colors ${!n.daDoc ? 'bg-blue-50/30 hover:bg-blue-50/50' : 'hover:bg-slate-50'}`}
                        onClick={() => {
                          if (n.lienKet) {
                            navigate(n.lienKet)
                          }
                          setShowNotifDropdown(false)
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs ${!n.daDoc ? 'font-black text-slate-800' : 'font-semibold text-slate-650'}`}>{n.tieuDe}</p>
                          {!n.daDoc && <span className="w-1.5 h-1.5 bg-[#004b87] rounded-full mt-1.5 flex-shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-450 font-medium leading-relaxed">{n.noiDung}</p>
                        <span className="text-[9px] text-slate-400 font-bold self-end mt-1">
                          {new Date(n.thoiGianTao).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>


      </div>
    </header>
  )
}



export default AdminTopbar
