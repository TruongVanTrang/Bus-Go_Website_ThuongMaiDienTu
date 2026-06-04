import axios from 'axios'
import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants'

const getAuthHeader = () => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
  return { Authorization: `Bearer ${token}` }
}

// =============================================================================
// CUSTOMER CHAT
// =============================================================================

export const getMyChatSessionAPI = async () => {
  const res = await axios.get(`${API_BASE_URL}/users/chat`, {
    headers: getAuthHeader()
  })
  return res.data
}

export const createMyChatSessionAPI = async (chuDeChat = 'Cần hỗ trợ') => {
  const res = await axios.post(`${API_BASE_URL}/users/chat`, 
    { chuDeChat },
    { headers: getAuthHeader() }
  )
  return res.data
}

export const getMyChatMessagesAPI = async (sessionId) => {
  const res = await axios.get(`${API_BASE_URL}/users/chat/${sessionId}/messages`, {
    headers: getAuthHeader()
  })
  return res.data
}

export const sendMyChatMessageAPI = async (sessionId, noiDung) => {
  const res = await axios.post(`${API_BASE_URL}/users/chat/${sessionId}/messages`,
    { noiDung },
    { headers: getAuthHeader() }
  )
  return res.data
}

// =============================================================================
// TICKET CANCELLATION
// =============================================================================

export const requestTicketCancellationAPI = async (ticketId, lyDoHuy) => {
  const res = await axios.post(`${API_BASE_URL}/users/tickets/${ticketId}/cancel`,
    { lyDoHuy },
    { headers: getAuthHeader() }
  )
  return res.data
}
