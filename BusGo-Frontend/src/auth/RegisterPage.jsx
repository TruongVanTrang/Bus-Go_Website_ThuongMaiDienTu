import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiMail, FiPhone, FiLock, FiUser, FiCheck, FiEye, FiEyeOff } from 'react-icons/fi'
import { toast } from '../utils/toastService'
import { StorageUtil } from '../utils/helpers'
import { registerAPI, sendOTPAPI, verifyOTPAPI } from '@/services/authService'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [formStep, setFormStep] = useState(1) // 1: Info, 2: Password, 3: Verify
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '', emailVerified: false, phoneVerified: true
  })
  const [verificationCodes, setVerificationCodes] = useState({ email: '' })
  const [sentCodes, setSentCodes] = useState({ email: false })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validateStep1 = () => {
    const newErrors = {}
    if (!formData.fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ tên'
    if (!formData.email.trim()) newErrors.email = 'Vui lòng nhập email'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email không hợp lệ'
    if (!formData.phone.trim()) newErrors.phone = 'Vui lòng nhập số điện thoại'
    else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\D/g, ''))) newErrors.phone = 'Số điện thoại không hợp lệ'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors = {}
    if (!formData.password) newErrors.password = 'Vui lòng nhập mật khẩu'
    else if (formData.password.length < 8) newErrors.password = 'Ít nhất 8 ký tự'
    else if (!/[A-Z]/.test(formData.password)) newErrors.password = 'Chứa chữ in hoa'
    else if (!/[0-9]/.test(formData.password)) newErrors.password = 'Chứa số'
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const sendVerificationCode = async (type) => {
    if (type !== 'email') return
    setIsLoading(true)
    try {
      await sendOTPAPI(formData.email)
      setSentCodes(prev => ({ ...prev, [type]: true }))
      toast.info(`✓ Mã xác minh đã gửi đến ${formData.email}`)
    } catch (error) {
      toast.error(error.message || 'Lỗi gửi mã xác minh. Vui lòng thử lại')
    } finally {
      setIsLoading(false)
    }
  }

  const verifyCode = async (type) => {
    if (type !== 'email') return
    setIsLoading(true)
    try {
      await verifyOTPAPI(formData.email, verificationCodes.email)
      setFormData(prev => ({ ...prev, [`${type}Verified`]: true }))
      toast.success('✓ Email đã được xác minh')
      setVerificationCodes(prev => ({ ...prev, [type]: '' }))
    } catch (error) {
      toast.error(error.message || 'Mã không chính xác hoặc đã hết hạn')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNextStep = () => {
    if (formStep === 1 && validateStep1()) setFormStep(2)
    else if (formStep === 2 && validateStep2()) setFormStep(3)
  }

  const handleRegister = async () => {
    if (!formData.emailVerified) {
      toast.warning('Vui lòng xác minh email')
      return
    }
    setIsLoading(true)
    try {
      const data = await registerAPI({
        fullName: formData.fullName, email: formData.email, phone: formData.phone, password: formData.password
      })
      StorageUtil.setToken(data.token)
      StorageUtil.setUser({
        id: data.user.id, name: data.user.name, email: data.user.email, phone: data.user.phone, role: data.user.role
      })
      StorageUtil.setRole(data.user.role)
      localStorage.setItem('userInfo', JSON.stringify({
        fullName: data.user.name, email: data.user.email, phone: data.user.phone, emailVerified: true, phoneVerified: true, membershipLevel: 'bronze', points: 0, registeredAt: new Date().toISOString()
      }))
      toast.success('✓ Đăng ký thành công!')
      setTimeout(() => navigate('/home'), 1500)
    } catch (error) {
      console.error('Register error:', error)
      toast.error(error.message || 'Lỗi đăng ký. Vui lòng thử lại')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen font-sans bg-slate-50 lg:p-6">
      {/* Cột trái: Hình ảnh xe bus */}
      <div 
        className="hidden lg:block lg:flex-1 bg-cover bg-center rounded-3xl shadow-md overflow-hidden" 
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop')" }}
      ></div>

      {/* Cột phải: Form đăng ký */}
      <div className="flex-1 flex flex-col justify-center items-center p-5 lg:p-0">
        <div className="bg-white rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.04)] w-full max-w-[480px] p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-[28px] font-extrabold text-slate-900 mb-2 tracking-tight">Đăng ký BusGo</h1>
            <p className="text-slate-500 text-[15px] m-0">Đăng ký tài khoản để bắt đầu booking</p>
          </div>

          {/* Progress Indicator */}
          <div className="relative flex items-center justify-between mb-8 px-2">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 rounded-full z-0"></div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary-600 rounded-full z-0 transition-all duration-300" style={{ width: formStep === 1 ? '0%' : formStep === 2 ? '50%' : '100%' }}></div>
            
            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${formStep >= 1 ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-500 shadow-sm border border-slate-300'}`}>
                {formStep > 1 ? <FiCheck className="w-4 h-4" /> : 1}
              </div>
              <span className={`text-[12px] font-semibold ${formStep >= 1 ? 'text-primary-600' : 'text-slate-500'}`}>Thông tin</span>
            </div>
            
            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${formStep >= 2 ? 'bg-primary-600 text-white' : 'bg-white text-slate-500 shadow-sm border border-slate-300'}`}>
                {formStep > 2 ? <FiCheck className="w-4 h-4" /> : 2}
              </div>
              <span className={`text-[12px] font-semibold ${formStep >= 2 ? 'text-primary-600' : 'text-slate-500'}`}>Mật khẩu</span>
            </div>
            
            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${formStep >= 3 ? 'bg-primary-600 text-white' : 'bg-white text-slate-500 shadow-sm border border-slate-300'}`}>
                {formStep > 3 ? <FiCheck className="w-4 h-4" /> : 3}
              </div>
              <span className={`text-[12px] font-semibold ${formStep >= 3 ? 'text-primary-600' : 'text-slate-500'}`}>Xác minh</span>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {/* Step 1: Personal Info */}
            {formStep === 1 && (
              <div className="flex flex-col gap-4 animate-[fadeIn_0.3s_ease-out]">
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-slate-900 text-sm">Họ tên *</label>
                  <div className={`flex items-center border rounded-xl bg-white overflow-hidden focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/10 transition-all duration-300 ${errors.fullName ? 'border-red-500' : 'border-slate-200'}`}>
                    <span className="pl-4 pr-3 text-slate-400">
                      <FiUser className="w-5 h-5" />
                    </span>
                    <input
                      type="text"
                      name="fullName"
                      placeholder="Nhập họ tên đầy đủ"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="flex-1 py-3 pr-4 text-[15px] text-slate-900 bg-transparent placeholder-slate-400 outline-none"
                    />
                  </div>
                  {errors.fullName && <small className="text-red-500 text-[13px]">{errors.fullName}</small>}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-bold text-slate-900 text-sm">Email *</label>
                  <div className={`flex items-center border rounded-xl bg-white overflow-hidden focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/10 transition-all duration-300 ${errors.email ? 'border-red-500' : 'border-slate-200'}`}>
                    <span className="pl-4 pr-3 text-slate-400">
                      <FiMail className="w-5 h-5" />
                    </span>
                    <input
                      type="email"
                      name="email"
                      placeholder="Nhập địa chỉ email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="flex-1 py-3 pr-4 text-[15px] text-slate-900 bg-transparent placeholder-slate-400 outline-none"
                    />
                  </div>
                  {errors.email && <small className="text-red-500 text-[13px]">{errors.email}</small>}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-bold text-slate-900 text-sm">Số điện thoại *</label>
                  <div className={`flex items-center border rounded-xl bg-white overflow-hidden focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/10 transition-all duration-300 ${errors.phone ? 'border-red-500' : 'border-slate-200'}`}>
                    <span className="pl-4 pr-3 text-slate-400">
                      <FiPhone className="w-5 h-5" />
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Nhập số điện thoại (10-11 chữ số)"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="flex-1 py-3 pr-4 text-[15px] text-slate-900 bg-transparent placeholder-slate-400 outline-none"
                    />
                  </div>
                  {errors.phone && <small className="text-red-500 text-[13px]">{errors.phone}</small>}
                  <p className="text-[12px] text-slate-500 flex items-center gap-1 mt-1">
                    <span className="text-yellow-500">💡</span> Số điện thoại sẽ được tài xế sử dụng để liên lạc với bạn
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Password */}
            {formStep === 2 && (
              <div className="flex flex-col gap-4 animate-[fadeIn_0.3s_ease-out]">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-2">
                  <p className="font-bold text-slate-700 text-[13px] mb-2">Mật khẩu phải chứa:</p>
                  <ul className="text-[13px] text-slate-600 grid grid-cols-2 gap-2">
                    <li className="flex items-center gap-1"><FiCheck className="text-green-500" /> Ít nhất 8 ký tự</li>
                    <li className="flex items-center gap-1"><FiCheck className="text-green-500" /> Chữ in hoa (A-Z)</li>
                    <li className="flex items-center gap-1"><FiCheck className="text-green-500" /> Chữ thường (a-z)</li>
                    <li className="flex items-center gap-1"><FiCheck className="text-green-500" /> Số (0-9)</li>
                  </ul>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-bold text-slate-900 text-sm">Mật khẩu *</label>
                  <div className={`flex items-center border rounded-xl bg-white overflow-hidden focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/10 transition-all duration-300 ${errors.password ? 'border-red-500' : 'border-slate-200'}`}>
                    <span className="pl-4 pr-3 text-slate-400">
                      <FiLock className="w-5 h-5" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Tạo mật khẩu mạnh"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="flex-1 py-3 text-[15px] text-slate-900 bg-transparent placeholder-slate-400 outline-none"
                    />
                    <button
                      type="button"
                      className="px-4 text-slate-400 hover:text-slate-900 focus:outline-none"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FiEye className="w-5 h-5" /> : <FiEyeOff className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <small className="text-red-500 text-[13px]">{errors.password}</small>}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-bold text-slate-900 text-sm">Xác nhận mật khẩu *</label>
                  <div className={`flex items-center border rounded-xl bg-white overflow-hidden focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/10 transition-all duration-300 ${errors.confirmPassword ? 'border-red-500' : 'border-slate-200'}`}>
                    <span className="pl-4 pr-3 text-slate-400">
                      <FiLock className="w-5 h-5" />
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder="Xác nhận mật khẩu"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="flex-1 py-3 text-[15px] text-slate-900 bg-transparent placeholder-slate-400 outline-none"
                    />
                    <button
                      type="button"
                      className="px-4 text-slate-400 hover:text-slate-900 focus:outline-none"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FiEye className="w-5 h-5" /> : <FiEyeOff className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <small className="text-red-500 text-[13px]">{errors.confirmPassword}</small>}
                </div>
              </div>
            )}

            {/* Step 3: Verification */}
            {formStep === 3 && (
              <div className="flex flex-col gap-4 animate-[fadeIn_0.3s_ease-out]">
                <p className="text-[14px] text-slate-600 mb-2">Hãy xác minh email của bạn để hoàn tất đăng ký</p>

                <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center">
                        <FiMail className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">Xác minh Email</h3>
                        <p className="text-[13px] text-slate-500 font-medium">{formData.email}</p>
                      </div>
                    </div>
                    {formData.emailVerified && <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><FiCheck className="w-4 h-4" /></div>}
                  </div>
                  
                  {!formData.emailVerified ? (
                    <>
                      {!sentCodes.email ? (
                        <button
                          type="button"
                          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-70 text-sm"
                          onClick={() => sendVerificationCode('email')}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Đang gửi...' : 'Gửi mã xác minh'}
                        </button>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            placeholder="Nhập mã 6 số"
                            value={verificationCodes.email}
                            onChange={(e) => setVerificationCodes(prev => ({
                              ...prev,
                              email: e.target.value.replace(/\D/g, '').slice(0, 6)
                            }))}
                            className="flex-1 min-w-0 border border-slate-200 rounded-lg px-4 py-3 text-center tracking-[0.2em] font-mono text-lg outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                          />
                          <button
                            type="button"
                            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors disabled:opacity-50 whitespace-nowrap shrink-0 self-center"
                            onClick={() => verifyCode('email')}
                            disabled={verificationCodes.email.length !== 6 || isLoading}
                          >
                            Xác minh
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full bg-green-50 text-green-700 border border-green-200 rounded-lg py-2.5 flex items-center justify-center gap-2 font-semibold text-sm">
                      <FiCheck className="w-5 h-5" />
                      Email đã được xác minh
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8">
            {formStep > 1 && (
              <button
                type="button"
                className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-70"
                onClick={() => setFormStep(formStep - 1)}
                disabled={isLoading}
              >
                Quay lại
              </button>
            )}
            
            {formStep < 3 && (
              <button
                type="button"
                className="flex-[2] bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-sm disabled:opacity-70"
                onClick={handleNextStep}
                disabled={isLoading}
              >
                Tiếp tục
              </button>
            )}
            
            {formStep === 3 && (
              <button
                type="button"
                className="flex-[2] bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-sm disabled:opacity-70"
                onClick={handleRegister}
                disabled={isLoading || !formData.emailVerified}
              >
                {isLoading ? 'Đang xử lý...' : 'Hoàn tất Đăng ký'}
              </button>
            )}
          </div>

          <div className="text-center mt-6">
            <p className="text-[14px] text-slate-500">
              Đã có tài khoản?{' '}
              <a
                href="/login"
                className="text-primary-600 font-semibold hover:underline cursor-pointer"
                onClick={(e) => {
                  e.preventDefault()
                  navigate('/login')
                }}
              >
                Đăng nhập ngay
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
