import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthUtil, StorageUtil } from '@/utils/helpers'
import axios from 'axios'
import './AdminTopbar.css'

const API = 'http://localhost:5000/api'

/**
 * AdminTopbar - Thanh trên cùng hiển thị user info, thông báo và logout
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

  const handleLogout = () => {
    AuthUtil.logout()
    navigate('/login')
  }

  const unreadCount = notifications.filter(n => !n.daDoc).length

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
        <div className="topbar-item notif-dropdown-container">
          <button
            className="btn-icon"
            title="Thông báo"
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown)
              setShowDropdown(false)
            }}
          >
            <i className="fas fa-bell" />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
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

        {/* User Profile Dropdown */}
        <div className="topbar-item user-dropdown-container">
          <button
            className="btn-user-profile"
            onClick={() => {
              setShowDropdown(!showDropdown)
              setShowNotifDropdown(false)
            }}
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

      {/* Close dropdowns when clicking outside */}
      {(showDropdown || showNotifDropdown) && (
        <div
          className="dropdown-backdrop"
          onClick={() => {
            setShowDropdown(false)
            setShowNotifDropdown(false)
          }}
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
