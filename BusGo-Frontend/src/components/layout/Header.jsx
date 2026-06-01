import { Link, useNavigate, useLocation } from 'react-router-dom'
import { FiMenu, FiX, FiClock, FiLogOut, FiUser } from 'react-icons/fi'
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
      className={`w-full z-[100] transition-all duration-300 ${
        isHomePage ? 'sticky top-0 left-0' : 'sticky top-0 left-0'
      } bg-white shadow-sm py-3 border-b border-slate-100`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1 text-2xl font-black tracking-tight">
            <span className={`transition-colors ${logoBlue}`}>Bus</span>
            <span className={`transition-colors ${logoDark}`}>Go</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className={`font-semibold text-[15px] transition-colors ${textColor} ${textHover}`}>
              Trang Chủ
            </Link>
            <Link to="/search" className={`font-semibold text-[15px] transition-colors ${textColor} ${textHover}`}>
              Tìm Vé
            </Link>
            <Link to="/cargo-consignment" className={`font-semibold text-[15px] transition-colors ${textColor} ${textHover}`}>
              Gửi Hàng
            </Link>
          </nav>

          {/* Desktop Auth/Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/history"
              className={`flex items-center gap-2 font-medium text-[14px] px-3 py-2 rounded-full transition-colors bg-slate-100 text-slate-700 hover:bg-slate-200`}
            >
              <FiClock size={16} />
              <span>Lịch sử</span>
            </Link>

            {user ? (
              <div className="relative user-profile-dropdown">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-colors border-blue-600 text-blue-600 hover:bg-blue-50`}
                >
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-[14px]">{user.name.split(' ').pop()}</span>
                </button>
                
                {/* Dropdown Menu */}
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden origin-top-right animate-in fade-in slide-in-from-top-2">
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <FiUser size={16} className="text-blue-500" />
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
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <FiLogOut size={16} />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className={`font-semibold text-[14px] px-4 py-2 rounded-full transition-colors text-blue-600 hover:bg-blue-50`}
                >
                  Đăng Nhập
                </Link>
                <Link
                  to="/register"
                  className={`font-semibold text-[14px] px-5 py-2 rounded-full transition-colors bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg`}
                >
                  Đăng Ký
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className={`md:hidden p-2 rounded-lg transition-colors text-slate-700 hover:bg-slate-100`}
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
              <Link to="/" className="font-semibold text-slate-800 text-lg">Trang Chủ</Link>
              <Link to="/search" className="font-semibold text-slate-800 text-lg">Tìm Vé</Link>
              <Link to="/cargo-consignment" className="font-semibold text-slate-800 text-lg">Gửi Hàng</Link>
            </nav>
            
            <div className="flex flex-col gap-3 pt-2">
              <Link
                to="/history"
                className="flex items-center justify-center gap-2 font-medium text-slate-700 bg-slate-100 py-3 rounded-xl"
              >
                <FiClock size={18} />
                Lịch sử đặt vé
              </Link>
              
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="flex items-center justify-center gap-2 font-medium text-white bg-blue-600 py-3 rounded-xl shadow-md"
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
                    className="flex items-center justify-center gap-2 font-medium text-red-600 bg-red-50 py-3 rounded-xl"
                  >
                    <FiLogOut size={18} />
                    Đăng xuất
                  </button>
                </>
              ) : (
                <div className="flex gap-3">
                  <Link
                    to="/login"
                    className="flex-1 text-center font-semibold text-blue-600 bg-blue-50 py-3 rounded-xl"
                  >
                    Đăng Nhập
                  </Link>
                  <Link
                    to="/register"
                    className="flex-1 text-center font-semibold text-white bg-blue-600 py-3 rounded-xl shadow-md"
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
