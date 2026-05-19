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
  FiMapPin
} from 'react-icons/fi'
import { StorageUtil } from '../utils/helpers'
import './UserProfile.css'

export default function UserProfile() {
  const navigate = useNavigate()
  const [userInfo, setUserInfo] = useState({
    name: 'Nguyễn Văn A',
    email: 'user@example.com',
    phone: '0987654321',
    membershipLevel: 'silver', // bronze, silver, gold
    diemTichLuy: 2450,
    totalSpent: 8750000,
    joinedDate: '2023-05-15',
    avatar: '👤'
  })

  const [recentTransactions, setRecentTransactions] = useState([
    {
      id: 1,
      route: 'TP. Hồ Chí Minh → Cần Thơ',
      date: '2024-04-10',
      amount: 95000,
      points: 95,
      status: 'completed'
    },
    {
      id: 2,
      route: 'TP. Hồ Chí Minh → Nha Trang',
      date: '2024-04-08',
      amount: 165000,
      points: 165,
      status: 'completed'
    },
    {
      id: 3,
      route: 'TP. Hồ Chí Minh → Đà Lạt',
      date: '2024-04-05',
      amount: 185000,
      points: 185,
      status: 'completed'
    },
    {
      id: 4,
      route: 'Hà Nội → TP. Hồ Chí Minh',
      date: '2024-03-28',
      amount: 385000,
      points: 385,
      status: 'completed'
    }
  ])

  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState(userInfo)

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

  const currentMembership = membershipLevels[userInfo.membershipLevel]
  const nextLevelKey = userInfo.membershipLevel === 'bronze' ? 'silver' : userInfo.membershipLevel === 'silver' ? 'gold' : 'gold'
  const nextMembership = membershipLevels[nextLevelKey]
  const pointsToNextLevel = nextMembership.minPoints - userInfo.diemTichLuy
  const progressPercentage = (userInfo.diemTichLuy / nextMembership.minPoints) * 100

  const handleEditClick = () => {
    setEditMode(true)
    setEditData(userInfo)
  }

  const handleSave = () => {
    setUserInfo(editData)
    setEditMode(false)
  }

  const handleCancel = () => {
    setEditMode(false)
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

  return (
    <div className="user-profile">
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
