import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AuthUtil } from '@/utils/helpers'
import './AdminSidebar.css'

/**
 * AdminSidebar - Sidebar trắng theo style BusGo dashboard
 */
function AdminSidebar({ isOpen, userRole, userName, menuItems, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()

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
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>

        {/* Logo */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">🚌</span>
            <span className="logo-text">BusGo</span>
          </div>
          <button className="sidebar-close" onClick={onClose}>
            <i className="fas fa-times" />
          </button>
        </div>

        {/* User Profile */}
        <div className="sidebar-profile">
          <div className="sidebar-user-avatar">
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{userName || 'Người dùng'}</div>
            <div className="sidebar-user-role">{getRoleLabel(userRole)}</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {menuItems.length > 0 ? (
            <ul className="nav-list">
              {menuItems.map((item) => (
                <li key={item.id} className="nav-item">
                  <button
                    className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                    onClick={() => handleMenuClick(item.path)}
                  >
                    <span className="nav-icon">{getMenuIcon(item.icon)}</span>
                    <span className="nav-label">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="no-menu-message">
              <p>Không có menu cho vai trò này</p>
            </div>
          )}
        </nav>

        {/* Logout */}
        <div className="sidebar-footer">
          <button className="btn-logout" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt" />
            <span>Đăng xuất</span>
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

function getMenuIcon(iconName) {
  const icons = {
    dashboard: '▣',
    bus: '🚌',
    route: '🛣️',
    clock: '⏰',
    users: '👥',
    staff: '👔',
    chart: '📊',
    calendar: '📅',
    road: '🗺️',
    qrcode: '📱',
    search: '🔍',
    undo: '↩️',
    overview: '⊞'
  }
  return icons[iconName] || '•'
}

export default AdminSidebar
