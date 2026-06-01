import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FiMail, FiPhone, FiLock, FiUser, FiCheck, FiEye, FiEyeOff } from 'react-icons/fi'
import { Bus } from 'lucide-react'
import { Button } from '@nextui-org/react'
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

  const steps = [
    { num: 1, label: 'Thông tin' },
    { num: 2, label: 'Mật khẩu' },
    { num: 3, label: 'Xác minh' }
  ]

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
        
        <div className="w-full max-w-[460px] bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 relative z-10 p-8 sm:p-10 my-4 sm:my-8 overflow-y-auto max-h-screen no-scrollbar">
          
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30 cursor-pointer transition-transform hover:scale-105" onClick={() => navigate('/')}>
              <Bus size={32} className="text-white" />
            </div>
          </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Tạo tài khoản mới</h2>
          <p className="text-slate-500 text-sm mt-2 font-medium">Tham gia cùng hàng ngàn hành khách khác</p>
        </div>

        {/* Progress Tracker */}
        <div className="flex justify-between items-center mb-10 relative px-4">
          <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-slate-100 rounded-full z-0"></div>
          <div 
            className="absolute left-8 top-1/2 -translate-y-1/2 h-1 bg-blue-600 rounded-full z-0 transition-all duration-500"
            style={{ width: `calc(${((formStep - 1) / 2) * 100}% - 32px)` }}
          ></div>
          
          {steps.map(step => (
            <div key={step.num} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                ${formStep > step.num ? 'bg-blue-600 text-white' : 
                  formStep === step.num ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-4 ring-blue-50' : 'bg-white text-slate-300 border-2 border-slate-200'}`}
              >
                {formStep > step.num ? <FiCheck strokeWidth={3} /> : step.num}
              </div>
              <span className={`text-[11px] uppercase tracking-wider font-bold ${formStep >= step.num ? 'text-blue-900' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {/* STEP 1: INFO */}
          {formStep === 1 && (
            <div className="space-y-4 animate-appearance-in">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">Họ và tên</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiUser className={errors.fullName ? "text-red-400" : "text-slate-400"} size={18} />
                  </div>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border ${errors.fullName ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'} rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-4 transition-all font-semibold`} placeholder="Nguyễn Văn A" />
                </div>
                {errors.fullName && <p className="text-red-500 text-xs font-semibold ml-1 mt-1">{errors.fullName}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiMail className={errors.email ? "text-red-400" : "text-slate-400"} size={18} />
                  </div>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'} rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-4 transition-all font-semibold`} placeholder="email@example.com" />
                </div>
                {errors.email && <p className="text-red-500 text-xs font-semibold ml-1 mt-1">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">Số điện thoại</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiPhone className={errors.phone ? "text-red-400" : "text-slate-400"} size={18} />
                  </div>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border ${errors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'} rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-4 transition-all font-semibold`} placeholder="0987654321" />
                </div>
                {errors.phone && <p className="text-red-500 text-xs font-semibold ml-1 mt-1">{errors.phone}</p>}
              </div>
            </div>
          )}

          {/* STEP 2: PASSWORD */}
          {formStep === 2 && (
            <div className="space-y-4 animate-appearance-in">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">Mật khẩu</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiLock className={errors.password ? "text-red-400" : "text-slate-400"} size={18} />
                  </div>
                  <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleInputChange} className={`w-full pl-11 pr-12 py-3.5 bg-slate-50 border ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'} rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-4 transition-all font-semibold`} placeholder="Tạo mật khẩu mạnh" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none bg-transparent border-none">
                    {showPassword ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs font-semibold ml-1 mt-1">{errors.password}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">Xác nhận mật khẩu</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiLock className={errors.confirmPassword ? "text-red-400" : "text-slate-400"} size={18} />
                  </div>
                  <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} className={`w-full pl-11 pr-12 py-3.5 bg-slate-50 border ${errors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'} rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-4 transition-all font-semibold`} placeholder="Nhập lại mật khẩu" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none bg-transparent border-none">
                    {showConfirmPassword ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs font-semibold ml-1 mt-1">{errors.confirmPassword}</p>}
              </div>
              
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl mt-4">
                <p className="text-[13px] font-bold text-blue-900 mb-2">Yêu cầu mật khẩu:</p>
                <ul className="text-xs font-semibold text-slate-500 space-y-1.5 grid grid-cols-2">
                  <li className={formData.password.length >= 8 ? 'text-green-600 flex items-center gap-1' : 'flex items-center gap-1'}><FiCheck size={14}/> 8+ ký tự</li>
                  <li className={/[A-Z]/.test(formData.password) ? 'text-green-600 flex items-center gap-1' : 'flex items-center gap-1'}><FiCheck size={14}/> Chữ in hoa</li>
                  <li className={/[a-z]/.test(formData.password) ? 'text-green-600 flex items-center gap-1' : 'flex items-center gap-1'}><FiCheck size={14}/> Chữ thường</li>
                  <li className={/[0-9]/.test(formData.password) ? 'text-green-600 flex items-center gap-1' : 'flex items-center gap-1'}><FiCheck size={14}/> Chữ số</li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP 3: VERIFICATION */}
          {formStep === 3 && (
            <div className="animate-appearance-in">
              <div className="p-6 border border-slate-100 bg-slate-50 rounded-2xl text-center shadow-inner">
                <div className="w-16 h-16 bg-white shadow-sm text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <FiMail size={24} />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-1">Xác minh Email</h3>
                <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">
                  Mã xác minh sẽ được gửi đến email<br/>
                  <span className="text-blue-600 font-bold">{formData.email}</span>
                </p>

                {!formData.emailVerified ? (
                  !sentCodes.email ? (
                    <Button size="lg" className="w-full font-bold bg-white text-blue-600 border-2 border-blue-100 hover:border-blue-200 rounded-xl" onClick={() => sendVerificationCode('email')} isLoading={isLoading}>
                      Gửi mã xác minh
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="0 0 0 0 0 0"
                        value={verificationCodes.email}
                        onChange={(e) => setVerificationCodes(prev => ({ ...prev, email: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                        className="w-full py-4 bg-white border border-slate-200 rounded-xl text-center text-2xl tracking-[0.5em] font-black text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                      />
                      <Button color="primary" size="lg" className="w-full font-bold bg-blue-600 shadow-lg shadow-blue-600/20 rounded-xl" onClick={() => verifyCode('email')} isDisabled={verificationCodes.email.length !== 6} isLoading={isLoading}>
                        Xác nhận mã
                      </Button>
                    </div>
                  )
                ) : (
                  <div className="inline-flex items-center justify-center w-full gap-2 text-green-700 font-bold bg-green-100 border border-green-200 px-4 py-3 rounded-xl">
                    <FiCheck size={20} /> Đã xác minh thành công
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-8">
          {formStep > 1 && (
            <Button variant="bordered" size="lg" className="w-1/3 font-bold text-slate-600 border-slate-200 hover:bg-slate-50 rounded-xl" onClick={() => setFormStep(formStep - 1)} isDisabled={isLoading}>
              Quay lại
            </Button>
          )}
          
          {formStep < 3 && (
            <Button color="primary" size="lg" className={`${formStep > 1 ? 'w-2/3' : 'w-full'} font-bold bg-blue-600 hover:bg-blue-700 shadow-[0_8px_20px_-6px_rgba(37,99,235,0.4)] rounded-xl transition-all`} onClick={handleNextStep} isDisabled={isLoading}>
              Tiếp tục
            </Button>
          )}
          
          {formStep === 3 && (
            <Button color="primary" size="lg" className="w-full font-bold bg-blue-600 hover:bg-blue-700 shadow-[0_8px_20px_-6px_rgba(37,99,235,0.4)] rounded-xl transition-all" onClick={handleRegister} isDisabled={isLoading || !formData.emailVerified} isLoading={isLoading}>
              Hoàn tất Đăng ký
            </Button>
          )}
        </div>

        <p className="text-center text-slate-500 mt-8 text-sm font-semibold">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
            Đăng nhập ngay
          </Link>
        </p>
      </div>
      </div>
    </div>
  )
}
