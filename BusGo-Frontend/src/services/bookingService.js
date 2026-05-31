import axios from 'axios'
import { API_BASE_URL } from '../utils/constants'

/**
 * Đặt vé (Booking)
 * @param {string} token - JWT Token
 * @param {object} bookingData - Thông tin đặt vé
 * @returns {Promise<object>} response - Kết quả trả về từ backend (bookingId)
 */
export const createBookingAPI = async (token, bookingData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/bookings`, bookingData, {
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
 * Gọi API tạo URL thanh toán VNPay
 */
export const createVNPayUrlAPI = async (amount, bookingId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/payments/vnpay/create_payment_url`, {
      amount,
      bookingId
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi tạo URL thanh toán VNPay' };
  }
};

/**
 * Lấy danh sách vé đã đặt của khách hàng hiện tại
 * @param {string} token - JWT Token
 * @returns {Promise<array>} response - Danh sách vé/lịch sử giao dịch
 */
export const getMyTicketsAPI = async (token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/bookings/my-tickets`, {
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
 * Hủy đặt vé
 * @param {string} token - JWT Token
 * @param {string} bookingId - Mã đặt vé
 * @returns {Promise<object>} response - Kết quả trả về từ backend
 */
export const cancelBookingAPI = async (token, bookingId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {}, {
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
 * Gửi đánh giá phản hồi chuyến đi
 * @param {string} token - JWT Token
 * @param {string} bookingId - Mã đặt vé
 * @param {number} rating - Số sao đánh giá (1-5)
 * @param {string} comments - Nhận xét của khách hàng
 * @returns {Promise<object>} response - Kết quả từ backend
 */
export const submitFeedbackAPI = async (token, bookingId, rating, comments) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/bookings/${bookingId}/feedback`, {
      rating,
      comments
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi kết nối server' }
  }
}
