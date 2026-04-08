import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StorageUtil, AuthUtil, ValidateUtil } from '@/utils/helpers'
import { TEST_ACCOUNTS, USER_ROLES, ERROR_MESSAGES } from '@/utils/constants'
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
   * Tìm kiếm tài khoản test theo email hoặc số điện thoại
   */
  const findTestAccount = (emailOrPhone) => {
    const accounts = Object.values(TEST_ACCOUNTS)
    return accounts.find(
      (acc) => acc.email === emailOrPhone || acc.phone === emailOrPhone
    )
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
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Tìm tài khoản test
      const account = findTestAccount(formData.emailOrPhone)

      if (!account) {
        setGeneralError(ERROR_MESSAGES.INVALID_CREDENTIALS)
        setIsLoading(false)
        return
      }

      // Kiểm tra mật khẩu
      if (account.password !== formData.password) {
        setGeneralError(ERROR_MESSAGES.INVALID_CREDENTIALS)
        setIsLoading(false)
        return
      }

      // ✅ Đăng nhập thành công
      // Simulate JWT token (trong production, token từ backend)
      const mockToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IiR7YWNjb3VudC5uYW1lfSIsImVtYWlsIjoiJHthY2NvdW50LmVtYWlsfSIsInJvbGUiOiIke2FjY291bnQucm9sZX0iLCJleHAiOjk5OTk5OTk5OTl9`

      // Lưu token và user info vào LocalStorage
      StorageUtil.setToken(mockToken)
      StorageUtil.setUser({
        id: '1',
        name: account.name,
        email: account.email,
        phone: account.phone,
        role: account.role
      })
      StorageUtil.setRole(account.role)

      // Điều hướng theo role (RBAC)
      if (account.role === USER_ROLES.CUSTOMER) {
        navigate('/home')
      } else {
        // Admin, Driver, Ticket Staff, Support Staff → /admin/dashboard
        navigate('/admin/dashboard')
      }
    } catch (error) {
      console.error('Login error:', error)
      setGeneralError(ERROR_MESSAGES.NETWORK_ERROR)
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

  /**
   * Quick login cho test accounts
   */
  const handleQuickLogin = (accountType) => {
    const account = TEST_ACCOUNTS[accountType]
    setFormData({
      emailOrPhone: account.email,
      password: account.password
    })
    setErrors({})
    setGeneralError('')
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
                <i className="fas fa-envelope" />
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
                <i className="fas fa-lock" />
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
                <i className={`fas fa-eye${!showPassword ? '-slash' : ''}`} />
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
            <a href="#" className="sign-up-link">
              Đăng ký ngay
            </a>
          </p>
        </div>

        {/* Development: Test Accounts */}
        <div className="dev-test-accounts">
          <details className="test-accounts-collapse">
            <summary className="test-accounts-title">
              👤 Tài khoản test (Chỉ để phát triển)
            </summary>
            <div className="test-accounts-grid">
              {Object.entries(TEST_ACCOUNTS).map(([key, account]) => (
                <button
                  key={key}
                  type="button"
                  className="test-account-btn"
                  onClick={() => handleQuickLogin(key)}
                  disabled={isLoading}
                  title={`${account.name}`}
                >
                  <span className="account-role">{account.role}</span>
                  <span className="account-email">{account.email}</span>
                  <span className="account-password">pwd: {account.password}</span>
                </button>
              ))}
            </div>
          </details>
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
