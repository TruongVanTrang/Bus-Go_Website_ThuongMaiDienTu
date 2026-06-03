import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiUser,
  FiMail,
  FiPhone,
  FiEdit2,
  FiLogOut,
  FiAward,
  FiCalendar,
  FiMapPin,
  FiAlertTriangle,
  FiShield,
  FiCheck,
  FiX
} from 'react-icons/fi'
import { StorageUtil } from '../../utils/helpers'
import { getProfileAPI } from '../../services/authService'
import { getMyTicketsAPI } from '../../services/bookingService'

export default function UserProfile() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: '',
    membershipLevel: 'bronze',
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

  // OTP State
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpSending, setOtpSending] = useState(false)

  const membershipLevels = {
    bronze: {
      icon: '🥉',
      name: 'Bronze',
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      gradient: 'from-amber-500 to-orange-400',
      benefits: ['Tích lũy điểm mỗi lần đặt vé', 'Ưu đãi 5% cho nhóm 10+ người'],
      minPoints: 0,
      maxPoints: 5000
    },
    silver: {
      icon: '🥈',
      name: 'Silver',
      color: 'text-slate-500',
      bgColor: 'bg-slate-200',
      gradient: 'from-slate-400 to-slate-300',
      benefits: ['Tích lũy điểm 1.2x', 'Ưu đãi 10% cho nhóm 10+ người', 'Miễn phí hóa đơn điện tử'],
      minPoints: 5000,
      maxPoints: 15000
    },
    gold: {
      icon: '🥇',
      name: 'Gold',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100',
      gradient: 'from-yellow-400 to-amber-500',
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
        
        const profile = await getProfileAPI(token)
        
        let tickets = []
        try {
          tickets = await getMyTicketsAPI(token)
        } catch (err) {
          console.error('Failed to load tickets:', err)
        }

        const dbLevel = (profile.capDoThanhVien || 'bronze').toLowerCase()
        const mappedLevel = ['bronze', 'silver', 'gold'].includes(dbLevel) ? dbLevel : 'bronze'

        // Tính tổng chi tiêu từ các vé đã thanh toán thành công (bao gồm cả hàng hóa)
        const totalSpentFromTickets = tickets
          .filter(ticket => ticket.status === 'Da thanh toan')
          .reduce((sum, ticket) => {
            const ticketPrice = ticket.price || 0;
            const cargoPrice = ticket.cargoInfo?.price || 0;
            return sum + ticketPrice + cargoPrice;
          }, 0)

        setUserInfo({
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          membershipLevel: mappedLevel,
          diemTichLuy: profile.diemTichLuy || 0,
          totalSpent: totalSpentFromTickets || Number(profile.tongTienDaChiTra || 0),
          joinedDate: profile.ngayTaoTaiKhoan || new Date().toISOString(),
          avatar: '👤'
        })

        const mappedTransactions = tickets.slice(0, 4).map(ticket => ({
          id: ticket.id,
          route: `${ticket.from} → ${ticket.to}`,
          date: ticket.date,
          amount: ticket.price,
          points: Math.round(ticket.price / 10000),
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

  const handleCancel = () => {
    setEditMode(false)
    setError(null)
    setShowOtpModal(false)
    setOtpCode('')
  }

  const initiateSave = async () => {
    // Validation
    if (!editData.name.trim()) return setError('Họ tên không được để trống')
    if (!editData.email.trim()) return setError('Email không được để trống')
    if (!editData.phone.trim()) return setError('Số điện thoại không được để trống')

    setError(null)
    
    // Kiểm tra xem có đổi email hoặc số điện thoại không
    const isSensitiveChanged = editData.email !== userInfo.email || editData.phone !== userInfo.phone

    if (isSensitiveChanged) {
      // Yêu cầu OTP
      setOtpSending(true)
      try {
        const res = await fetch('http://localhost:5000/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userInfo.email }) // Gửi OTP về email CŨ
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message)
        
        setShowOtpModal(true)
      } catch (err) {
        setError(err.message || 'Lỗi khi gửi mã xác thực')
      } finally {
        setOtpSending(false)
      }
    } else {
      // Chỉ đổi tên, lưu luôn
      executeSave()
    }
  }

  const executeSave = async (otp = null) => {
    const token = StorageUtil.getToken()
    if (!token) return

    try {
      setError(null)
      setSuccessMsg(null)
      
      const payload = {
        name: editData.name,
        email: editData.email,
        phone: editData.phone
      }
      
      if (otp) {
        payload.otp = otp
      }

      // Xây dựng hàm update có custom fetch vì authService có thể chưa hỗ trợ truyền otp
      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Lỗi khi cập nhật hồ sơ')
      }

      // Cập nhật state
      setUserInfo(prev => ({
        ...prev,
        name: editData.name,
        email: editData.email,
        phone: editData.phone
      }))

      // Cập nhật LocalStorage
      const currentUser = StorageUtil.getUser() || {}
      StorageUtil.setUser({ ...currentUser, name: editData.name, email: editData.email, phone: editData.phone })

      setSuccessMsg('Cập nhật thông tin thành công!')
      setEditMode(false)
      setShowOtpModal(false)
      setOtpCode('')

      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      console.error('Lỗi khi lưu thông tin:', err)
      setError(err.message || 'Lỗi khi cập nhật hồ sơ')
    }
  }

  const handleLogout = () => {
    if (window.confirm('Bạn chắc chắn muốn đăng xuất?')) {
      StorageUtil.clearAuth()
      navigate('/')
    }
  }

  const formatCurrency = (amount) => amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Đang tải thông tin tài khoản...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Header Gradient Banner */}
      <div className={`h-48 bg-gradient-to-r ${currentMembership.gradient} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]"></div>
        {/* Decorative Circles */}
        <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-white/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-50px] left-[-50px] w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
        
        {/* Alerts */}
        {successMsg && (
          <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 flex items-center gap-3 shadow-sm animate-fade-in">
            <FiCheck className="text-xl" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}
        {error && !editMode && (
          <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center gap-3 shadow-sm">
            <FiAlertTriangle className="text-xl" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar: Profile Card & Navigation */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Main Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
              <div className="w-28 h-28 bg-slate-100 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-5xl mb-4">
                {userInfo.avatar}
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">{userInfo.name}</h1>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${currentMembership.bgColor} ${currentMembership.color} mb-6`}>
                <span>{currentMembership.icon}</span>
                {currentMembership.name} Member
              </div>

              <div className="w-full space-y-3 mb-6 text-left">
                <div className="flex items-center gap-3 text-slate-600">
                  <FiMail className="text-slate-400" />
                  <span className="text-sm font-medium truncate">{userInfo.email}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <FiPhone className="text-slate-400" />
                  <span className="text-sm font-medium">{userInfo.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <FiCalendar className="text-slate-400" />
                  <span className="text-sm font-medium">Tham gia: {formatDate(userInfo.joinedDate)}</span>
                </div>
              </div>

              <button 
                onClick={handleLogout}
                className="w-full py-2.5 flex items-center justify-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-bold transition-colors"
              >
                <FiLogOut />
                Đăng xuất
              </button>
            </div>

          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Membership Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <FiAward className="text-blue-500" />
                Thông tin hạng thành viên
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                  <div className="text-sm font-semibold text-slate-500 mb-1">Điểm Tích Lũy</div>
                  <div className={`text-3xl font-black ${currentMembership.color}`}>
                    {userInfo.diemTichLuy.toLocaleString()}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                  <div className="text-sm font-semibold text-slate-500 mb-1">Tổng Chi Tiêu</div>
                  <div className="text-3xl font-black text-slate-900">
                    {formatCurrency(userInfo.totalSpent)}
                  </div>
                </div>
              </div>

              {userInfo.membershipLevel !== 'gold' && (
                <div className="mb-8">
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-slate-600">Tiến tới hạng {nextMembership.name}</span>
                    <span className="text-blue-600">Cần {pointsToNextLevel > 0 ? pointsToNextLevel.toLocaleString() : 0} điểm</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${currentMembership.gradient} rounded-full`}
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-slate-400 mt-2">
                    <span>{currentMembership.name}</span>
                    <span>{nextMembership.name}</span>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Quyền lợi của bạn</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentMembership.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <FiCheck className="text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm font-medium text-slate-600">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Edit Profile Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 relative">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FiUser className="text-blue-500" />
                  Cập nhật hồ sơ
                </h2>
                {!editMode && (
                  <button onClick={handleEditClick} className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg">
                    <FiEdit2 /> Chỉnh sửa
                  </button>
                )}
              </div>

              {error && editMode && (
                <div className="mb-6 bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 text-sm font-semibold">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Họ và Tên</label>
                  {editMode ? (
                    <input 
                      type="text" 
                      value={editData.name} 
                      onChange={e => setEditData({...editData, name: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-0 text-slate-900 font-medium transition-colors"
                    />
                  ) : (
                    <div className="px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 font-medium text-slate-900">{userInfo.name}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                  {editMode ? (
                    <input 
                      type="email" 
                      value={editData.email} 
                      onChange={e => setEditData({...editData, email: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-0 text-slate-900 font-medium transition-colors"
                    />
                  ) : (
                    <div className="px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 font-medium text-slate-900">{userInfo.email}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Số điện thoại</label>
                  {editMode ? (
                    <input 
                      type="tel" 
                      value={editData.phone} 
                      onChange={e => setEditData({...editData, phone: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-0 text-slate-900 font-medium transition-colors"
                    />
                  ) : (
                    <div className="px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 font-medium text-slate-900">{userInfo.phone}</div>
                  )}
                </div>
              </div>

              {editMode && (
                <div className="mt-8 flex items-center gap-3">
                  <button 
                    onClick={initiateSave}
                    disabled={otpSending}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {otpSending ? 'Đang kiểm tra...' : 'Lưu thay đổi'}
                  </button>
                  <button 
                    onClick={handleCancel}
                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                  >
                    Hủy bỏ
                  </button>
                </div>
              )}

              {editMode && (editData.email !== userInfo.email || editData.phone !== userInfo.phone) && (
                <div className="mt-4 flex items-start gap-2 text-xs font-semibold text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                  <FiShield className="shrink-0 text-lg" />
                  <p>Lưu ý: Thay đổi Email hoặc Số điện thoại yêu cầu xác thực bằng mã OTP gửi về Email hiện tại của bạn.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-fade-in relative">
            <button onClick={() => setShowOtpModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <FiX size={24} />
            </button>
            <div className="p-8">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mx-auto mb-4">
                <FiShield size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Xác thực thay đổi</h3>
              <p className="text-sm font-medium text-slate-500 text-center mb-6">
                Một mã xác thực gồm 6 chữ số vừa được gửi đến email <strong>{userInfo.email}</strong>. Vui lòng nhập mã để hoàn tất.
              </p>
              
              <input 
                type="text" 
                placeholder="Nhập mã OTP (6 số)"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value)}
                maxLength={6}
                className="w-full text-center tracking-[0.5em] text-2xl px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-0 text-slate-900 font-bold transition-colors mb-6"
              />

              <button 
                onClick={() => executeSave(otpCode)}
                disabled={otpCode.length !== 6}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Xác nhận & Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
