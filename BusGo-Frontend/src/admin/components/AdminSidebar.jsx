import React from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthUtil } from '@/utils/helpers'
import './AdminSidebar.css'

/**
 * AdminSidebar - Sidebar bên trái hiển thị menu
 */
function AdminSidebar({ isOpen, userRole, menuItems, onClose }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    AuthUtil.logout()
    navigate('/login')
  }

  const handleMenuClick = (path) => {
    navigate(path)
    onClose?.()
  }

  return (
    <>
      {/* Backdrop cho mobile */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">🚌</span>
            <span className="logo-text">BusGo</span>
          </div>
          <button className="sidebar-close btn" onClick={onClose}>
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Role Badge */}
        <div className="sidebar-role-badge">
          <span className={`role-badge role-${userRole?.toLowerCase()}`}>
            {getRoleLabel(userRole)}
          </span>
        </div>

        {/* Menu Items */}
        <nav className="sidebar-nav">
          {menuItems.length > 0 ? (
            <ul className="nav-list">
              {menuItems.map((item) => (
                <li key={item.id} className="nav-item">
                  <button
                    className="nav-link"
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

        {/* Logout Button */}
        <div className="sidebar-footer">
          <button className="btn btn-logout w-100" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
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

/**
 * Hàm hỗ trợ - Lấy icon cho menu
 */
function getMenuIcon(iconName) {
  const icons = {
    bus: '🚌',
    route: '🛣️',
    clock: '⏰',
    users: '👥',
    chart: '📊',
    calendar: '📅',
    road: '🛣️',
    qrcode: '📱',
    search: '🔍',
    undo: '↩️'
  }
  return icons[iconName] || '→'
}

export default AdminSidebar
