import { STORAGE_KEYS } from './constants'

/**
 * LocalStorage helpers for token and user data
 */
export const StorageUtil = {
  // Token operations
  setToken: (token) => {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token)
  },
  getToken: () => {
    return localStorage.getItem(STORAGE_KEYS.TOKEN)
  },
  removeToken: () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
  },

  // User operations
  setUser: (user) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
  },
  getUser: () => {
    const user = localStorage.getItem(STORAGE_KEYS.USER)
    return user ? JSON.parse(user) : null
  },
  removeUser: () => {
    localStorage.removeItem(STORAGE_KEYS.USER)
  },

  // Role operations
  setRole: (role) => {
    localStorage.setItem(STORAGE_KEYS.ROLE, role)
  },
  getRole: () => {
    return localStorage.getItem(STORAGE_KEYS.ROLE)
  },
  removeRole: () => {
    localStorage.removeItem(STORAGE_KEYS.ROLE)
  },

  // Clear all auth data
  clearAuth: () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)
    localStorage.removeItem(STORAGE_KEYS.ROLE)
  }
}

/**
 * JWT Token helpers
 */
export const TokenUtil = {
  // Check if token is expired
  isTokenExpired: (token) => {
    if (!token) return true
    
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      
      const decoded = JSON.parse(jsonPayload)
      const expirationTime = decoded.exp * 1000 // Convert to milliseconds
      return Date.now() >= expirationTime
    } catch (error) {
      return true
    }
  },

  // Decode token to get payload
  decodeToken: (token) => {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      return JSON.parse(jsonPayload)
    } catch (error) {
      console.error('Failed to decode token:', error)
      return null
    }
  }
}

/**
 * Authentication helpers
 */
export const AuthUtil = {
  // Check if user is authenticated
  isAuthenticated: () => {
    const token = StorageUtil.getToken()
    return token && !TokenUtil.isTokenExpired(token)
  },

  // Get current user
  getCurrentUser: () => {
    return StorageUtil.getUser()
  },

  // Get current user role
  getCurrentRole: () => {
    return StorageUtil.getRole()
  },

  // Check if user has specific role(s)
  hasRole: (roles) => {
    const userRole = StorageUtil.getRole()
    const rolesArray = Array.isArray(roles) ? roles : [roles]
    return rolesArray.includes(userRole)
  },

  // Check if user has any of the specified roles
  hasAnyRole: (roles) => {
    return AuthUtil.hasRole(roles)
  },

  // Check if user is admin
  isAdmin: () => {
    return StorageUtil.getRole() === 'ADMIN'
  },

  // Check if user is staff (admin, driver, ticket staff, support staff)
  isStaff: () => {
    const role = StorageUtil.getRole()
    return role && role !== 'CUSTOMER'
  },

  // Logout user
  logout: () => {
    StorageUtil.clearAuth()
  }
}

/**
 * Form validation helpers
 */
export const ValidateUtil = {
  // Validate email
  isEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  // Validate phone
  isPhone: (phone) => {
    const phoneRegex = /^(0)[1-9]\d{8,}$/
    return phoneRegex.test(phone)
  },

  // Validate email or phone
  isEmailOrPhone: (value) => {
    return ValidateUtil.isEmail(value) || ValidateUtil.isPhone(value)
  },

  // Validate password
  isPassword: (password) => {
    return password && password.length >= 6
  }
}

/**
 * Format helpers
 */
export const FormatUtil = {
  // Format date to DD/MM/YYYY
  formatDate: (date) => {
    if (!date) return ''
    const d = new Date(date)
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  },

  // Format currency to VND
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  },

  // Format time to HH:MM
  formatTime: (time) => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    return `${hours}:${minutes}`
  }
}
