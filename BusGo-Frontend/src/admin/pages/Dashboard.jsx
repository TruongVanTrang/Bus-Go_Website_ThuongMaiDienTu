import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthUtil, StorageUtil } from '@/utils/helpers'
import { ROLE_MENU, USER_ROLES } from '@/utils/constants'
import AdminSidebar from '../components/AdminSidebar'
import AdminTopbar from '../components/AdminTopbar'
import TicketStaffPage from './TicketStaffPage'
import axios from 'axios'
import '../pages/AdminDashboard.css'

/**
 * AdminDashboard - Giao diện chính theo style hình minh họa BusGo
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
    const role = AuthUtil.getCurrentRole()
    const user = AuthUtil.getCurrentUser()
    if (!role) { navigate('/login'); return }
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
        <div className="loading-spinner" />
        <p style={{ color: '#9ca3af', fontSize: '13px' }}>Đang tải...</p>
      </div>
    )
  }

  if (userRole === USER_ROLES.TICKET_STAFF) {
    return <TicketStaffPage />
  }

  const menuItems = ROLE_MENU[userRole] || []

  return (
    <div className="admin-dashboard">
      <AdminSidebar
        isOpen={sidebarOpen}
        userRole={userRole}
        userName={userName}
        menuItems={menuItems}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="admin-main">
        <AdminTopbar
          userName={userName}
          userRole={userRole}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="admin-content">
          <DashboardContent userRole={userRole} menuItems={menuItems} userName={userName} navigate={navigate} />
        </main>
      </div>
    </div>
  )
}

/**
 * DashboardContent - Nội dung dashboard khớp hình minh họa
 */
function DashboardContent({ userRole, menuItems, userName, navigate }) {
  const today = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })

  const stats = getRoleStats(userRole)
  const steps = getOperationSteps(userRole)
  const tripData = getDemoTrip(userRole)

  return (
    <div className="dashboard-content">

      {/* ── Welcome Banner ─────────────────────────────── */}
      <div className="welcome-banner">
        <div className="welcome-left">
          <span className="welcome-badge">Trang quản trị {getRoleName(userRole)}</span>
          <h1 className="welcome-name">Xin chào, {userName}!</h1>
          <div className="welcome-info">
            <i className="fas fa-calendar-alt" />
            <span>{today} — Ca vận hành của bạn đang hoạt động</span>
          </div>
        </div>
        <div className="welcome-right">
          <div className="status-group">
            <span className="status-label-small">Trạng thái làm việc</span>
            <div className="status-badge">
              <span className="status-dot" />
              Đang hoạt động
            </div>
          </div>
          {userRole === USER_ROLES.DRIVER && (
            <button className="btn-end-shift" id="btn-end-shift">Kết thúc ca</button>
          )}
        </div>
      </div>

      {/* ── Stats Row ──────────────────────────────────── */}
      <div className="stats-row">
        {stats.map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </div>

      {/* ── Main Two-Column Grid ───────────────────────── */}
      <div className="main-grid">

        {/* Left: upcoming trip OR function cards */}
        <div>
          {tripData ? (
            <div className="section-card">
              <div className="section-card-header">
                <div className="section-card-title">
                  <span>⏰</span> Chuyến xe sắp khởi hành (Gần nhất)
                </div>
                <button className="section-card-link" id="btn-view-all-trips">
                  Xem tất cả chuyến <i className="fas fa-chevron-right" />
                </button>
              </div>
              <TripCard trip={tripData} />
            </div>
          ) : (
            <div className="section-card">
              <div className="section-card-header">
                <div className="section-card-title">
                  <span>⚡</span> Chức năng của bạn
                </div>
              </div>
              {menuItems.length > 0 ? (
                <div className="menu-cards-grid">
                  {menuItems.map(item => (
                    <MenuCard key={item.id} {...item} navigate={navigate} />
                  ))}
                </div>
              ) : (
                <div className="no-menu-message">Không có chức năng cho vai trò này</div>
              )}
            </div>
          )}

          {/* Show menu cards below trip for roles with both */}
          {tripData && menuItems.length > 0 && (
            <div className="section-card" style={{ marginTop: 14 }}>
              <div className="section-card-header">
                <div className="section-card-title">
                  <span>⚡</span> Chức năng của bạn
                </div>
              </div>
              <div className="menu-cards-grid">
                {menuItems.map(item => (
                  <MenuCard key={item.id} {...item} navigate={navigate} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Process + Support */}
        <div className="right-panel">
          <div className="section-card">
            <div className="section-card-header">
              <div className="section-card-title">
                Quy trình vận hành an toàn
              </div>
            </div>
            <ul className="process-list">
              {steps.map((step, i) => (
                <li key={i} className="process-item">
                  <span className="process-num">{i + 1}</span>
                  <span className="process-text">{step}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="section-card">
            <div className="section-card-header">
              <div className="section-card-title">Hỗ trợ khẩn cấp 24/7</div>
            </div>
            <div className="support-body">
              <button className="btn-support" id="btn-hotline">
                <i className="fas fa-phone" /> Gọi Tổng Đài
              </button>
              <button className="btn-support" id="btn-tech">
                <i className="fas fa-tools" /> Kỹ Thuật Viên
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

/**
 * StatCard - Card thống kê theo style hình minh họa
 */
function StatCard({ label, value, icon, sub, subType }) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <div className="stat-label">{label}</div>
        <span className="stat-icon">{icon}</span>
      </div>
      <div className="stat-value">{value}</div>
      {sub && (
        <div className="stat-sub">
          {subType === 'dot-orange' && <span className="dot-orange" />}
          {subType === 'arrow-up' && <span className="arrow-up">↗</span>}
          {sub}
        </div>
      )}
    </div>
  )
}

/**
 * TripCard - Hiển thị chuyến sắp khởi hành theo hình minh họa
 */
function TripCard({ trip }) {
  return (
    <div className="trip-card">
      <div className="trip-card-top">
        <div>
          <div className="trip-route-label">Hành trình</div>
          <div className="trip-route">
            <span>{trip.from}</span>
            <span className="trip-route-arrow">→</span>
            <span>{trip.to}</span>
          </div>
        </div>
        <div className="trip-badges">
          <span className="badge-recommend">KHUYẾN CHẠY</span>
          <span className="badge-scheduled">Đã lên lịch</span>
        </div>
      </div>

      <div className="trip-details">
        <div className="trip-detail-item">
          <div className="trip-detail-label"><i className="far fa-clock" /> Giờ đi</div>
          <div className="trip-detail-value">{trip.departTime}</div>
        </div>
        <div className="trip-detail-item">
          <div className="trip-detail-label"><i className="far fa-clock" /> Giờ đến</div>
          <div className="trip-detail-value">{trip.arriveTime}</div>
        </div>
        <div className="trip-detail-item">
          <div className="trip-detail-label"><i className="fas fa-bus" /> Xe & Biển số</div>
          <div className="trip-detail-value">{trip.plate}</div>
        </div>
        <div className="trip-detail-item">
          <div className="trip-detail-label"><i className="fas fa-users" /> Số khách</div>
          <div className="trip-detail-value">{trip.passengers}/{trip.capacity} người</div>
        </div>
      </div>

      <div className="trip-card-footer">
        <div className="trip-notice">
          <i className="fas fa-info-circle" />
          Vui lòng làm thủ tục check-in cho khách trước giờ khởi hành 15 phút.
        </div>
        <div className="trip-actions">
          <button className="btn-trip-detail" id="btn-trip-detail">Xem chi tiết</button>
          <button className="btn-trip-start" id="btn-trip-start">
            <i className="fas fa-play" /> Bắt đầu chuyến
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * MenuCard
 */
function MenuCard({ label, icon, path, navigate }) {
  return (
    <div
      className="menu-card"
      onClick={() => navigate(path)}
      id={`menu-${path.replace(/\//g, '-').replace(/^-/, '')}`}
    >
      <div className="menu-icon-wrap">{getMenuIcon(icon)}</div>
      <p className="menu-label">{label}</p>
      <span className="menu-arrow">→</span>
    </div>
  )
}

// ── Helper functions ──────────────────────────────────────────────

function getRoleName(role) {
  return {
    [USER_ROLES.ADMIN]: 'Quản trị viên',
    [USER_ROLES.DRIVER]: 'Tài xế',
    [USER_ROLES.TICKET_STAFF]: 'Nhân viên soát vé',
    [USER_ROLES.SUPPORT_STAFF]: 'Nhân viên hỗ trợ'
  }[role] || 'Người dùng'
}

function getRoleStats(role) {
  const map = {
    [USER_ROLES.ADMIN]: [
      { label: 'Tổng số xe',       value: '42',    icon: '🚌', sub: 'Toàn bộ đội xe',          subType: '' },
      { label: 'Tuyến đường',      value: '15',    icon: '🛣️', sub: 'Đang hoạt động',           subType: '' },
      { label: 'Người dùng',       value: '1,234', icon: '👥', sub: 'Đã đăng ký hệ thống',       subType: '' },
      { label: 'Doanh thu hôm nay',value: '12.5M', icon: '💰', sub: '+8% so với hôm qua',       subType: 'arrow-up' }
    ],
    [USER_ROLES.DRIVER]: [
      { label: 'Chuyến hôm nay',    value: '5 Chuyến', icon: '📅', sub: 'Lịch trình cố định',                subType: 'arrow-up' },
      { label: 'Chuyến đang chạy', value: '0 Chuyến', icon: '🚌', sub: 'Đang di chuyển trên tuyến',         subType: 'dot-orange' },
      { label: 'Khách chuyến chọn',value: '4 Khách',  icon: '👥', sub: 'Chọn tuyến Đà Nẵng → Huế',         subType: '' },
      { label: 'Hàng hóa cần giao',value: '2 Kiện',   icon: '📦', sub: 'Chờ xác nhận & vận chuyển',        subType: '' }
    ],
    [USER_ROLES.TICKET_STAFF]: [
      { label: 'Vé cần soát',      value: '42', icon: '📋', sub: 'Chờ xử lý hôm nay',    subType: '' },
      { label: 'Vé đã soát',       value: '156', icon: '✅', sub: 'Đã xử lý hôm nay',     subType: 'arrow-up' },
      { label: 'Chuyến hôm nay',   value: '8',  icon: '🚌', sub: 'Đang vận hành',         subType: 'dot-orange' },
      { label: 'Hành khách',       value: '892',icon: '👥', sub: 'Tổng hành khách hôm nay',subType: '' }
    ],
    [USER_ROLES.SUPPORT_STAFF]: [
      { label: 'Yêu cầu hoàn/hủy',  value: '7',  icon: '🎫', sub: 'Cần xử lý hôm nay',    subType: '' },
      { label: 'Đang xử lý',         value: '3',  icon: '⏳', sub: 'Trong hàng đợi',        subType: 'dot-orange' },
      { label: 'Hoàn thành hôm nay', value: '12', icon: '✔️', sub: 'Đã giải quyết',         subType: 'arrow-up' },
      { label: 'Thỏa mãn khách',     value: '98%',icon: '⭐', sub: 'Đánh giá hài lòng',     subType: '' }
    ]
  }
  return map[role] || []
}

function getDemoTrip(role) {
  if (role === USER_ROLES.DRIVER) {
    return {
      from: 'Đà Nẵng',
      to: 'Huế',
      departTime: '13:00',
      arriveTime: '15:00',
      plate: '29A-54321 (35 chỗ)',
      passengers: 4,
      capacity: 35
    }
  }
  return null
}

function getOperationSteps(role) {
  const map = {
    [USER_ROLES.ADMIN]: [
      'Kiểm tra tổng quan hệ thống và các thống kê hàng ngày.',
      'Xem xét và phê duyệt thay đổi tuyến đường, lịch trình.',
      'Quản lý người dùng, phân quyền và xử lý báo cáo.',
      'Kiểm tra doanh thu và xuất file thống kê cuối ngày.'
    ],
    [USER_ROLES.DRIVER]: [
      'Kiểm tra phương tiện kỹ thuật và nhiên liệu trước khi xuất phát.',
      'Mở điều hòa và dọn dẹp vệ sinh buồng lái & khoang hành khách.',
      'Soát vé và kiểm tra hành lý/hàng hóa đi kèm trước khi lên xe.',
      'Cập nhật trạng thái hành trình đầy đủ trên hệ thống ứng dụng.'
    ],
    [USER_ROLES.TICKET_STAFF]: [
      'Kiểm tra danh sách hành khách trên chuyến xe đã phân công.',
      'Quét mã QR vé điện tử của từng hành khách khi lên xe.',
      'Xử lý các trường hợp vé không hợp lệ hoặc cần hỗ trợ.',
      'Báo cáo kết quả soát vé sau khi chuyến xe khởi hành.'
    ],
    [USER_ROLES.SUPPORT_STAFF]: [
      'Kiểm tra danh sách yêu cầu hoàn/hủy vé mới trong ngày.',
      'Tra cứu thông tin vé và xác minh yêu cầu của khách hàng.',
      'Xử lý hoàn tiền hoặc đổi vé theo quy trình quy định.',
      'Cập nhật trạng thái xử lý và thông báo cho khách hàng.'
    ]
  }
  return map[role] || [
    'Đăng nhập và kiểm tra thông tin tài khoản.',
    'Thực hiện các chức năng được phân quyền.',
    'Báo cáo sự cố (nếu có) cho bộ phận quản lý.'
  ]
}

function getMenuIcon(iconName) {
  return {
    bus: '🚌', route: '🛣️', clock: '⏰', users: '👥',
    chart: '📊', calendar: '📅', road: '🗺️',
    qrcode: '📱', search: '🔍', undo: '↩️', staff: '👔'
  }[iconName] || '→'
}

export default AdminDashboard
