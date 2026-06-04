import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthUtil, StorageUtil } from '@/utils/helpers'
import axios from 'axios'
import './AdminTopbar.css'

const API = 'http://localhost:5000/api'

/**
 * AdminTopbar - Thanh trên cùng giống hình minh họa BusGo
 */
function AdminTopbar({ userName, userRole, onMenuToggle }) {
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)

  const token = () => StorageUtil.getToken()
  const headers = () => ({ Authorization: `Bearer ${token()}` })

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API}/admin/notifications`, { headers: headers() })
      setNotifications(res.data || [])
    } catch (e) {
      console.error('Error fetching admin notifications:', e)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll notifications every 10 seconds for real-time alerts
    const interval = setInterval(fetchNotifications, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleMarkAllRead = async () => {
    try {
      await axios.put(`${API}/admin/notifications/mark-read`, {}, { headers: headers() })
      setNotifications(prev => prev.map(n => ({ ...n, daDoc: true })))
    } catch (e) {
      console.error(e)
    }
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

          {showNotifDropdown && (
            <div className="notif-dropdown-menu">
              <div className="notif-header">
                <span className="notif-title">Thông báo hệ thống</span>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="btn-mark-read">
                    Đọc tất cả
                  </button>
                )}
              </div>
              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">Không có thông báo mới</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.maThongBao}
                      className={`notif-item ${!n.daDoc ? 'notif-unread' : ''}`}
                      onClick={() => {
                        if (n.lienKet) {
                          navigate(n.lienKet)
                        }
                        setShowNotifDropdown(false)
                      }}
                    >
                      <div className="notif-item-title">{n.tieuDe}</div>
                      <div className="notif-item-desc">{n.noiDung}</div>
                      <div className="notif-item-time">
                        {new Date(n.thoiGianTao).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
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
              <a href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); navigate('/admin/users') }}>
                <i className="fas fa-user" /> Hồ sơ cá nhân
              </a>
              <a href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); navigate('/admin/schedules') }}>
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
