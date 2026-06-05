import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import { StorageUtil, ValidateUtil } from '@/utils/helpers'
import { USER_ROLES, ERROR_MESSAGES } from '@/utils/constants'
import { loginAPI } from '@/services/authService'
import { toast } from '../utils/toastService'

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

      // ✅ Đăng nhập thành công - XÓA dữ liệu cũ trước khi ghi mới (tránh lỗi stale cache)
      StorageUtil.clearAuth()
      StorageUtil.setToken(data.token)
      StorageUtil.setUser({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
        role: data.user.role
      })
      // Lưu role chuẩn hóa (toUpperCase, '-' -> '_') để tránh lỗi nhận diện vai trò
      StorageUtil.setRole(data.user.role.toUpperCase().replace(/-/g, '_'))

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

      toast.success('✓ Đăng nhập thành công!', 3000)

      setTimeout(() => {
        // Điều hướng theo role
        if (data.user.role === USER_ROLES.CUSTOMER) {
          navigate('/home')
        } else if (data.user.role === USER_ROLES.DRIVER || data.user.role === USER_ROLES.TRUCK_DRIVER) {
          navigate('/driver/dashboard')
        } else if (data.user.role === USER_ROLES.SUPPORT_STAFF) {
          navigate('/admin/support/chat')
        } else {
          navigate('/admin/dashboard')
        }
      }, 1000)
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
    <div className="flex min-h-screen font-sans bg-slate-50 lg:p-6">
      {/* Cột trái: Hình ảnh xe bus */}
      <div 
        className="hidden lg:block lg:flex-1 bg-cover bg-center rounded-3xl shadow-md overflow-hidden" 
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop')" }}
      ></div>

      {/* Cột phải: Form đăng nhập */}
      <div className="flex-1 flex flex-col justify-center items-center p-5 lg:p-0">
        <div className="bg-white rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.04)] w-full max-w-[440px] p-10 sm:p-12">
          <div className="text-center mb-8">
            <h1 className="text-[28px] font-extrabold text-slate-900 mb-2 tracking-tight">Đăng nhập BusGo</h1>
            <p className="text-slate-500 text-[15px] m-0">Chào mừng bạn quay trở lại</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            {generalError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex justify-between items-center" role="alert">
                <span className="text-sm font-medium">⚠️ {generalError}</span>
                <button
                  type="button"
                  className="text-red-700 opacity-50 hover:opacity-100 text-xl font-semibold focus:outline-none"
                  onClick={() => setGeneralError('')}
                >
                  &times;
                </button>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="font-bold text-slate-900 text-sm">Tài khoản</label>
              <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/10 transition-all duration-300">
                <span className="pl-4 pr-3 text-slate-400 flex items-center justify-center">
                  <FiMail className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  className="flex-1 py-3 pr-4 text-[15px] text-slate-900 bg-transparent placeholder-slate-400 outline-none"
                  name="emailOrPhone"
                  placeholder="Email hoặc Số điện thoại"
                  value={formData.emailOrPhone}
                  onChange={handleChange}
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              {errors.emailOrPhone && (
                <small className="text-red-500 text-[13px] mt-1">
                  {errors.emailOrPhone}
                </small>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-bold text-slate-900 text-sm">Mật khẩu</label>
              <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/10 transition-all duration-300">
                <span className="pl-4 pr-3 text-slate-400 flex items-center justify-center">
                  <FiLock className="w-5 h-5" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="flex-1 py-3 text-[15px] text-slate-900 bg-transparent placeholder-slate-400 outline-none"
                  name="password"
                  placeholder="Nhập mật khẩu của bạn"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="px-4 text-slate-400 hover:text-slate-900 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <FiEye className="w-5 h-5" /> : <FiEyeOff className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <small className="text-red-500 text-[13px] mt-1">
                  {errors.password}
                </small>
              )}
            </div>

            <div className="flex justify-between items-center mt-[-4px]">
              <div className="flex items-center gap-2">
                <input
                  className="w-[18px] h-[18px] border-2 border-slate-200 rounded text-primary-600 focus:ring-primary-500 cursor-pointer accent-primary-600"
                  type="checkbox"
                  id="rememberMe"
                  disabled={isLoading}
                />
                <label className="text-[14px] text-slate-900 font-medium cursor-pointer" htmlFor="rememberMe">
                  Ghi nhớ đăng nhập
                </label>
              </div>
              <a href="#" className="text-[14px] text-primary-600 font-semibold hover:text-primary-800 transition-colors">
                Quên mật khẩu?
              </a>
            </div>

            <button
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-[14px] rounded-xl transition-all duration-300 flex justify-center items-center hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(2,132,199,0.2)] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-[14px] text-slate-500">
              Chưa có tài khoản?{' '}
              <a
                href="/register"
                className="text-primary-600 font-semibold hover:underline cursor-pointer"
                onClick={(e) => {
                  e.preventDefault()
                  navigate('/register')
                }}
              >
                Tạo tài khoản mới
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

