import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AuthUtil } from '@/utils/helpers'
import { 
  Users, Bus, Clock, Calendar, MessageSquare, Clipboard, QrCode, 
  Search, Undo, BarChart3, MapPin, ChevronRight, Menu, LogOut, Grid,
  LayoutDashboard, ShieldAlert, Navigation, Package
} from 'lucide-react'
import './AdminSidebar.css'

function AdminSidebar({ isOpen, userRole, userName, menuItems, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()

  const [isSidebarPinned, setIsSidebarPinned] = useState(() => {
    return localStorage.getItem('admin_sidebar_pinned') === 'true'
  })
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)

  const isSidebarCollapsed = !isSidebarPinned && !isSidebarHovered

  useEffect(() => {
    if (isSidebarPinned) {
      document.body.classList.add('sidebar-pinned')
    } else {
      document.body.classList.remove('sidebar-pinned')
    }
  }, [isSidebarPinned])

  const handlePinToggle = () => {
    const next = !isSidebarPinned
    setIsSidebarPinned(next)
    localStorage.setItem('admin_sidebar_pinned', String(next))
  }

  const handleLogout = () => {
    AuthUtil.logout()
    navigate('/login')
  }

  const handleMenuClick = (path) => {
    navigate(path)
    onClose?.()
  }

  const isActive = (path) => location.pathname === path

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        onMouseEnter={() => !isSidebarPinned && setIsSidebarHovered(true)}
        onMouseLeave={() => !isSidebarPinned && setIsSidebarHovered(false)}
        className={`admin-sidebar fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-slate-100 flex flex-col justify-between py-6 px-4 transition-all duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* ---- User Profile Header (same as Driver) ---- */}
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between px-2'}`}>
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 bg-[#004b87] rounded-xl flex items-center justify-center shadow-lg shadow-[#004b87]/20 text-white font-black text-sm uppercase flex-shrink-0">
                {userName ? userName.charAt(0).toUpperCase() : 'A'}
              </div>
              {!isSidebarCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-black text-slate-800 truncate leading-tight">
                    {userName || 'Người dùng'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                    {getRoleLabel(userRole)}
                  </span>
                </div>
              )}
            </div>

            {!isSidebarCollapsed && (
              <button
                onClick={handlePinToggle}
                className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-[#004b87] transition-all bg-transparent border-none cursor-pointer"
                title={isSidebarPinned ? 'Thu gọn sidebar' : 'Ghim sidebar'}
              >
                <ChevronRight
                  className={`h-4 w-4 transition-transform duration-300 ${isSidebarPinned ? 'rotate-180' : ''}`}
                />
              </button>
            )}
          </div>

          <div className="h-px bg-slate-100 mx-2" />

          {/* ---- Navigation links ---- */}
          <nav className="space-y-1.5">
            {menuItems && menuItems.length > 0 ? (
              menuItems.map((item) => {
                const active = isActive(item.path)
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item.path)}
                    className={`flex items-center w-full rounded-xl py-3 text-sm font-extrabold tracking-wide transition-all group duration-200 border-none bg-transparent cursor-pointer ${
                      isSidebarCollapsed ? 'justify-center px-0' : 'px-4'
                    } ${
                      active
                        ? 'bg-sky-50 text-[#004b87]'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    <div className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-105'}`}>
                      {getMenuIcon(item.icon, active)}
                    </div>
                    {!isSidebarCollapsed && (
                      <span className="ml-3 truncate">{item.label}</span>
                    )}
                  </button>
                )
              })
            ) : (
              <div className="p-4 text-center text-slate-400 text-xs font-bold">
                Không có menu
              </div>
            )}
          </nav>
        </div>

        {/* ---- Sidebar Footer ---- */}
        <div className="space-y-4">
          {/* Collapsed: show menu/pin toggle button */}
          {isSidebarCollapsed && (
            <button
              onClick={handlePinToggle}
              className="flex items-center justify-center w-full h-11 hover:bg-slate-50 text-slate-400 hover:text-[#004b87] rounded-xl border-none bg-transparent cursor-pointer"
              title="Ghim sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={`flex items-center rounded-xl py-3.5 text-sm font-extrabold text-red-500 hover:bg-red-50 w-full transition-all border-none bg-transparent cursor-pointer ${
              isSidebarCollapsed ? 'justify-center px-0' : 'px-4'
            }`}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!isSidebarCollapsed && (
              <span className="ml-3">Đăng xuất</span>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}

function getRoleLabel(role) {
  const labels = {
    ADMIN: 'Quản trị viên',
    DRIVER: 'Tài xế điều hành',
    TICKET_STAFF: 'Nhân viên soát vé',
    SUPPORT_STAFF: 'Nhân viên hỗ trợ'
  }
  return labels[role] || 'User'
}

function getMenuIcon(iconName, active) {
  const cls = `h-5 w-5 ${active ? 'text-[#004b87]' : 'text-slate-400 group-hover:text-slate-600'}`
  const icons = {
    dashboard: <LayoutDashboard className={cls} />,
    bus: <Bus className={cls} />,
    route: <MapPin className={cls} />,
    clock: <Clock className={cls} />,
    users: <Users className={cls} />,
    staff: <ShieldAlert className={cls} />,
    chart: <BarChart3 className={cls} />,
    calendar: <Calendar className={cls} />,
    road: <Navigation className={cls} />,
    qrcode: <QrCode className={cls} />,
    clipboard: <Clipboard className={cls} />,
    search: <Search className={cls} />,
    undo: <Undo className={cls} />,
    overview: <Grid className={cls} />,
    package: <Package className={cls} />
  }
  return icons[iconName] || <Grid className={cls} />
}

export default AdminSidebar
