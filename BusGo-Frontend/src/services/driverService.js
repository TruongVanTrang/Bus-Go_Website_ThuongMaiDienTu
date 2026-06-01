import axios from 'axios'
import { API_BASE_URL } from '../utils/constants'
import { StorageUtil } from '../utils/helpers'

// Hàm helper để đính kèm token vào header
const getAuthHeaders = () => {
  const token = StorageUtil.getToken()
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
}

// Lấy danh sách chuyến xe của tài xế
export const getDriverTripsAPI = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/driver/my-trips`, getAuthHeaders())
    return response.data
  } catch (error) {
    console.error('Lỗi API getDriverTrips:', error)
    throw error.response?.data || { message: 'Lỗi kết nối máy chủ' }
  }
}

// Cập nhật trạng thái chuyến đi
export const updateTripStatusAPI = async (tripId, statusData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/driver/trips/${tripId}/status`, statusData, getAuthHeaders())
    return response.data
  } catch (error) {
    console.error('Lỗi API updateTripStatus:', error)
    throw error.response?.data || { message: 'Lỗi kết nối máy chủ' }
  }
}

// Lấy danh sách hành khách theo chuyến
export const getTripPassengersAPI = async (tripId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/driver/trips/${tripId}/passengers`, getAuthHeaders())
    return response.data
  } catch (error) {
    console.error('Lỗi API getTripPassengers:', error)
    throw error.response?.data || { message: 'Lỗi kết nối máy chủ' }
  }
}

// Soát vé hành khách
export const checkInPassengerAPI = async (ticketId) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/driver/passengers/${ticketId}/check-in`, {}, getAuthHeaders())
    return response.data
  } catch (error) {
    console.error('Lỗi API checkInPassenger:', error)
    throw error.response?.data || { message: 'Lỗi kết nối máy chủ' }
  }
}

// Lấy danh sách hàng hóa đi kèm của chuyến
export const getTripCargoAPI = async (tripId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/driver/trips/${tripId}/cargo`, getAuthHeaders())
    return response.data
  } catch (error) {
    console.error('Lỗi API getTripCargo:', error)
    throw error.response?.data || { message: 'Lỗi kết nối máy chủ' }
  }
}

// Cập nhật trạng thái kiện hàng
export const updateCargoStatusAPI = async (cargoId, status) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/driver/cargo/${cargoId}/status`, { status }, getAuthHeaders())
    return response.data
  } catch (error) {
    console.error('Lỗi API updateCargoStatus:', error)
    throw error.response?.data || { message: 'Lỗi kết nối máy chủ' }
  }
}
