import { Link, useNavigate, useLocation } from 'react-router-dom'
import { FiMenu, FiX, FiClock, FiLogOut, FiUser, FiNavigation, FiBell } from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { StorageUtil } from '../../utils/helpers'
import { getMyConsignmentsAPI } from '../../services/cargoService'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  
  // Notification states
  const [notifications, setNotifications] = useState([])
  const [notiMenuOpen, setNotiMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  
  const navigate = useNavigate()
  const location = useLocation()

  const generateNotifications = (consignmentsList, userId) => {
    if (!consignmentsList || consignmentsList.length === 0) return []
    
    const readIds = (() => {
      try {
        const saved = localStorage.getItem(`read_notifications_${userId || 'guest'}`)
        return saved ? JSON.parse(saved) : []
      } catch (e) {
        return []
      }
    })()

    const list = []
    
    consignmentsList.forEach(item => {
      const id = item.consignmentId || item.id
      const from = item.diemGui
      const to = item.diemNhan
      const status = item.trangThaiKyGui
      const isPaid = item.trangThaiThanhToan === 'paid'
      
      const dateStr = item.ngayGui ? new Date(item.ngayGui).toLocaleDateString('vi-VN') : ''
      const timeLabel = dateStr ? `Ngày ${dateStr}` : 'Vừa xong'

      // 1. Creation event
      const createdId = `${id}_created`
      list.push({
        id: createdId,
        text: `Bạn đã tạo yêu cầu gửi hàng ${id} từ ${from} đi ${to}.`,
        time: timeLabel,
        read: readIds.includes(createdId),
        timestamp: new Date(item.ngayGui || Date.now()).getTime()
      })

      // 2. Confirmed event
      if (['da_xac_nhan', 'in_transit', 'delivered'].includes(status)) {
        const approvedId = `${id}_approved`
        list.push({
          id: approvedId,
          text: `Yêu cầu gửi hàng ${id} đã được duyệt. Vui lòng thanh toán ngay.`,
          time: timeLabel,
          read: readIds.includes(approvedId),
          timestamp: new Date(item.ngayCapNhat || item.ngayGui || Date.now()).getTime() + 1000
        })
      }

      // 3. Paid event
      if (isPaid) {
        const paidId = `${id}_paid`
        list.push({
          id: paidId,
          text: `Thanh toán thành công đơn hàng ${id}. Tài xế chuẩn bị nhận hàng.`,
          time: timeLabel,
          read: readIds.includes(paidId),
          timestamp: new Date(item.ngayCapNhat || item.ngayGui || Date.now()).getTime() + 2000
        })
      }

      // 4. In Transit event
      if (['in_transit', 'delivered'].includes(status)) {
        const transitId = `${id}_in_transit`
        list.push({
          id: transitId,
          text: `Đơn hàng ${id} đang được vận chuyển. Tài xế đã nhận hàng từ điểm gửi.`,
          time: timeLabel,
          read: readIds.includes(transitId),
          timestamp: new Date(item.ngayCapNhat || item.ngayGui || Date.now()).getTime() + 3000
        })
      }

      // 5. Delivered event
      if (status === 'delivered') {
        const deliveredId = `${id}_delivered`
        list.push({
          id: deliveredId,
          text: `Đơn hàng ${id} đã được giao thành công đến người nhận.`,
          time: timeLabel,
          read: readIds.includes(deliveredId),
          timestamp: new Date(item.ngayCapNhat || item.ngayGui || Date.now()).getTime() + 4000
        })
      }

      // 6. Cancelled event
      if (['da_huy', 'failed'].includes(status)) {
        const cancelledId = `${id}_cancelled`
        list.push({
          id: cancelledId,
          text: `Đơn hàng ký gửi ${id} đã bị hủy.`,
          time: timeLabel,
          read: readIds.includes(cancelledId),
          timestamp: new Date(item.ngayCapNhat || item.ngayGui || Date.now()).getTime() + 5000
        })
      }
    })

    list.sort((a, b) => b.timestamp - a.timestamp)
    return list
  }

  const isHomePage = location.pathname === '/' || location.pathname === '/home'

  // Detect scroll to toggle transparent -> solid header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Load user info from localStorage on mount
  useEffect(() => {
    const userData = StorageUtil.getUser()
    setUser(userData)
    setProfileMenuOpen(false)
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Fetch cargo consignments to build notification feed
  useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    const fetchNotifications = async () => {
      try {
        const token = StorageUtil.getToken()
        if (!token) return
        const consignmentsData = await getMyConsignmentsAPI(token)
        const generated = generateNotifications(consignmentsData, user.id || user.maKhachHang)
        setNotifications(generated)
        setUnreadCount(generated.filter(n => !n.read).length)
      } catch (err) {
        console.error('Error fetching notifications:', err)
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 15000) // Poll every 15s to get quick updates
    return () => clearInterval(interval)
  }, [user])

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-profile-dropdown')) {
        setProfileMenuOpen(false)
      }
      if (!event.target.closest('.notification-dropdown') && !event.target.closest('.notification-dropdown-mobile')) {
        setNotiMenuOpen(false)
      }
    }

    if (profileMenuOpen || notiMenuOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [profileMenuOpen, notiMenuOpen])

  const markAllAsRead = () => {
    if (!user) return
    const userId = user.id || user.maKhachHang
    const readIds = notifications.map(n => n.id)
    localStorage.setItem(`read_notifications_${userId}`, JSON.stringify(readIds))
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const handleNotiClick = (noti) => {
    if (!user) return
    const userId = user.id || user.maKhachHang
    const saved = localStorage.getItem(`read_notifications_${userId}`)
    const readIds = saved ? JSON.parse(saved) : []
    if (!readIds.includes(noti.id)) {
      readIds.push(noti.id)
      localStorage.setItem(`read_notifications_${userId}`, JSON.stringify(readIds))
    }
    
    setNotifications(prev => prev.map(n => n.id === noti.id ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - (noti.read ? 0 : 1)))
    setNotiMenuOpen(false)
    navigate('/history', { state: { defaultTab: 'cargo' } })
  }

  const isTransparent = false // User requested a solid background at all times
  
  const textColor = 'text-slate-700'
  const textHover = 'hover:text-blue-600'
  const logoBlue = 'text-blue-600'
  const logoDark = 'text-slate-800'

  return (
    <header 
      className="w-full z-[100] sticky top-0 left-0 bg-white shadow-sm py-3 border-b border-slate-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-full bg-[#004e92] flex items-center justify-center text-white text-base shadow-sm transition-transform group-hover:scale-105">
              <FiNavigation className="text-white text-sm" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-[#0c3d66]">
              Bus<span className="text-[#0066cc]">Go</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              { name: 'TRANG CHỦ', path: '/' },
              { name: 'TÌM VÉ', path: '/search' },
              { name: 'LỊCH SỬ', path: '/history' },
              { name: 'GỬI HÀNG', path: '/cargo-consignment' }
            ].map((link) => {
              const isActive = location.pathname === link.path || (link.path === '/' && location.pathname === '/home');
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`font-extrabold text-[13px] tracking-wider transition-all duration-200 py-1.5 border-b-2 ${
                    isActive
                      ? 'text-[#0066cc] border-[#0066cc]'
                      : 'text-[#0c3d66] hover:text-[#0066cc] border-transparent'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Auth/Actions */}
          <div className="hidden md:flex items-center gap-6">
            {/* Vertical Divider */}
            <div className="h-6 w-[1px] bg-slate-200"></div>

            {user ? (
              <div className="flex items-center gap-4">
                {/* Notification Dropdown */}
                <div className="relative notification-dropdown">
                  <button
                    onClick={() => {
                      setNotiMenuOpen(!notiMenuOpen);
                      setProfileMenuOpen(false);
                    }}
                    className="relative p-2 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-full border-none bg-transparent cursor-pointer transition-colors flex items-center justify-center"
                  >
                    <FiBell size={20} className="text-[#0c3d66]" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 h-4 min-w-[16px] px-1 flex items-center justify-center text-[9px] font-black text-white bg-red-500 rounded-full border border-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  
                  {/* Dropdown Content */}
                  {notiMenuOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden origin-top-right z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
                        <span className="font-extrabold text-sm text-[#0c3d66]">Thông báo mới</span>
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllAsRead}
                            className="text-xs text-[#0066cc] hover:underline font-bold bg-transparent border-none cursor-pointer"
                          >
                            Đánh dấu đã đọc
                          </button>
                        )}
                      </div>
                      <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-50">
                        {notifications.length > 0 ? (
                          notifications.map(n => (
                            <div 
                              key={n.id} 
                              className={`flex gap-3 p-3.5 transition-all cursor-pointer ${!n.read ? 'bg-blue-50/30 hover:bg-blue-50/50' : 'hover:bg-slate-50'}`}
                              onClick={() => handleNotiClick(n)}
                            >
                              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? 'bg-[#0066cc]' : 'bg-transparent'}`} />
                              <div className="flex-1 flex flex-col gap-0.5">
                                <p className={`text-xs leading-normal ${!n.read ? 'font-bold text-slate-800' : 'font-medium text-slate-500'}`}>{n.text}</p>
                                <span className="text-[10px] text-slate-400 font-bold">{n.time}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-6 text-center text-slate-400 text-xs font-bold">Không có thông báo mới nào</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative user-profile-dropdown">
                  <button
                    onClick={() => {
                      setProfileMenuOpen(!profileMenuOpen);
                      setNotiMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-colors border-[#0066cc] text-[#0066cc] hover:bg-blue-50"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#0066cc] text-white flex items-center justify-center text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-[14px] text-[#0c3d66]">{user.name.split(' ').pop()}</span>
                  </button>
                
                  {/* Dropdown Menu */}
                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden origin-top-right animate-in fade-in slide-in-from-top-2 z-50">
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <FiUser size={16} className="text-[#0066cc]" />
                        Hồ sơ cá nhân
                      </Link>
                      <div className="h-px bg-slate-100"></div>
                      <button
                        onClick={() => {
                          StorageUtil.clearAuth()
                          setUser(null)
                          setProfileMenuOpen(false)
                          navigate('/')
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-650 hover:bg-red-50 transition-colors text-left"
                      >
                        <FiLogOut size={16} />
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </div>
          ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 font-bold text-[12px] px-4 py-2 rounded-full transition-all bg-[#004e92] hover:bg-[#00386b] text-white shadow-sm uppercase tracking-wider"
              >
                <span>ĐĂNG NHẬP</span>
                <FiLogOut size={15} className="rotate-180" />
              </Link>
            )}
          </div>

          {/* Mobile Right Actions */}
          <div className="flex items-center gap-2 md:hidden">
            {user && (
              <div className="relative notification-dropdown-mobile">
                <button
                  onClick={() => {
                    setNotiMenuOpen(!notiMenuOpen);
                    setMobileMenuOpen(false);
                  }}
                  className="relative p-2 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-full border-none bg-transparent cursor-pointer transition-colors flex items-center justify-center"
                >
                  <FiBell size={20} className="text-[#0c3d66]" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 h-4 min-w-[16px] px-1 flex items-center justify-center text-[9px] font-black text-white bg-red-500 rounded-full border border-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {/* Mobile Notification Dropdown Menu */}
                {notiMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden origin-top-right z-55">
                    <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                      <span className="font-extrabold text-xs text-[#0c3d66]">Thông báo</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[10px] text-[#0066cc] hover:underline font-bold bg-transparent border-none cursor-pointer"
                        >
                          Đánh dấu đã đọc
                        </button>
                      )}
                    </div>
                    <div className="max-h-[240px] overflow-y-auto divide-y divide-slate-100">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              handleNotiClick(n);
                              setNotiMenuOpen(false);
                            }}
                            className={`flex gap-2 p-2.5 transition-colors cursor-pointer hover:bg-slate-50 ${
                              !n.read ? 'bg-blue-50/40' : ''
                            }`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? 'bg-[#0066cc]' : 'bg-transparent'}`} />
                            <div className="flex-1 flex flex-col gap-0.5">
                              <p className={`text-[11px] leading-normal ${!n.read ? 'font-bold text-slate-800' : 'text-slate-500'}`}>
                                {n.text}
                              </p>
                              <span className="text-[9px] text-slate-400 font-semibold">{n.time}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-slate-400 text-[10px] font-bold">
                          Không có thông báo mới nào
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <button
              className="p-2 rounded-lg transition-colors text-slate-700 hover:bg-slate-100"
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                setNotiMenuOpen(false);
              }}
            >
              {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-xl border-t border-slate-100 animate-in slide-in-from-top-2">
          <div className="px-4 py-6 space-y-4">
            <nav className="flex flex-col gap-4 border-b border-slate-100 pb-6">
              <Link to="/" className="font-bold text-[#0c3d66] text-lg">Trang Chủ</Link>
              <Link to="/search" className="font-bold text-[#0c3d66] text-lg">Tìm Vé</Link>
              <Link to="/history" className="font-bold text-[#0c3d66] text-lg">Lịch Sử</Link>
              <Link to="/cargo-consignment" className="font-bold text-[#0c3d66] text-lg">Gửi Hàng</Link>
            </nav>
            
            <div className="flex flex-col gap-3 pt-2">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="flex items-center justify-center gap-2 font-semibold text-white bg-[#0066cc] py-3 rounded-xl shadow-md"
                  >
                    <FiUser size={18} />
                    Hồ sơ ({user.name})
                  </Link>
                  <button
                    onClick={() => {
                      StorageUtil.clearAuth()
                      setUser(null)
                      setMobileMenuOpen(false)
                      navigate('/')
                    }}
                    className="flex items-center justify-center gap-2 font-semibold text-red-650 bg-red-50 py-3 rounded-xl"
                  >
                    <FiLogOut size={18} />
                    Đăng xuất
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    className="text-center font-bold text-white bg-[#004e92] py-3 rounded-xl shadow-md uppercase tracking-wider"
                  >
                    Đăng Nhập
                  </Link>
                  <Link
                    to="/register"
                    className="text-center font-bold text-[#0066cc] bg-blue-50 py-3 rounded-xl border border-blue-200"
                  >
                    Đăng Ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
