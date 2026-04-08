import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthUtil, StorageUtil } from '@/utils/helpers'
import { ROLE_MENU, USER_ROLES } from '@/utils/constants'
import AdminSidebar from '../components/AdminSidebar'
import AdminTopbar from '../components/AdminTopbar'
import '../pages/AdminDashboard.css'

/**
 * AdminDashboard - Giao diện quản trị tập trung
 * Hiển thị menu động theo role và nội dung mặc định
 */
function AdminDashboard() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userRole, setUserRole] = useState(null)
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Lấy thông tin user
    const role = AuthUtil.getCurrentRole()
    const user = AuthUtil.getCurrentUser()

    if (!role) {
      navigate('/login')
      return
    }

    setUserRole(role)
    setUserName(user?.name || 'User')
    setLoading(false)
  }, [navigate])

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    )
  }

  const menuItems = ROLE_MENU[userRole] || []

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        userRole={userRole}
        menuItems={menuItems}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="admin-main">
        {/* Topbar */}
        <AdminTopbar
          userName={userName}
          userRole={userRole}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Content */}
        <main className="admin-content">
          <DashboardContent userRole={userRole} menuItems={menuItems} />
        </main>
      </div>
    </div>
  )
}

/**
 * DashboardContent - Hiển thị nội dung dashboard theo role
 */
function DashboardContent({ userRole, menuItems }) {
  return (
    <div className="dashboard-content">
      {/* Welcome Section */}
      <section className="welcome-section">
        <h1 className="page-title">Chào mừng đến BusGo Dashboard</h1>
        <p className="page-subtitle">
          {getRoleName(userRole)} - Quản lý hệ thống
        </p>
      </section>

      {/* Stats Grid */}
      <section className="stats-grid">
        {getRoleStats(userRole).map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </section>

      {/* Menu Overview */}
      <section className="menu-overview">
        <h2 className="section-title">Chức năng của bạn</h2>
        <div className="menu-cards-grid">
          {menuItems.length > 0 ? (
            menuItems.map((item) => (
              <MenuCard key={item.id} {...item} />
            ))
          ) : (
            <div className="no-menu-message">
              <p>Không có chức năng có sẵn cho vai trò này</p>
            </div>
          )}
        </div>
      </section>

      {/* Info Section */}
      <section className="info-section">
        <div className="info-card">
          <h3>ℹ️ Thông tin hệ thống</h3>
          <ul>
            <li>BusGo Dashboard v1.0.0</li>
            <li>Phiên bản API: v1</li>
            <li>Trạng thái: Hoạt động</li>
          </ul>
        </div>
      </section>
    </div>
  )
}

/**
 * StatCard - Thành phần hiển thị thống kê
 */
function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon stat-icon-${color}`}>
        <span>{icon}</span>
      </div>
      <div className="stat-content">
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  )
}

/**
 * MenuCard - Thành phần hiển thị menu item
 */
function MenuCard({ label, icon, path }) {
  const navigate = useNavigate()

  return (
    <div className="menu-card" onClick={() => navigate(path)}>
      <div className="menu-icon">{getMenuIcon(icon)}</div>
      <p className="menu-label">{label}</p>
      <span className="menu-arrow">→</span>
    </div>
  )
}

/**
 * Hàm hỗ trợ - Lấy tên role
 */
function getRoleName(role) {
  const roleNames = {
    [USER_ROLES.ADMIN]: 'Quản trị viên',
    [USER_ROLES.DRIVER]: 'Tài xế',
    [USER_ROLES.TICKET_STAFF]: 'Nhân viên soát vé',
    [USER_ROLES.SUPPORT_STAFF]: 'Nhân viên hỗ trợ'
  }
  return roleNames[role] || 'Người dùng'
}

/**
 * Hàm hỗ trợ - Lấy thống kê theo role
 */
function getRoleStats(role) {
  const statsMap = {
    [USER_ROLES.ADMIN]: [
      { icon: '🚌', label: 'Tổng số xe', value: '42', color: 'blue' },
      { icon: '🛣️', label: 'Tuyến đường', value: '15', color: 'green' },
      { icon: '👥', label: 'Người dùng', value: '1,234', color: 'orange' },
      { icon: '💰', label: 'Doanh thu hôm nay', value: '12.5M', color: 'purple' }
    ],
    [USER_ROLES.DRIVER]: [
      { icon: '📅', label: 'Chuyến hôm nay', value: '4', color: 'blue' },
      { icon: '⏱️', label: 'Giờ chạy', value: '8h 30m', color: 'green' },
      { icon: '😊', label: 'Đánh giá', value: '4.8/5', color: 'orange' },
      { icon: '🚗', label: 'Xe được gán', value: '02-A-12345', color: 'purple' }
    ],
    [USER_ROLES.TICKET_STAFF]: [
      { icon: '📋', label: 'Vé cần soát', value: '42', color: 'blue' },
      { icon: '✅', label: 'Vé đã soát', value: '156', color: 'green' },
      { icon: '🚌', label: 'Chuyến hôm nay', value: '8', color: 'orange' },
      { icon: '👤', label: 'Hành khách', value: '892', color: 'purple' }
    ],
    [USER_ROLES.SUPPORT_STAFF]: [
      { icon: '🎫', label: 'Yêu cầu hoàn/hủy', value: '7', color: 'blue' },
      { icon: '⏳', label: 'Đang xử lý', value: '3', color: 'orange' },
      { icon: '✔️', label: 'Hoàn thành hôm nay', value: '12', color: 'green' },
      { icon: '⭐', label: 'Thỏa mãn khách', value: '98%', color: 'purple' }
    ]
  }

  return statsMap[role] || []
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

export default AdminDashboard
