import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiMail, FiPhone, FiLock, FiUser, FiCheck, FiClock } from 'react-icons/fi'
import { toast } from '../utils/toastService'
import { StorageUtil } from '../utils/helpers'
import './RegisterPage.css'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [formStep, setFormStep] = useState(1) // 1: Info, 2: Password, 3: Verify
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    emailVerified: false,
    phoneVerified: false
  })
  const [verificationCodes, setVerificationCodes] = useState({
    email: '',
    phone: ''
  })
  const [sentCodes, setSentCodes] = useState({
    email: false,
    phone: false
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateStep1 = () => {
    const newErrors = {}
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ tên'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại'
    } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ (10-11 chữ số)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors = {}
    
    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự'
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Mật khẩu phải chứa chữ in hoa'
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Mật khẩu phải chứa số'
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const sendVerificationCode = async (type) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Generate mock code
      const mockCode = Math.floor(100000 + Math.random() * 900000).toString()
      
      // Save for verification (in real app, this would be sent via email/SMS)
      sessionStorage.setItem(`${type}Code`, mockCode)
      
      setSentCodes(prev => ({
        ...prev,
        [type]: true
      }))
      
      toast.info(`✓ Mã xác minh đã gửi đến ${type === 'email' ? formData.email : formData.phone}`, 4000)
      
      // Show mock code for demo purposes
      console.log(`[DEMO] ${type.toUpperCase()} verification code: ${mockCode}`)
    } catch (error) {
      toast.error('Lỗi gửi mã xác minh. Vui lòng thử lại')
    } finally {
      setIsLoading(false)
    }
  }

  const verifyCode = (type) => {
    const savedCode = sessionStorage.getItem(`${type}Code`)
    if (verificationCodes[type] === savedCode) {
      setFormData(prev => ({
        ...prev,
        [`${type}Verified`]: true
      }))
      toast.success(`✓ ${type === 'email' ? 'Email' : 'Số điện thoại'} đã được xác minh`, 3000)
      setVerificationCodes(prev => ({
        ...prev,
        [type]: ''
      }))
    } else {
      toast.error('Mã xác minh không đúng')
    }
  }

  const handleNextStep = () => {
    if (formStep === 1) {
      if (validateStep1()) {
        setFormStep(2)
      }
    } else if (formStep === 2) {
      if (validateStep2()) {
        setFormStep(3)
      }
    }
  }

  const handleRegister = async () => {
    if (!formData.emailVerified || !formData.phoneVerified) {
      toast.warning('Vui lòng xác minh email và số điện thoại')
      return
    }

    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Save user info using StorageUtil
      const mockToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IiR7Zm9ybURhdGEuZnVsbE5hbWV9IiwiZW1haWwiOiIke2Zvcm1EYXRhLmVtYWlsfSIsInJvbGUiOiJDVVNUT01FUiIsImV4cCI6OTk5OTk5OTk5OX0`
      
      StorageUtil.setToken(mockToken)
      StorageUtil.setUser({
        id: '1',
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        role: 'CUSTOMER'
      })
      StorageUtil.setRole('CUSTOMER')
      
      // Also save legacy format for compatibility
      localStorage.setItem('userInfo', JSON.stringify({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        emailVerified: true,
        phoneVerified: true,
        membershipLevel: 'bronze',
        points: 0,
        registeredAt: new Date().toISOString()
      }))
      
      toast.success('✓ Đăng ký thành công!', 3000)
      setTimeout(() => navigate('/home'), 1500)
    } catch (error) {
      toast.error('Lỗi đăng ký. Vui lòng thử lại')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="register-container">
      <div className="register-wrapper">
        {/* Header */}
        <div className="register-header">
          <div className="logo">
            <span className="logo-icon">🚌</span>
            <h1 className="logo-text">BusGo</h1>
          </div>
          <p className="subtitle">Đăng ký tài khoản để bắt đầu booking</p>
        </div>

        {/* Progress Indicator */}
        <div className="progress-steps">
          <div className={`step ${formStep >= 1 ? 'active' : ''} ${formStep > 1 ? 'completed' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Thông tin</span>
          </div>
          <div className="step-connector" style={{
            background: formStep >= 2 ? 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)' : '#e5e7eb'
          }}></div>
          <div className={`step ${formStep >= 2 ? 'active' : ''} ${formStep > 2 ? 'completed' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Mật khẩu</span>
          </div>
          <div className="step-connector" style={{
            background: formStep >= 3 ? 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)' : '#e5e7eb'
          }}></div>
          <div className={`step ${formStep >= 3 ? 'active' : ''} ${formStep > 3 ? 'completed' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Xác minh</span>
          </div>
        </div>

        {/* Form Content */}
        <div className="register-form">
          {/* Step 1: Personal Info */}
          {formStep === 1 && (
            <div className="form-step">
              <h2>Thông tin cá nhân</h2>
              
              <div className="form-group">
                <label>Họ tên *</label>
                <div className="input-wrapper">
                  <FiUser className="input-icon" />
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Nhập họ tên đầy đủ"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={errors.fullName ? 'error' : ''}
                  />
                </div>
                {errors.fullName && <span className="error-text">{errors.fullName}</span>}
              </div>

              <div className="form-group">
                <label>Email *</label>
                <div className="input-wrapper">
                  <FiMail className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Nhập địa chỉ email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={errors.email ? 'error' : ''}
                  />
                </div>
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label>Số điện thoại *</label>
                <div className="input-wrapper">
                  <FiPhone className="input-icon" />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Nhập số điện thoại (10-11 chữ số)"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={errors.phone ? 'error' : ''}
                  />
                </div>
                {errors.phone && <span className="error-text">{errors.phone}</span>}
                <p className="form-hint">💡 Số điện thoại sẽ được tài xế sử dụng để liên lạc với bạn</p>
              </div>
            </div>
          )}

          {/* Step 2: Password */}
          {formStep === 2 && (
            <div className="form-step">
              <h2>Tạo mật khẩu</h2>
              
              <div className="password-requirements">
                <p className="requirements-title">Mật khẩu phải chứa:</p>
                <ul>
                  <li>✓ Ít nhất 8 ký tự</li>
                  <li>✓ Chữ in hoa (A-Z)</li>
                  <li>✓ Chữ thường (a-z)</li>
                  <li>✓ Số (0-9)</li>
                </ul>
              </div>

              <div className="form-group">
                <label>Mật khẩu *</label>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    type="password"
                    name="password"
                    placeholder="Tạo mật khẩu mạnh"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={errors.password ? 'error' : ''}
                  />
                </div>
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label>Xác nhận mật khẩu *</label>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Xác nhận mật khẩu"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={errors.confirmPassword ? 'error' : ''}
                  />
                </div>
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>
            </div>
          )}

          {/* Step 3: Verification */}
          {formStep === 3 && (
            <div className="form-step">
              <h2>Xác minh tài khoản</h2>
              <p className="verification-desc">Hãy xác minh email và số điện thoại của bạn để hoàn tất đăng ký</p>

              {/* Email Verification */}
              <div className="verification-card">
                <div className="verification-header">
                  <FiMail size={20} />
                  <h3>Xác minh Email</h3>
                  {formData.emailVerified && <FiCheck className="check-icon" />}
                </div>
                
                <p className="verification-email">{formData.email}</p>
                
                {!formData.emailVerified ? (
                  <>
                    {!sentCodes.email ? (
                      <button
                        type="button"
                        className="btn-send-code"
                        onClick={() => sendVerificationCode('email')}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Đang gửi...' : 'Gửi mã xác minh'}
                      </button>
                    ) : (
                      <div className="code-input-group">
                        <input
                          type="text"
                          placeholder="Nhập mã 6 chữ số"
                          value={verificationCodes.email}
                          onChange={(e) => setVerificationCodes(prev => ({
                            ...prev,
                            email: e.target.value.slice(0, 6)
                          }))}
                          maxLength="6"
                          className="code-input"
                        />
                        <button
                          type="button"
                          className="btn-verify-code"
                          onClick={() => verifyCode('email')}
                          disabled={verificationCodes.email.length !== 6}
                        >
                          Xác minh
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="verified-badge">
                    <FiCheck size={20} />
                    Email đã được xác minh
                  </div>
                )}
              </div>

              {/* Phone Verification */}
              <div className="verification-card">
                <div className="verification-header">
                  <FiPhone size={20} />
                  <h3>Xác minh Số điện thoại</h3>
                  {formData.phoneVerified && <FiCheck className="check-icon" />}
                </div>
                
                <p className="verification-email">{formData.phone}</p>
                
                {!formData.phoneVerified ? (
                  <>
                    {!sentCodes.phone ? (
                      <button
                        type="button"
                        className="btn-send-code"
                        onClick={() => sendVerificationCode('phone')}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Đang gửi...' : 'Gửi mã xác minh'}
                      </button>
                    ) : (
                      <div className="code-input-group">
                        <input
                          type="text"
                          placeholder="Nhập mã 6 chữ số"
                          value={verificationCodes.phone}
                          onChange={(e) => setVerificationCodes(prev => ({
                            ...prev,
                            phone: e.target.value.slice(0, 6)
                          }))}
                          maxLength="6"
                          className="code-input"
                        />
                        <button
                          type="button"
                          className="btn-verify-code"
                          onClick={() => verifyCode('phone')}
                          disabled={verificationCodes.phone.length !== 6}
                        >
                          Xác minh
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="verified-badge">
                    <FiCheck size={20} />
                    Số điện thoại đã được xác minh
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="form-actions">
          {formStep > 1 && (
            <button
              type="button"
              className="btn-back"
              onClick={() => setFormStep(formStep - 1)}
              disabled={isLoading}
            >
              ← Quay lại
            </button>
          )}
          
          {formStep < 3 && (
            <button
              type="button"
              className="btn-next"
              onClick={handleNextStep}
              disabled={isLoading}
            >
              Tiếp tục →
            </button>
          )}
          
          {formStep === 3 && (
            <button
              type="button"
              className="btn-register"
              onClick={handleRegister}
              disabled={isLoading || !formData.emailVerified || !formData.phoneVerified}
            >
              {isLoading ? 'Đang đăng ký...' : 'Hoàn tất Đăng ký'}
            </button>
          )}
        </div>

        {/* Login Link */}
        <p className="login-link">
          Đã có tài khoản? <a href="/login">Đăng nhập ngay</a>
        </p>
      </div>
    </div>
  )
}
