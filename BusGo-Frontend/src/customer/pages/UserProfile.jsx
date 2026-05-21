import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiUser,
  FiMail,
  FiPhone,
  FiEdit2,
  FiLogOut,
  FiStar,
  FiTrendingUp,
  FiAward,
  FiCreditCard,
  FiCalendar,
  FiMapPin,
  FiAlertTriangle
} from 'react-icons/fi'
import { StorageUtil } from '../../utils/helpers'
import { getProfileAPI, updateProfileAPI } from '../../services/authService'
import { getMyTicketsAPI } from '../../services/bookingService'
import './UserProfile.css'

export default function UserProfile() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: '',
    membershipLevel: 'bronze', // bronze, silver, gold
    diemTichLuy: 0,
    totalSpent: 0,
    joinedDate: new Date().toISOString(),
    avatar: '👤'
  })

  const [recentTransactions, setRecentTransactions] = useState([])

  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    phone: ''
  })

  const membershipLevels = {
    bronze: {
      icon: '🥉',
      name: 'Bronze',
      color: '#cd7f32',
      bgColor: 'rgba(205, 127, 50, 0.1)',
      benefits: ['Tích lũy điểm mỗi lần đặt vé', 'Ưu đãi 5% cho nhóm 10+ người'],
      minPoints: 0,
      maxPoints: 5000
    },
    silver: {
      icon: '🥈',
      name: 'Silver',
      color: '#c0c0c0',
      bgColor: 'rgba(192, 192, 192, 0.1)',
      benefits: ['Tích lũy điểm 1.2x', 'Ưu đãi 10% cho nhóm 10+ người', 'Miễn phí hóa đơn điện tử'],
      minPoints: 5000,
      maxPoints: 15000
    },
    gold: {
      icon: '🥇',
      name: 'Gold',
      color: '#ffd700',
      bgColor: 'rgba(255, 215, 0, 0.1)',
      benefits: ['Tích lũy điểm 1.5x', 'Ưu đãi 15% cho nhóm 10+ người', 'Hỗ trợ VIP 24/7', 'Ưu tiên đặt chỗ'],
      minPoints: 15000,
      maxPoints: 50000
    }
  }

  useEffect(() => {
    const token = StorageUtil.getToken()
    if (!token) {
      navigate('/login')
      return
    }

    const loadProfileData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // 1. Fetch profile info
        const profile = await getProfileAPI(token)
        
        // 2. Fetch booking history for recent transactions
        let tickets = []
        try {
          tickets = await getMyTicketsAPI(token)
        } catch (err) {
          console.error('Failed to load tickets:', err)
        }

        const dbLevel = (profile.capDoThanhVien || 'bronze').toLowerCase()
        const mappedLevel = ['bronze', 'silver', 'gold'].includes(dbLevel) ? dbLevel : 'bronze'

        setUserInfo({
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          membershipLevel: mappedLevel,
          diemTichLuy: profile.diemTichLuy || 0,
          totalSpent: Number(profile.tongTienDaChiTra || 0),
          joinedDate: profile.ngayTaoTaiKhoan || new Date().toISOString(),
          avatar: '👤'
        })

        // Map recent transactions (limit to 4 items)
        const mappedTransactions = tickets.slice(0, 4).map(ticket => ({
          id: ticket.id,
          route: `${ticket.from} → ${ticket.to}`,
          date: ticket.date,
          amount: ticket.price,
          points: Math.round(ticket.price / 10000), // 1 point per 10k VND
          status: ticket.status === 'Da thanh toan' ? 'completed' : (ticket.status === 'Da huy' ? 'cancelled' : 'pending')
        }))

        setRecentTransactions(mappedTransactions)
      } catch (err) {
        console.error('Lỗi tải thông tin cá nhân:', err)
        setError(err.message || 'Lỗi khi tải thông tin hồ sơ')
      } finally {
        setLoading(false)
      }
    }

    loadProfileData()
  }, [navigate])

  const currentMembership = membershipLevels[userInfo.membershipLevel]
  const nextLevelKey = userInfo.membershipLevel === 'bronze' ? 'silver' : userInfo.membershipLevel === 'silver' ? 'gold' : 'gold'
  const nextMembership = membershipLevels[nextLevelKey]
  const pointsToNextLevel = nextMembership.minPoints - userInfo.diemTichLuy
  const progressPercentage = (userInfo.diemTichLuy / nextMembership.minPoints) * 100

  const handleEditClick = () => {
    setEditMode(true)
    setEditData({
      name: userInfo.name,
      email: userInfo.email,
      phone: userInfo.phone
    })
  }

  const handleSave = async () => {
    const token = StorageUtil.getToken()
    if (!token) return

    // Validation
    if (!editData.name.trim()) {
      setError('Họ tên không được để trống')
      return
    }
    if (!editData.email.trim()) {
      setError('Email không được để trống')
      return
    }
    if (!editData.phone.trim()) {
      setError('Số điện thoại không được để trống')
      return
    }

    try {
      setError(null)
      setSuccessMsg(null)
      const res = await updateProfileAPI(token, {
        name: editData.name,
        email: editData.email,
        phone: editData.phone
      })

      // Update state
      setUserInfo(prev => ({
        ...prev,
        name: editData.name,
        email: editData.email,
        phone: editData.phone
      }))

      // Update LocalStorage to keep Header in sync
      const currentUser = StorageUtil.getUser() || {}
      StorageUtil.setUser({
        ...currentUser,
        name: editData.name,
        email: editData.email,
        phone: editData.phone
      })

      // Update old format key for compatibility
      const oldUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      localStorage.setItem('userInfo', JSON.stringify({
        ...oldUserInfo,
        fullName: editData.name,
        email: editData.email,
        phone: editData.phone
      }))

      setSuccessMsg(res.message || 'Cập nhật thông tin thành công!')
      setEditMode(false)

      setTimeout(() => {
        setSuccessMsg(null)
      }, 3000)

    } catch (err) {
      console.error('Lỗi khi lưu thông tin:', err)
      setError(err.message || 'Lỗi khi cập nhật hồ sơ')
    }
  }

  const handleCancel = () => {
    setEditMode(false)
    setError(null)
  }

  const handleLogout = () => {
    if (window.confirm('Bạn chắc chắn muốn đăng xuất?')) {
      StorageUtil.clearAuth()
      navigate('/')
    }
  }

  const formatCurrency = (amount) => {
    return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Đang tải thông tin tài khoản...</p>
      </div>
    )
  }

  if (error && !editMode && userInfo.name === '') {
    return (
      <div className="profile-error">
        <FiAlertTriangle className="profile-error-icon" />
        <h3>Đã xảy ra lỗi</h3>
        <p>{error}</p>
        <button className="btn-retry" onClick={() => window.location.reload()}>Thử lại</button>
      </div>
    )
  }

  return (
    <div className="user-profile">
      {/* Alert Messages */}
      {successMsg && (
        <div className="alert alert-success mx-auto" style={{ maxWidth: '1200px', width: '90%', marginTop: '20px' }}>
          {successMsg}
        </div>
      )}
      {error && (
        <div className="alert alert-danger mx-auto" style={{ maxWidth: '1200px', width: '90%', marginTop: '20px' }}>
          {error}
        </div>
      )}

      {/* Profile Header */}
      <div className="profile-header">
        <div className="header-background" style={{
          background: `linear-gradient(135deg, ${currentMembership.color} 0%, rgba(102, 126, 234, 0.8) 100%)`
        }}></div>

        <div className="header-content">
          <div className="profile-avatar">
            <span className="avatar-emoji">{userInfo.avatar}</span>
          </div>

          {!editMode ? (
            <>
              <div className="profile-info">
                <h1>{userInfo.name}</h1>
                <p className="membership-badge">
                  <span className="badge-icon">{currentMembership.icon}</span>
                  {currentMembership.name} Member
                </p>
              </div>
              <button className="btn-edit" onClick={handleEditClick}>
                <FiEdit2 size={18} />
                Chỉnh sửa
              </button>
            </>
          ) : (
            <div className="edit-quick-info">
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                placeholder="Tên đầy đủ"
                className="edit-input"
              />
              <div className="edit-buttons">
                <button className="btn-save" onClick={handleSave}>Lưu</button>
                <button className="btn-cancel" onClick={handleCancel}>Hủy</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="profile-container">
        {/* Membership & Points Section */}
        <section className="profile-section membership-section">
          <h2>Cấp độ Thành viên & Điểm</h2>

          <div className="membership-card">
            <div className="membership-top">
              <div className="membership-icon-large" style={{ backgroundColor: currentMembership.bgColor }}>
                <span style={{ fontSize: '40px' }}>{currentMembership.icon}</span>
              </div>

              <div className="membership-stats">
                <div className="stat">
                  <span className="stat-label">Điểm Tích Lũy</span>
                  <span className="stat-value" style={{ color: currentMembership.color }}>
                    {userInfo.diemTichLuy.toLocaleString()}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Tổng Chi Tiêu</span>
                  <span className="stat-value">{formatCurrency(userInfo.totalSpent)}</span>
                </div>
              </div>
            </div>

            {/* Progress to Next Level */}
            {userInfo.membershipLevel !== 'gold' && (
              <div className="progress-section">
                <div className="progress-header">
                  <span className="progress-label">
                    Tiến tới <strong>{nextMembership.name}</strong>
                  </span>
                  <span className="points-needed">
                    Cần {pointsToNextLevel > 0 ? pointsToNextLevel.toLocaleString() : 0} điểm
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min(progressPercentage, 100)}%` }}></div>
                </div>
                <div className="progress-milestones">
                  <span>{userInfo.membershipLevel === 'bronze' ? 'Bronze' : 'Silver'}</span>
                  <span>{nextMembership.name}</span>
                </div>
              </div>
            )}

            {userInfo.membershipLevel === 'gold' && (
              <div className="max-level-badge">
                <FiAward size={20} />
                <span>Bạn đã đạt cấp độ cao nhất!</span>
              </div>
            )}

            {/* Membership Benefits */}
            <div className="benefits-list">
              <h3>Quyền lợi {currentMembership.name}</h3>
              <ul>
                {currentMembership.benefits.map((benefit, idx) => (
                  <li key={idx}>
                    <span className="check-mark">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Personal Information Section */}
        <section className="profile-section info-section">
          <h2>Thông tin Cá nhân</h2>

          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">
                <FiUser size={20} />
              </div>
              <div className="info-content">
                <span className="info-label">Họ tên</span>
                {editMode ? (
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="edit-input-inline"
                  />
                ) : (
                  <span className="info-value">{userInfo.name}</span>
                )}
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <FiMail size={20} />
              </div>
              <div className="info-content">
                <span className="info-label">Email</span>
                {editMode ? (
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    className="edit-input-inline"
                  />
                ) : (
                  <span className="info-value">{userInfo.email}</span>
                )}
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <FiPhone size={20} />
              </div>
              <div className="info-content">
                <span className="info-label">Số điện thoại</span>
                {editMode ? (
                  <input
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    className="edit-input-inline"
                  />
                ) : (
                  <span className="info-value">{userInfo.phone}</span>
                )}
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <FiCalendar size={20} />
              </div>
              <div className="info-content">
                <span className="info-label">Thành viên từ</span>
                <span className="info-value">{formatDate(userInfo.joinedDate)}</span>
              </div>
            </div>
          </div>

          {editMode && (
            <div className="edit-actions">
              <button className="btn-save" onClick={handleSave}>Lưu thay đổi</button>
              <button className="btn-cancel" onClick={handleCancel}>Hủy</button>
            </div>
          )}
        </section>

        {/* Recent Transactions Section */}
        <section className="profile-section transactions-section">
          <h2>Lịch sử Giao dịch</h2>

          <div className="transactions-table">
            <div className="table-header">
              <div className="table-col col-route">Tuyến đường</div>
              <div className="table-col col-date">Ngày</div>
              <div className="table-col col-amount">Số tiền</div>
              <div className="table-col col-points">Điểm</div>
              <div className="table-col col-status">Trạng thái</div>
            </div>

            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="table-row">
                <div className="table-col col-route">
                  <div className="route-info">
                    <FiMapPin size={16} />
                    {transaction.route}
                  </div>
                </div>
                <div className="table-col col-date">
                  {formatDate(transaction.date)}
                </div>
                <div className="table-col col-amount">
                  <strong>{formatCurrency(transaction.amount)}</strong>
                </div>
                <div className="table-col col-points">
                  <span className="points-badge">+{transaction.points}</span>
                </div>
                <div className="table-col col-status">
                  <span className={`status-badge status-${transaction.status}`}>
                    ✓ Hoàn thành
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Account Actions */}
        <section className="profile-section actions-section">
          <button className="btn-logout" onClick={handleLogout}>
            <FiLogOut size={18} />
            Đăng xuất
          </button>
        </section>
      </div>
    </div>
  )
}
