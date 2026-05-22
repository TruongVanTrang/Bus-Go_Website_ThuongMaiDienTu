import axios from 'axios'
import { API_BASE_URL } from '../utils/constants'

/**
 * Đăng nhập người dùng
 * @param {string} emailOrPhone - Email hoặc Số điện thoại
 * @param {string} password - Mật khẩu
 * @returns {Promise<object>} response - Kết quả trả về từ backend (token, user)
 */
export const loginAPI = async (emailOrPhone, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      emailOrPhone,
      password
    })
    return response.data
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi kết nối server' }
  }
}

/**
 * Đăng ký tài khoản khách hàng mới
 * @param {object} data - Thông tin đăng ký
 * @param {string} data.fullName - Họ tên
 * @param {string} data.email - Email
 * @param {string} data.phone - Số điện thoại
 * @param {string} data.password - Mật khẩu
 * @returns {Promise<object>} response - Kết quả trả về từ backend
 */
export const registerAPI = async ({ fullName, email, phone, password }) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      fullName,
      email,
      phone,
      password
    })
    return response.data
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi kết nối server' }
  }
}

/**
 * Lấy thông tin cá nhân hiện tại
 * @param {string} token - JWT Token
 * @returns {Promise<object>} response - Thông tin profile người dùng
 */
export const getProfileAPI = async (token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi kết nối server' }
  }
}

/**
 * Gửi mã OTP xác thực email
 * @param {string} email - Email nhận mã
 * @returns {Promise<object>} response - Kết quả từ backend
 */
export const sendOTPAPI = async (email) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/send-otp`, { email })
    return response.data
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi kết nối server' }
  }
}

/**
 * Xác minh mã OTP
 * @param {string} email - Email cần xác minh
 * @param {string} code - Mã OTP
 * @returns {Promise<object>} response - Kết quả từ backend
 */
export const verifyOTPAPI = async (email, code) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/verify-otp`, { email, code })
    return response.data
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi kết nối server' }
  }
}

/**
 * Cập nhật thông tin cá nhân (Profile)
 * @param {string} token - JWT Token
 * @param {object} profileData - Dữ liệu cần cập nhật
 * @param {string} profileData.name - Họ tên
 * @param {string} profileData.email - Email
 * @param {string} profileData.phone - Số điện thoại
 * @returns {Promise<object>} response - Kết quả trả về từ backend
 */
export const updateProfileAPI = async (token, { name, email, phone }) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/users/profile`, { name, email, phone }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi kết nối server' }
  }
}


