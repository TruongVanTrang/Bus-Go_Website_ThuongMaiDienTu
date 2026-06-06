import { Link, useNavigate, useLocation } from 'react-router-dom'
import { FiMenu, FiX, FiClock, FiLogOut, FiUser, FiNavigation } from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { StorageUtil } from '../../utils/helpers'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  
  const navigate = useNavigate()
  const location = useLocation()

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

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-profile-dropdown')) {
        setProfileMenuOpen(false)
      }
    }

    if (profileMenuOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [profileMenuOpen])

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
              <div className="relative user-profile-dropdown">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-colors border-[#0066cc] text-[#0066cc] hover:bg-blue-50"
                >
                  <div className="w-6 h-6 rounded-full bg-[#0066cc] text-white flex items-center justify-center text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold text-[14px] text-[#0c3d66]">{user.name.split(' ').pop()}</span>
                </button>
                
                {/* Dropdown Menu */}
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden origin-top-right animate-in fade-in slide-in-from-top-2">
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

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-lg transition-colors text-slate-700 hover:bg-slate-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
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
