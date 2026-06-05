import axios from 'axios'
import { API_BASE_URL } from '../utils/constants'

/**
 * Trip Service - Handles all trip-related API calls connecting to backend
 */

// Get all trips with optional filters
export const getTrips = async (filters = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/trips/search`, {
      params: {
        from: filters.from || '',
        to: filters.to || '',
        date: filters.date || '',
        category: filters.category || '',
        busType: filters.busType || ''
      }
    })
    return response.data
  } catch (error) {
    console.error('Error in getTrips API:', error)
    throw error.response?.data || { message: 'Lỗi kết nối server' }
  }
}

// Get single trip by ID
export const getTripById = async (tripId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/trips/${tripId}`)
    return response.data
  } catch (error) {
    console.error('Error in getTripById API:', error)
    throw error.response?.data || { message: 'Lỗi kết nối server' }
  }
}

// Search trips by route and date
export const searchTrips = async (from, to, date, category, busType) => {
  return getTrips({ from, to, date, category, busType })
}
