import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthUtil } from '@/utils/helpers'
import './AdminTopbar.css'

/**
 * AdminTopbar - Thanh trên cùng giống hình minh họa BusGo
 */
function AdminTopbar({ userName, userRole, onMenuToggle }) {
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)

  const handleLogout = () => {
    AuthUtil.logout()
    navigate('/login')
  }

  const today = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  return (
    <header className="admin-topbar">
      {/* Mobile menu toggle */}
      <div className="topbar-left">
        <button className="btn-menu-toggle" onClick={onMenuToggle}>
          <i className="fas fa-bars" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="topbar-search">
        <i className="fas fa-search topbar-search-icon" />
        <input
          type="text"
          placeholder="Tìm kiếm nhanh chuyến xe, hành khách..."
          id="admin-topbar-search"
        />
      </div>

      {/* Right side */}
      <div className="topbar-right">
        {/* Date */}
        <span className="topbar-date">{today}</span>

        {/* Bell notification */}
        <div className="topbar-item">
          <button className="btn-icon" title="Thông báo" id="admin-bell-btn">
            <i className="fas fa-bell" />
          </button>
        </div>

        {/* User Profile */}
        <div className="topbar-item user-dropdown-container">
          <button
            className="btn-user-profile"
            onClick={() => setShowDropdown(!showDropdown)}
            id="admin-profile-btn"
          >
            <span className="user-avatar">{userName?.charAt(0)?.toUpperCase() || 'U'}</span>
            <span className="user-info">
              <span className="user-name">{userName}</span>
              <span className="user-role">{getRoleLabel(userRole)}</span>
            </span>
            <i className="fas fa-chevron-down" />
          </button>

          {showDropdown && (
            <div className="user-dropdown-menu">
              <a href="#" className="dropdown-item">
                <i className="fas fa-user" /> Hồ sơ cá nhân
              </a>
              <a href="#" className="dropdown-item">
                <i className="fas fa-cog" /> Cài đặt
              </a>
              <div className="dropdown-divider" />
              <button className="dropdown-item btn-logout" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt" /> Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>

      {showDropdown && (
        <div className="dropdown-backdrop" onClick={() => setShowDropdown(false)} />
      )}
    </header>
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

export default AdminTopbar
