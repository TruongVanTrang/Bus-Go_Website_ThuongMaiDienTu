import { Link, useNavigate, useLocation } from 'react-router-dom'
import { FiMenu, FiX, FiClock, FiArrowLeft, FiLogOut, FiUser } from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { StorageUtil } from '../../utils/helpers'
import './Header.css'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [serviceType, setServiceType] = useState('booking') // 'booking' or 'cargo'
  const [vehicleType, setVehicleType] = useState('all') // 'all', '16', '35'
  const [user, setUser] = useState(null)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Load user info from localStorage on mount
  useEffect(() => {
    const userData = StorageUtil.getUser()
    setUser(userData)
    setProfileMenuOpen(false)
  }, [location.pathname])

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const profileDropdown = document.querySelector('.user-profile-dropdown')
      if (profileDropdown && !profileDropdown.contains(event.target)) {
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

  // Show back button on specific routes
  const showBackButton = ['/booking', '/payment', '/ticket', '/search'].some(route =>
    location.pathname.startsWith(route)
  )

  // Hide tabs on certain routes
  const hideServiceTabs = ['/booking', '/payment', '/ticket', '/login'].some(route =>
    location.pathname.startsWith(route)
  )

  return (
    <header className="bg-white border-bottom sticky-top">
      <nav className="navbar navbar-expand-lg navbar-light">
        <div className="container-fluid px-md-5 px-3">
          {/* Back Button - Mobile & Desktop */}
          {showBackButton && (
            <button
              onClick={() => navigate(-1)}
              className="btn btn-sm me-2"
              style={{
                backgroundColor: 'transparent',
                color: '#0066cc',
                border: 'none',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
              title="Quay lại"
            >
              <FiArrowLeft size={20} />
            </button>
          )}

          {/* Logo */}
          <Link to="/" className="navbar-brand fw-bold fs-4">
            <span className="text-primary" style={{ color: 'var(--color-primary-600)' }}>
              Bus
            </span>
            <span className="text-secondary" style={{ color: 'var(--color-secondary-600)' }}>
              Go
            </span>
          </Link>

          {/* Mobile Toggle */}
          <button
            className="navbar-toggler border-0 p-0"
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <FiX size={24} />
            ) : (
              <FiMenu size={24} />
            )}
          </button>

          {/* Nav Items */}
          <div
            className={`collapse navbar-collapse ${mobileMenuOpen ? 'show' : ''}`}
            id="navbarNav"
          >
            <ul className="navbar-nav ms-auto gap-3">
              <li className="nav-item">
                <Link
                  to="/"
                  className="nav-link text-neutral-700 fw-500"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Trang Chủ
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/search"
                  className="nav-link text-neutral-700 fw-500"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Tìm Vé
                </Link>
              </li>
              <li className="nav-item">
                <a
                  href="#about"
                  className="nav-link text-neutral-700 fw-500"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Về Chúng Tôi
                </a>
              </li>
              <li className="nav-item">
                <a
                  href="#contact"
                  className="nav-link text-neutral-700 fw-500"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Liên Hệ
                </a>
              </li>
            </ul>

            {/* Auth Buttons - Mobile */}
            <div className="d-lg-none mt-3 gap-2 d-flex flex-column">
              <Link
                to="/history"
                className="btn btn-light text-decoration-none"
                style={{ border: '1px solid #e5e7eb', color: 'var(--color-primary-600)' }}
              >
                <FiClock size={18} className="me-2" style={{ display: 'inline' }} />
                Lịch Sử
              </Link>
              {user ? (
                <>
                  <button
                    className="btn btn-light w-100 text-start d-flex align-items-center gap-2"
                    style={{ border: '1px solid #e5e7eb' }}
                    onClick={() => {
                      navigate('/profile')
                      setMobileMenuOpen(false)
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>👤</span>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>
                        {user.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>Hồ sơ</div>
                    </div>
                  </button>
                  <button
                    className="btn btn-outline-danger w-100"
                    style={{ borderColor: '#ef4444', color: '#ef4444' }}
                    onClick={() => {
                      StorageUtil.clearAuth()
                      setUser(null)
                      navigate('/')
                      setMobileMenuOpen(false)
                    }}
                  >
                    <FiLogOut size={18} className="me-2" style={{ display: 'inline' }} />
                    Đăng Xuất
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn btn-outline-primary w-100"
                    style={{ color: 'var(--color-primary-600)', borderColor: 'var(--color-primary-600)' }}
                    onClick={() => {
                      navigate('/login')
                      setMobileMenuOpen(false)
                    }}
                  >
                    Đăng Nhập
                  </button>
                  <button
                    className="btn w-100"
                    style={{ backgroundColor: 'var(--color-primary-600)', color: 'white' }}
                    onClick={() => {
                      navigate('/register')
                      setMobileMenuOpen(false)
                    }}
                  >
                    Đăng Ký
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Auth Buttons - Desktop */}
          <div className="d-none d-lg-flex gap-2 ms-3 align-items-center">
            <Link
              to="/history"
              className="btn btn-light text-decoration-none"
              style={{ border: '1px solid #e5e7eb', color: 'var(--color-primary-600)', padding: '0.5rem 1rem' }}
            >
              <FiClock size={18} className="me-2" style={{ display: 'inline' }} />
              Lịch Sử
            </Link>
            {user ? (
              <div className="user-profile-dropdown" style={{ position: 'relative' }}>
                <button
                  className="btn user-profile-btn d-flex align-items-center gap-2 ps-2 pe-3"
                  style={{
                    border: '2px solid var(--color-primary-600)',
                    color: 'var(--color-primary-600)',
                    borderRadius: '50px',
                    padding: '0.4rem 0.75rem'
                  }}
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                >
                  <span style={{ fontSize: '20px' }}>👤</span>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>{user.name}</span>
                </button>
                {profileMenuOpen && (
                  <div
                    className="profile-dropdown-menu"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: '0',
                      marginTop: '0.5rem',
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      minWidth: '200px',
                      zIndex: 1000
                    }}
                  >
                    <button
                      className="dropdown-item d-flex align-items-center gap-2"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: 'none',
                        background: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease'
                      }}
                      onClick={() => {
                        navigate('/profile')
                        setProfileMenuOpen(false)
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9fafb'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <FiUser size={18} style={{ color: 'var(--color-primary-600)' }} />
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>Hồ sơ cá nhân</span>
                    </button>
                    <hr style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
                    <button
                      className="dropdown-item d-flex align-items-center gap-2"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: 'none',
                        background: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: '#ef4444',
                        transition: 'background 0.2s ease'
                      }}
                      onClick={() => {
                        StorageUtil.clearAuth()
                        setUser(null)
                        setProfileMenuOpen(false)
                        navigate('/')
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <FiLogOut size={18} />
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>Đăng Xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  className="btn btn-outline-primary"
                  style={{ color: 'var(--color-primary-600)', borderColor: 'var(--color-primary-600)' }}
                  onClick={() => navigate('/login')}
                >
                  Đăng Nhập
                </button>
                <button
                  className="btn"
                  style={{ backgroundColor: 'var(--color-primary-600)', color: 'white' }}
                  onClick={() => navigate('/register')}
                >
                  Đăng Ký
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Service & Vehicle Type Tabs - Only on home/search pages */}
      {!hideServiceTabs && (
        <div className="header-tabs-container border-top" style={{ backgroundColor: '#f9fafb' }}>
          <div className="container-fluid px-md-5 px-3">
            <div className="row align-items-center py-3 gx-3">
              {/* Service Type Tabs */}
              <div className="col-12 col-md-6 mb-3 mb-md-0">
                <div className="d-flex gap-3 align-items-center">
                  <span className="fw-600 text-neutral-700" style={{ whiteSpace: 'nowrap' }}>
                    Loại Dịch Vụ:
                  </span>
                  <div className="d-flex gap-2">
                    <button
                      onClick={() => setServiceType('booking')}
                      className={`btn btn-sm px-4 rounded-pill fw-500 transition-all`}
                      style={{
                        backgroundColor: serviceType === 'booking' ? 'var(--color-primary-600)' : '#e5e7eb',
                        color: serviceType === 'booking' ? 'white' : '#1a1a1a',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      🛫 Đặt Ghế
                    </button>
                    <button
                      onClick={() => setServiceType('cargo')}
                      className={`btn btn-sm px-4 rounded-pill fw-500`}
                      style={{
                        backgroundColor: serviceType === 'cargo' ? 'var(--color-primary-600)' : '#e5e7eb',
                        color: serviceType === 'cargo' ? 'white' : '#1a1a1a',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      📦 Gửi Hàng
                    </button>
                  </div>
                </div>
              </div>

              {/* Vehicle Type Tabs */}
              <div className="col-12 col-md-6">
                <div className="d-flex gap-3 align-items-center flex-wrap">
                  <span className="fw-600 text-neutral-700" style={{ whiteSpace: 'nowrap' }}>
                    Loại Xe:
                  </span>
                  <div className="d-flex gap-2 flex-wrap">
                    <button
                      onClick={() => setVehicleType('all')}
                      className={`btn btn-sm px-3 rounded-pill fw-500`}
                      style={{
                        backgroundColor: vehicleType === 'all' ? 'var(--color-primary-600)' : '#e5e7eb',
                        color: vehicleType === 'all' ? 'white' : '#1a1a1a',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        fontSize: '0.875rem'
                      }}
                    >
                      Tất Cả
                    </button>
                    <button
                      onClick={() => setVehicleType('16')}
                      className={`btn btn-sm px-3 rounded-pill fw-500`}
                      style={{
                        backgroundColor: vehicleType === '16' ? 'var(--color-primary-600)' : '#e5e7eb',
                        color: vehicleType === '16' ? 'white' : '#1a1a1a',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        fontSize: '0.875rem'
                      }}
                    >
                      🚐 16 Chỗ
                    </button>
                    <button
                      onClick={() => setVehicleType('35')}
                      className={`btn btn-sm px-3 rounded-pill fw-500`}
                      style={{
                        backgroundColor: vehicleType === '35' ? 'var(--color-primary-600)' : '#e5e7eb',
                        color: vehicleType === '35' ? 'white' : '#1a1a1a',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        fontSize: '0.875rem'
                      }}
                    >
                      🚌 35 Chỗ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
