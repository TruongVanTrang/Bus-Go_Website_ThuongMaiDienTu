import { Link, useNavigate, useLocation } from 'react-router-dom'
import { FiMenu, FiX, FiClock, FiArrowLeft } from 'react-icons/fi'
import { useState } from 'react'
import './Header.css'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Show back button on specific routes
  const showBackButton = ['/booking', '/payment', '/ticket', '/search'].some(route =>
    location.pathname.startsWith(route)
  )

  return (
    <header className="bg-white border-bottom shadow-sm sticky-top">
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
              >
                Đăng Ký
              </button>
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
            >
              Đăng Ký
            </button>
          </div>
        </div>
      </nav>
    </header>
  )
}
