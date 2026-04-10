import { cargoTypes } from '../utils/mockData'

/**
 * Custom hook to calculate cargo price based on type and weight
 * Centralizes cargo pricing logic for easy maintenance
 */
export const useCargoPrice = () => {
  const calculateCargoPrice = (type, weight = '') => {
    if (type === 'none' || type === 'light') return 0

    if (type === 'heavy' && weight) {
      const w = parseFloat(weight)
      if (w < 10) return 0 // Free if < 10kg
      const pricePerKg = (cargoTypes.heavy.minPrice + cargoTypes.heavy.maxPrice) / 2
      return Math.round(w * pricePerKg)
    }

    if (type === 'scooter') {
      return cargoTypes.scooter.minPrice
    }

    if (type === 'maxi_scooter') {
      return cargoTypes.maxi_scooter.minPrice
    }

    if (type === 'motorcycle') {
      return cargoTypes.motorcycle.minPrice + Math.random() * 
             (cargoTypes.motorcycle.maxPrice - cargoTypes.motorcycle.minPrice)
    }

    return 0
  }

  return { calculateCargoPrice, cargoTypes }
}
