import axios from 'axios'
import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants'

const getAuthHeader = () => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
  return { Authorization: `Bearer ${token}` }
}

// =============================================================================
// CHAT SESSIONS
// =============================================================================

/** Lấy danh sách phiên chat của Support Agent */
export const getChatSessionsAPI = async (trangThai = null) => {
  const params = trangThai ? { trangThai } : {}
  const res = await axios.get(`${API_BASE_URL}/staff/support/chats`, {
    headers: getAuthHeader(),
    params
  })
  return res.data
}

/** Tạo phiên chat mới */
export const createChatSessionAPI = async ({ maKhachHang, tenKhachHang, emailKhach, chuDeChat }) => {
  const res = await axios.post(`${API_BASE_URL}/staff/support/chats`,
    { maKhachHang, tenKhachHang, emailKhach, chuDeChat },
    { headers: getAuthHeader() }
  )
  return res.data
}

/** Lấy lịch sử tin nhắn của một phiên chat */
export const getChatMessagesAPI = async (sessionId) => {
  const res = await axios.get(`${API_BASE_URL}/staff/support/chats/${sessionId}/messages`, {
    headers: getAuthHeader()
  })
  return res.data
}

/** Gửi tin nhắn từ Support Agent */
export const sendChatMessageAPI = async (sessionId, noiDung) => {
  const res = await axios.post(
    `${API_BASE_URL}/staff/support/chats/${sessionId}/messages`,
    { noiDung },
    { headers: getAuthHeader() }
  )
  return res.data
}

/** Đóng phiên chat */
export const closeChatSessionAPI = async (sessionId) => {
  const res = await axios.put(
    `${API_BASE_URL}/staff/support/chats/${sessionId}/close`,
    {},
    { headers: getAuthHeader() }
  )
  return res.data
}

/** Lấy danh sách vé của khách hàng (hiển thị trong chat) */
export const getCustomerTicketsAPI = async (customerId) => {
  const res = await axios.get(`${API_BASE_URL}/staff/support/customers/${customerId}/tickets`, {
    headers: getAuthHeader()
  })
  return res.data
}

// =============================================================================
// CANCELLATION / REFUND
// =============================================================================

/** Lấy danh sách yêu cầu hoàn/hủy vé */
export const getCancellationRequestsAPI = async (trangThai = null, page = 1) => {
  const params = { page, limit: 20 }
  if (trangThai) params.trangThai = trangThai
  const res = await axios.get(`${API_BASE_URL}/staff/support/cancellations`, {
    headers: getAuthHeader(),
    params
  })
  return res.data
}

/** Kiểm tra điều kiện hủy vé + tính toán hoàn tiền */
export const checkCancellationAPI = async (ticketId) => {
  const res = await axios.get(`${API_BASE_URL}/staff/support/cancellations/${ticketId}/check`, {
    headers: getAuthHeader()
  })
  return res.data
}

/** Tạo yêu cầu hủy vé (pending) */
export const createCancellationRequestAPI = async (maVe, lyDoHuy) => {
  const res = await axios.post(
    `${API_BASE_URL}/staff/support/cancellations`,
    { maVe, lyDoHuy },
    { headers: getAuthHeader() }
  )
  return res.data
}

/** Phê duyệt hoặc Từ chối yêu cầu hủy vé */
export const processCancellationAPI = async (ticketId, { hanh_dong, lyDoHuy, lyDoTuChoi }) => {
  const res = await axios.post(
    `${API_BASE_URL}/staff/support/cancellations/${ticketId}/process`,
    { hanh_dong, lyDoHuy, lyDoTuChoi },
    { headers: getAuthHeader() }
  )
  return res.data
}
