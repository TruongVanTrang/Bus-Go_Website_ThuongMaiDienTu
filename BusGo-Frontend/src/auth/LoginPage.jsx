import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import { Bus } from 'lucide-react'
import { Button } from '@nextui-org/react'
import { StorageUtil, ValidateUtil } from '@/utils/helpers'
import { USER_ROLES, ERROR_MESSAGES } from '@/utils/constants'
import { loginAPI } from '@/services/authService'

function LoginPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ emailOrPhone: '', password: '' })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [generalError, setGeneralError] = useState('')

  const validateForm = () => {
    const newErrors = {}
    if (!formData.emailOrPhone.trim()) {
      newErrors.emailOrPhone = 'Vui lòng nhập Email hoặc Số điện thoại'
    }
    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập Mật khẩu'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setGeneralError('')
    if (!validateForm()) return
    setIsLoading(true)

    try {
      const data = await loginAPI(formData.emailOrPhone, formData.password)
      StorageUtil.setToken(data.token)
      StorageUtil.setUser({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
        role: data.user.role
      })
      StorageUtil.setRole(data.user.role)
      localStorage.setItem('userInfo', JSON.stringify({
        fullName: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
        emailVerified: true,
        phoneVerified: true,
        membershipLevel: 'bronze',
        points: 0,
        registeredAt: new Date().toISOString()
      }))
      if (data.user.role === USER_ROLES.CUSTOMER) {
        navigate('/home')
      } else if (data.user.role === USER_ROLES.DRIVER) {
        navigate('/driver/dashboard')
      } else {
        navigate('/admin/dashboard')
      }
    } catch (error) {
      console.error('Login error:', error)
      setGeneralError(error.message || ERROR_MESSAGES.INVALID_CREDENTIALS)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50 relative overflow-hidden">
      {/* Left Banner */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden shadow-[20px_0_60px_-15px_rgba(0,0,0,0.3)] z-20">
        <div className="absolute inset-0 z-0">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover">
            <source src="/banner.mp4" type="video/mp4" />
          </video>
        </div>
        

      </div>

      {/* Right Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10 bg-slate-50/50">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-sky-400/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="w-full max-w-[420px] bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 relative z-10 p-8 sm:p-10">
          
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30 cursor-pointer transition-transform hover:scale-105" onClick={() => navigate('/')}>
              <Bus size={32} className="text-white" />
            </div>
          </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Đăng nhập BusGo</h2>
          <p className="text-slate-500 text-sm mt-2 font-medium">Chào mừng bạn quay trở lại</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {generalError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold text-center">
              {generalError}
            </div>
          )}

          {/* Email / Phone */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 ml-1">Tài khoản</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiMail className={errors.emailOrPhone ? "text-red-400" : "text-slate-400"} size={18} />
              </div>
              <input 
                type="text"
                name="emailOrPhone"
                value={formData.emailOrPhone}
                onChange={handleChange}
                disabled={isLoading}
                className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border ${errors.emailOrPhone ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'} rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-4 transition-all font-semibold`}
                placeholder="Email hoặc Số điện thoại"
              />
            </div>
            {errors.emailOrPhone && <p className="text-red-500 text-xs font-semibold ml-1 mt-1">{errors.emailOrPhone}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 ml-1">Mật khẩu</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiLock className={errors.password ? "text-red-400" : "text-slate-400"} size={18} />
              </div>
              <input 
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                className={`w-full pl-11 pr-12 py-3.5 bg-slate-50 border ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'} rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-4 transition-all font-semibold`}
                placeholder="Nhập mật khẩu của bạn"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none bg-transparent border-none"
              >
                {showPassword ? <FiEye size={18} /> : <FiEyeOff size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs font-semibold ml-1 mt-1">{errors.password}</p>}
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
              <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-800 transition-colors">Ghi nhớ đăng nhập</span>
            </label>
            <Link to="#" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
              Quên mật khẩu?
            </Link>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full font-bold text-base mt-4 bg-blue-600 hover:bg-blue-700 text-white shadow-[0_8px_20px_-6px_rgba(37,99,235,0.4)] rounded-xl transition-all"
            isLoading={isLoading}
          >
            Đăng nhập
          </Button>
        </form>

        <p className="text-center text-slate-500 mt-8 text-sm font-semibold">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
            Tạo tài khoản mới
          </Link>
        </p>
      </div>
      </div>
    </div>
  )
}

export default LoginPage
