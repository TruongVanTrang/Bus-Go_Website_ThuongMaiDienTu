import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthUtil, StorageUtil } from '@/utils/helpers'
import { ROLE_MENU, USER_ROLES } from '@/utils/constants'
import AdminSidebar from '../components/AdminSidebar'
import AdminTopbar from '../components/AdminTopbar'
import axios from 'axios'
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
  const [incidents, setIncidents] = useState([])

  const fetchIncidents = async () => {
    try {
      const token = StorageUtil.getToken()
      const res = await axios.get('http://localhost:5000/api/admin/incidents', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setIncidents(res.data || [])
    } catch (e) {
      console.error('Error fetching incidents on dashboard:', e)
    }
  }

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

    if (role === 'ADMIN') {
      fetchIncidents()
    }
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
          <DashboardContent userRole={userRole} menuItems={menuItems} incidents={incidents} />
        </main>
      </div>
    </div>
  )
}

/**
 * DashboardContent - Hiển thị nội dung dashboard theo role
 */
function DashboardContent({ userRole, menuItems, incidents }) {
  const navigate = useNavigate()
  const unresolvedIncidents = incidents ? incidents.filter(i => i.trangThaiSuCo === 'cho_xu_ly') : []

  return (
    <div className="dashboard-content">
      {/* Welcome Section */}
      <section className="welcome-section">
        <h1 className="page-title">Chào mừng đến BusGo Dashboard</h1>
        <p className="page-subtitle">
          {getRoleName(userRole)} - Quản lý hệ thống
        </p>
      </section>

      {/* Warning Box for Admin */}
      {userRole === 'ADMIN' && unresolvedIncidents.length > 0 && (
        <div 
          className="alert alert-danger d-flex align-items-center justify-content-between p-3.5 mb-4 border-2 border-danger rounded-3 shadow-sm transition-all"
          style={{ 
            cursor: 'pointer', 
            backgroundColor: '#fff5f5', 
            borderColor: '#f5c6cb', 
            color: '#721c24',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #f5c6cb',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}
          onClick={() => navigate('/admin/reports?tab=incidents')}
        >
          <div className="d-flex align-items-center gap-3">
            <span style={{ fontSize: '24px' }}>⚠️</span>
            <div>
              <strong style={{ fontSize: '15px', color: '#721c24', display: 'block' }}>Cảnh báo vận hành khẩn cấp!</strong>
              <span style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>
                Có {unresolvedIncidents.length} sự cố hành trình mới đang chờ xử lý từ các tài xế. Nhấp vào đây để xem chi tiết và giải quyết.
              </span>
            </div>
          </div>
          <span style={{ fontSize: '13px', color: '#721c24', fontWeight: '700', whiteSpace: 'nowrap' }}>Giải quyết ngay &rarr;</span>
        </div>
      )}

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
