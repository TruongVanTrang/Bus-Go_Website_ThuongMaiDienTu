import { mockTrips } from '../utils/mockData'

/**
 * Trip Service - Handles all trip-related API calls
 * TODO: Replace mock data with actual API calls when backend is ready
 */

// Get all trips with optional filters
export const getTrips = async (filters = {}) => {
  // TODO: Replace with API call
  // return fetch('/api/trips', { params: filters })
  
  return new Promise((resolve) => {
    setTimeout(() => {
      let filtered = mockTrips

      // Only filter if values are provided
      if (filters.from && filters.from.trim() !== '') {
        filtered = filtered.filter(trip => trip.from === filters.from)
      }
      if (filters.to && filters.to.trim() !== '') {
        filtered = filtered.filter(trip => trip.to === filters.to)
      }
      if (filters.date && filters.date.trim() !== '') {
        filtered = filtered.filter(trip => trip.date === filters.date)
      }
      if (filters.category && filters.category.trim() !== '') {
        filtered = filtered.filter(trip => trip.category === filters.category)
      }

      resolve(filtered)
    }, 300) // Simulate network delay
  })
}

// Get single trip by ID
export const getTripById = async (tripId) => {
  // TODO: Replace with API call
  // return fetch(`/api/trips/${tripId}`)
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const id = parseInt(tripId)
      const trip = mockTrips.find(t => t.id === id)
      resolve(trip || null)
    }, 200)
  })
}

// Search trips by route and date
export const searchTrips = async (from, to, date, category) => {
  // TODO: Replace with API call
  // return fetch('/api/trips/search', { 
  //   params: { from, to, date, category } 
  // })
  
  return getTrips({ from, to, date, category })
}
