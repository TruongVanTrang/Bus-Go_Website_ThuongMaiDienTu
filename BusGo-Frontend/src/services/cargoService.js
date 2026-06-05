import axios from 'axios'
import { API_BASE_URL } from '../utils/constants'

/**
 * Lấy danh sách hàng hóa ký gửi của khách hàng hiện tại
 * @param {string} token - JWT Token
 * @returns {Promise<array>} response - Danh sách đơn hàng ký gửi
 */
export const getMyConsignmentsAPI = async (token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/cargo/my-consignments`, {
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
 * Hủy đơn hàng ký gửi (khách hàng)
 * @param {string} id - ID đơn ký gửi (consignmentId)
 * @param {string} token - JWT Token
 */
export const cancelConsignmentAPI = async (id, token) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/cargo/consignment/${id}/cancel`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi kết nối server' }
  }
}

export const updateConsignmentAPI = async (id, data, token) => { try { const response = await axios.put(`${API_BASE_URL}/cargo/consignment/${id}`, data, { headers: { Authorization: `Bearer ${token}` } }); return response.data; } catch (error) { throw error.response?.data || { message: 'Lỗi kết nối server' } } }

export const approveEditConsignmentAPI = async (id, keepDriver, token) => { try { const response = await axios.put(`${API_BASE_URL}/cargo/consignment/${id}/approve-edit`, { keepDriver }, { headers: { Authorization: `Bearer ${token}` } }); return response.data; } catch (error) { throw error.response?.data || { message: 'Lỗi kết nối server' } } }
