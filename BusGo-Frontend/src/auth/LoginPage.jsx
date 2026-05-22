import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import { StorageUtil, AuthUtil, ValidateUtil } from '@/utils/helpers'
import { USER_ROLES, ERROR_MESSAGES } from '@/utils/constants'
import { loginAPI } from '@/services/authService'
import './LoginPage.css'

function LoginPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [generalError, setGeneralError] = useState('')

  /**
   * Xác thực form
   */
  const validateForm = () => {
    const newErrors = {}

    if (!formData.emailOrPhone.trim()) {
      newErrors.emailOrPhone = 'Email hoặc số điện thoại không được để trống'
    } else if (!ValidateUtil.isEmailOrPhone(formData.emailOrPhone)) {
      newErrors.emailOrPhone = 'Email hoặc số điện thoại không hợp lệ'
    }

    if (!formData.password) {
      newErrors.password = 'Mật khẩu không được để trống'
    } else if (!ValidateUtil.isPassword(formData.password)) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }



  /**
   * Xử lý đăng nhập
   * Note: Trong production, thay thế bằng API call
   */
  const handleLogin = async (e) => {
    e.preventDefault()
    setGeneralError('')

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Gọi API đăng nhập từ backend
      const data = await loginAPI(formData.emailOrPhone, formData.password)

      // ✅ Đăng nhập thành công
      // Lưu token và user info vào LocalStorage
      StorageUtil.setToken(data.token)
      StorageUtil.setUser({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
        role: data.user.role
      })
      StorageUtil.setRole(data.user.role)

      // Lưu trữ định dạng cũ để tương thích với các component cũ khác
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

      // Điều hướng theo role (RBAC)
      if (data.user.role === USER_ROLES.CUSTOMER) {
        navigate('/home')
      } else {
        // Admin, Driver, Ticket Staff, Support Staff → /admin/dashboard
        navigate('/admin/dashboard')
      }
    } catch (error) {
      console.error('Login error:', error)
      setGeneralError(error.message || ERROR_MESSAGES.INVALID_CREDENTIALS)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Xử lý thay đổi input
   */
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
    // Xóa lỗi khi user bắt đầu nhập
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }))
    }
  }



  return (
    <div className="login-container">
      <div className="login-wrapper">
        {/* Logo & Title */}
        <div className="login-header">
          <div className="logo">
            <span className="logo-icon">🚌</span>
            <h1 className="logo-text">BusGo</h1>
          </div>
          <p className="subtitle">Hệ thống quản lý và đặt vé xe buýt</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="login-form">
          {/* General Error */}
          {generalError && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <strong>⚠️ Lỗi!</strong> {generalError}
              <button
                type="button"
                className="btn-close"
                onClick={() => setGeneralError('')}
              />
            </div>
          )}

          {/* Email/Phone Field */}
          <div className="form-group">
            <label className="form-label">Email hoặc Số điện thoại</label>
            <div className="input-group">
              <span className="input-group-text">
                <FiMail />
              </span>
              <input
                type="text"
                className={`form-control ${errors.emailOrPhone ? 'is-invalid' : ''}`}
                name="emailOrPhone"
                placeholder="admin@busgo.com hoặc 0987654321"
                value={formData.emailOrPhone}
                onChange={handleChange}
                disabled={isLoading}
                autoFocus
              />
            </div>
            {errors.emailOrPhone && (
              <small className="form-text text-danger d-block mt-1">
                {errors.emailOrPhone}
              </small>
            )}
          </div>
 
          {/* Password Field */}
          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <div className="input-group">
              <span className="input-group-text">
                <FiLock />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                name="password"
                placeholder="Nhập mật khẩu"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <FiEye /> : <FiEyeOff />}
              </button>
            </div>
            {errors.password && (
              <small className="form-text text-danger d-block mt-1">
                {errors.password}
              </small>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="rememberMe"
                disabled={isLoading}
              />
              <label className="form-check-label" htmlFor="rememberMe">
                Ghi nhớ tôi
              </label>
            </div>
            <a href="#" className="forgot-password">
              Quên mật khẩu?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-lg w-100 login-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Đang đăng nhập...
              </>
            ) : (
              'Đăng nhập'
            )}
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="text-center mt-4">
          <p className="text-muted">
            Bạn chưa có tài khoản?{' '}
            <a
              href="/register"
              className="sign-up-link"
              onClick={(e) => {
                e.preventDefault()
                navigate('/register')
              }}
            >
              Đăng ký ngay
            </a>
          </p>
        </div>


      </div>

      {/* Footer */}
      <footer className="login-footer">
        <p>&copy; 2024-2025 BusGo. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default LoginPage
