import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthUtil } from '@/utils/helpers'
import './AdminTopbar.css'

/**
 * AdminTopbar - Thanh trên cùng hiển thị user info và logout
 */
function AdminTopbar({ userName, userRole, onMenuToggle }) {
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)

  const handleLogout = () => {
    AuthUtil.logout()
    navigate('/login')
  }

  return (
    <header className="admin-topbar">
      <div className="topbar-left">
        <button className="btn-menu-toggle" onClick={onMenuToggle}>
          <i className="fas fa-bars" />
        </button>
      </div>

      <div className="topbar-center">
        <h1 className="topbar-title">BusGo Dashboard</h1>
      </div>

      <div className="topbar-right">
        {/* Notifications */}
        <div className="topbar-item">
          <button className="btn-icon" title="Thông báo">
            <i className="fas fa-bell" />
            <span className="notification-badge">3</span>
          </button>
        </div>

        {/* User Profile Dropdown */}
        <div className="topbar-item user-dropdown-container">
          <button
            className="btn-user-profile"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <span className="user-avatar">{userName.charAt(0).toUpperCase()}</span>
            <span className="user-info">
              <span className="user-name">{userName}</span>
              <span className="user-role">{getRoleLabel(userRole)}</span>
            </span>
            <i className="fas fa-chevron-down" />
          </button>

          {/* Dropdown Menu */}
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

      {/* Close dropdown when clicking outside */}
      {showDropdown && (
        <div
          className="dropdown-backdrop"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </header>
  )
}

/**
 * Hàm hỗ trợ - Lấy nhãn role
 */
function getRoleLabel(role) {
  const labels = {
    ADMIN: 'Quản trị viên',
    DRIVER: 'Tài xế',
    TICKET_STAFF: 'Soát vé',
    SUPPORT_STAFF: 'Hỗ trợ'
  }
  return labels[role] || 'User'
}

export default AdminTopbar
