import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Bus,
  Camera,
  CameraOff,
  Check,
  CheckCircle,
  ClipboardList,
  Clock,
  Download,
  Info,
  Keyboard,
  LogOut,
  QrCode,
  Search,
  Users,
  X,
  XCircle
} from 'lucide-react'
import { AuthUtil } from '@/utils/helpers'
import { USER_ROLES } from '@/utils/constants'
import AdminTopbar from '../components/AdminTopbar'
import './AdminDashboard.css'
import './TicketStaffPage.css'

const PATH_VIEWS = {
  '/admin/dashboard': 'dashboard',
  '/admin/staff/scan': 'scan',
  '/admin/staff/passengers': 'passengers'
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Soát vé', icon: ClipboardList, path: '/admin/dashboard' },
  { id: 'scan', label: 'Quét mã QR soát vé', icon: QrCode, path: '/admin/staff/scan' },
  { id: 'passengers', label: 'Danh sách hành khách', icon: Users, path: '/admin/staff/passengers' }
]

const INITIAL_PASSENGERS = [
  { id: 'BG-001', name: 'Nguyễn Văn A', phone: '0912 345 678', seat: 'A01', trip: 'HN → HP', time: '08:00', status: 'boarded' },
  { id: 'BG-002', name: 'Trần Thị B', phone: '0987 654 321', seat: 'A02', trip: 'HN → HP', time: '08:00', status: 'boarded' },
  { id: 'BG-003', name: 'Lê Văn C', phone: '0901 234 567', seat: 'B01', trip: 'HN → HCM', time: '10:30', status: 'not_boarded' },
  { id: 'BG-004', name: 'Phạm Thị D', phone: '0933 111 222', seat: 'B02', trip: 'HN → HCM', time: '10:30', status: 'boarded' },
  { id: 'BG-005', name: 'Hoàng Văn E', phone: '0944 555 666', seat: 'C01', trip: 'HN → HP', time: '14:00', status: 'not_boarded' },
  { id: 'BG-006', name: 'Vũ Thị F', phone: '0955 777 888', seat: 'C02', trip: 'HN → HP', time: '14:00', status: 'boarded' },
  { id: 'BG-007', name: 'Đặng Văn G', phone: '0966 999 000', seat: 'D01', trip: 'HN → HCM', time: '16:00', status: 'boarded' },
  { id: 'BG-008', name: 'Bùi Thị H', phone: '0977 123 456', seat: 'D02', trip: 'HN → HCM', time: '16:00', status: 'not_boarded' }
]

const INITIAL_SCAN_RESULTS = [
  { id: 'BG-2024-001', name: 'Nguyễn Văn A', route: 'HN → HP', time: '10:30', valid: true },
  { id: 'BG-2024-002', name: 'Trần Thị B', route: 'HN → HP', time: '10:28', valid: true },
  { id: 'BG-2024-003', name: 'Lê Văn C', route: 'HN → HCM', time: '10:25', valid: false },
  { id: 'BG-2024-004', name: 'Phạm Thị D', route: 'HN → HCM', time: '10:22', valid: true },
  { id: 'BG-2024-005', name: 'Hoàng Văn E', route: 'HN → HP', time: '10:18', valid: false },
  { id: 'BG-2024-006', name: 'Vũ Thị F', route: 'HN → HP', time: '10:15', valid: true }
]

const KNOWN_TICKETS = {
  'BG-2024-001': { name: 'Nguyễn Văn A', route: 'HN → HP', valid: true },
  'BG-2024-002': { name: 'Trần Thị B', route: 'HN → HP', valid: true },
  'BG-2024-004': { name: 'Phạm Thị D', route: 'HN → HCM', valid: true },
  'BG-2024-006': { name: 'Vũ Thị F', route: 'HN → HP', valid: true },
  'BG-001': { name: 'Nguyễn Văn A', route: 'HN → HP', valid: true },
  'BG-002': { name: 'Trần Thị B', route: 'HN → HP', valid: true }
}

function getViewFromPath(pathname) {
  return PATH_VIEWS[pathname] || 'dashboard'
}

function formatTime() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

export default function TicketStaffPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)

  const activeView = getViewFromPath(location.pathname)

  useEffect(() => {
    const role = AuthUtil.getCurrentRole()
    const user = AuthUtil.getCurrentUser()
    if (!role) {
      navigate('/login')
      return
    }
    if (role !== USER_ROLES.TICKET_STAFF) {
      navigate('/unauthorized')
      return
    }
    setUserName(user?.name || 'Nhân viên soát vé')
    setLoading(false)
  }, [navigate])

  const handleNav = (path) => {
    navigate(path)
    setSidebarOpen(false)
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <TicketStaffSidebar
        isOpen={sidebarOpen}
        activeView={activeView}
        onNavigate={handleNav}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="admin-main">
        <AdminTopbar
          userName={userName}
          userRole="TICKET_STAFF"
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="admin-content">
          {activeView === 'dashboard' && <DashboardView onNavigate={handleNav} />}
          {activeView === 'scan' && <ScanView onGoPassengers={() => handleNav('/admin/staff/passengers')} />}
          {activeView === 'passengers' && <PassengersView />}
        </main>
      </div>
    </div>
  )
}

function TicketStaffSidebar({ isOpen, activeView, onNavigate, onClose }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    AuthUtil.logout()
    navigate('/login')
  }

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`admin-sidebar ticket-staff-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon"><Bus size={28} color="#3b82f6" /></span>
            <span className="logo-text">BusGo</span>
          </div>
          <button type="button" className="sidebar-close btn" onClick={onClose} aria-label="Đóng menu">
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = activeView === item.id
              return (
                <li key={item.id} className="nav-item">
                  <button
                    type="button"
                    className={`nav-link${isActive ? ' active' : ''}`}
                    onClick={() => onNavigate(item.path)}
                  >
                    <span className="nav-icon"><Icon size={20} /></span>
                    <span className="nav-label">{item.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="btn btn-logout w-100" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  )
}

function DashboardView({ onNavigate }) {
  const stats = [
    { icon: ClipboardList, label: 'Vé cần soát', value: '42', color: 'blue' },
    { icon: CheckCircle, label: 'Vé đã soát', value: '156', color: 'green' },
    { icon: Bus, label: 'Chuyến hôm nay', value: '8', color: 'orange' },
    { icon: Users, label: 'Hành khách', value: '892', color: 'purple' }
  ]

  return (
    <div className="dashboard-content">
      <section className="welcome-section">
        <h1 className="page-title">Chào mừng đến BusGo Dashboard</h1>
        <p className="page-subtitle">Nhân viên soát vé - Quản lý hệ thống</p>
      </section>

      <section className="stats-grid">
        {stats.map((stat) => (
          <TicketStatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="ticket-staff-actions">
        <button
          type="button"
          className="ticket-staff-action-card"
          onClick={() => onNavigate('/admin/staff/scan')}
        >
          <div className="action-icon action-icon-blue">
            <QrCode size={36} />
          </div>
          <p>Quét mã QR soát vé</p>
        </button>
        <button
          type="button"
          className="ticket-staff-action-card"
          onClick={() => onNavigate('/admin/staff/passengers')}
        >
          <div className="action-icon action-icon-purple">
            <Users size={36} />
          </div>
          <p>Danh sách hành khách</p>
        </button>
      </section>

      <section className="ticket-staff-info-banner">
        <h3><Info size={20} /> Thông tin hệ thống</h3>
        <ul>
          <li>BusGo Dashboard v1.0.0</li>
          <li>Phiên bản API: v1</li>
          <li>Trạng thái: Hoạt động</li>
        </ul>
      </section>
    </div>
  )
}

function TicketStatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon stat-icon-${color}`}>
        <Icon size={28} />
      </div>
      <div className="stat-content">
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  )
}

function ScanView({ onGoPassengers }) {
  const [cameraOn, setCameraOn] = useState(true)
  const [scanning, setScanning] = useState(true)
  const [showManualModal, setShowManualModal] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [scanResults, setScanResults] = useState(INITIAL_SCAN_RESULTS)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const validCount = scanResults.filter((r) => r.valid).length
  const invalidCount = scanResults.filter((r) => !r.valid).length

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraOn(true)
      setScanning(true)
    } catch {
      setCameraOn(false)
      setScanning(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraOn(false)
    setScanning(false)
  }

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  const addScanResult = (ticketId) => {
    const known = KNOWN_TICKETS[ticketId.trim().toUpperCase()] || KNOWN_TICKETS[ticketId.trim()]
    const entry = known
      ? { id: ticketId, name: known.name, route: known.route, time: formatTime(), valid: known.valid }
      : { id: ticketId, name: 'Không xác định', route: '—', time: formatTime(), valid: false }

    setScanResults((prev) => [entry, ...prev].slice(0, 20))
    setScanning(true)
  }

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (!manualCode.trim()) return
    addScanResult(manualCode.trim())
    setManualCode('')
    setShowManualModal(false)
  }

  const toggleCamera = () => {
    if (cameraOn) {
      stopCamera()
    } else {
      startCamera()
    }
  }

  return (
    <div className="dashboard-content">
      <div className="scan-page-header">
        <h1>Quét mã QR soát vé</h1>
        <p>Đưa mã QR vào khung quét để kiểm tra vé</p>
      </div>

      <div className="scan-layout">
        <div className="scan-viewport-card">
          <div className="scan-viewport-header">
            <h2>Khung quét</h2>
            <span className={`camera-status${cameraOn ? '' : ' off'}`}>
              <span className="camera-status-dot" />
              {cameraOn ? 'Camera đang bật' : 'Camera đang tắt'}
            </span>
          </div>

          <div className="scan-viewport">
            {cameraOn && (
              <video ref={videoRef} playsInline muted aria-label="Camera quét QR" />
            )}
            <div className="scan-frame">
              <span className="scan-corner scan-corner-tl" />
              <span className="scan-corner scan-corner-tr" />
              <span className="scan-corner scan-corner-bl" />
              <span className="scan-corner scan-corner-br" />
              {cameraOn && scanning && <span className="scan-line" />}
            </div>
            {cameraOn && scanning && (
              <div className="scan-placeholder">
                <div className="scan-spinner" />
                <span>Đang quét...</span>
              </div>
            )}
            {!cameraOn && (
              <div className="scan-placeholder">
                <CameraOff size={32} style={{ marginBottom: 8 }} />
                <span>Camera đã tắt</span>
              </div>
            )}
          </div>

          <div className="scan-actions">
            <button type="button" className="btn-outline" onClick={toggleCamera}>
              {cameraOn ? <CameraOff size={18} /> : <Camera size={18} />}
              {cameraOn ? 'Tắt camera' : 'Bật camera'}
            </button>
            <button type="button" className="btn-primary-scan" onClick={() => setShowManualModal(true)}>
              <Keyboard size={18} />
              Nhập mã thủ công
            </button>
          </div>
        </div>

        <div className="scan-results-card">
          <h3 className="scan-results-title">
            <Clock size={18} />
            Kết quả quét gần đây
          </h3>
          <div className="scan-summary">
            <div className="scan-summary-box valid">
              <div className="label">Hợp lệ</div>
              <div className="count">{validCount}</div>
            </div>
            <div className="scan-summary-box invalid">
              <div className="label">Không hợp lệ</div>
              <div className="count">{invalidCount}</div>
            </div>
          </div>
          <div className="scan-results-list">
            {scanResults.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="scan-result-item">
                <div className={`scan-result-icon${item.valid ? ' valid' : ' invalid'}`}>
                  {item.valid ? <Check size={18} /> : <X size={18} />}
                </div>
                <div className="scan-result-body">
                  <div className="ticket-id">{item.id}</div>
                  <div className="passenger">{item.name}</div>
                  <div className="route">{item.route}</div>
                </div>
                <span className="scan-result-time">{item.time}</span>
                <span className={`scan-result-badge${item.valid ? ' valid' : ' invalid'}`}>
                  {item.valid ? 'Hợp lệ' : 'Không hợp lệ'}
                </span>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn-detail-link"
            style={{ marginTop: 12, alignSelf: 'flex-start' }}
            onClick={onGoPassengers}
          >
            Xem danh sách hành khách →
          </button>
        </div>
      </div>

      {showManualModal && (
        <div className="ticket-staff-modal-backdrop" onClick={() => setShowManualModal(false)}>
          <div className="ticket-staff-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Nhập mã vé thủ công</h3>
            <form onSubmit={handleManualSubmit}>
              <input
                type="text"
                placeholder="VD: BG-2024-001"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                autoFocus
              />
              <div className="ticket-staff-modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowManualModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-submit">
                  Kiểm tra vé
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function PassengersView() {
  const [search, setSearch] = useState('')
  const [tripFilter, setTripFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedPassenger, setSelectedPassenger] = useState(null)

  const trips = useMemo(() => {
    const set = new Set(INITIAL_PASSENGERS.map((p) => `${p.trip} ${p.time}`))
    return ['all', ...set]
  }, [])

  const filtered = useMemo(() => {
    return INITIAL_PASSENGERS.filter((p) => {
      const q = search.toLowerCase().trim()
      const matchSearch =
        !q ||
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.phone.replace(/\s/g, '').includes(q.replace(/\s/g, ''))
      const tripKey = `${p.trip} ${p.time}`
      const matchTrip = tripFilter === 'all' || tripKey === tripFilter
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'boarded' && p.status === 'boarded') ||
        (statusFilter === 'not_boarded' && p.status === 'not_boarded')
      return matchSearch && matchTrip && matchStatus
    })
  }, [search, tripFilter, statusFilter])

  const boarded = filtered.filter((p) => p.status === 'boarded').length
  const notBoarded = filtered.filter((p) => p.status === 'not_boarded').length

  const handleExport = () => {
    const header = 'Mã vé,Họ tên,SĐT,Ghế,Chuyến,Trạng thái\n'
    const rows = filtered
      .map(
        (p) =>
          `${p.id},${p.name},${p.phone},${p.seat},"${p.trip} ${p.time}",${p.status === 'boarded' ? 'Đã lên xe' : 'Chưa lên xe'}`
      )
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'danh-sach-hanh-khach.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="dashboard-content">
      <div className="scan-page-header">
        <h1>Danh sách hành khách</h1>
        <p>Quản lý và kiểm tra hành khách trên chuyến</p>
      </div>

      <div className="passengers-toolbar">
        <div className="passengers-search">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT, mã vé..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="passengers-filters">
          <select value={tripFilter} onChange={(e) => setTripFilter(e.target.value)}>
            <option value="all">Tất cả chuyến</option>
            {trips.slice(1).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Tất cả</option>
            <option value="boarded">Đã lên xe</option>
            <option value="not_boarded">Chưa lên xe</option>
          </select>
        </div>
        <button type="button" className="btn-export" onClick={handleExport}>
          <Download size={18} />
          Xuất danh sách
        </button>
      </div>

      <div className="passengers-summary">
        <span>
          Tổng: <strong>{filtered.length}</strong>
        </span>
        <span className="boarded">Đã lên xe: {boarded}</span>
        <span className="not-boarded">Chưa lên xe: {notBoarded}</span>
      </div>

      <div className="passengers-table-card">
        <table className="passengers-table">
          <thead>
            <tr>
              <th>Mã vé</th>
              <th>Họ tên</th>
              <th>SĐT</th>
              <th>Ghế</th>
              <th>Chuyến</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.name}</td>
                <td>{p.phone}</td>
                <td>{p.seat}</td>
                <td>
                  {p.trip} {p.time}
                </td>
                <td>
                  <span className={`status-pill ${p.status === 'boarded' ? 'boarded' : 'not-boarded'}`}>
                    {p.status === 'boarded' ? 'Đã lên xe' : 'Chưa lên xe'}
                  </span>
                </td>
                <td>
                  <button type="button" className="btn-detail-link" onClick={() => setSelectedPassenger(p)}>
                    Chi tiết
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedPassenger && (
        <div className="passenger-detail-panel">
          <h4>Chi tiết hành khách — {selectedPassenger.id}</h4>
          <div className="passenger-detail-grid">
            <div>
              <span>Họ tên: </span>
              {selectedPassenger.name}
            </div>
            <div>
              <span>SĐT: </span>
              {selectedPassenger.phone}
            </div>
            <div>
              <span>Ghế: </span>
              {selectedPassenger.seat}
            </div>
            <div>
              <span>Chuyến: </span>
              {selectedPassenger.trip} {selectedPassenger.time}
            </div>
            <div>
              <span>Trạng thái: </span>
              {selectedPassenger.status === 'boarded' ? 'Đã lên xe' : 'Chưa lên xe'}
            </div>
          </div>
          <button
            type="button"
            className="btn-detail-link"
            style={{ marginTop: 12 }}
            onClick={() => setSelectedPassenger(null)}
          >
            Đóng
          </button>
        </div>
      )}
    </div>
  )
}
