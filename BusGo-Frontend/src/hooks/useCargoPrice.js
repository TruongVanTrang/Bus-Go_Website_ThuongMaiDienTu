// Cargo types configuration - Định nghĩa giá cước gửi hàng theo loại

/**
 * Custom hook to calculate cargo price based on type and weight
 * Centralizes cargo pricing logic for easy maintenance
 */
export const useCargoPrice = () => {
  const cargoTypes = {
    none: { label: 'Không gửi hàng', priceRange: 'Miễn phí', minPrice: 0, maxPrice: 0 },
    light: { label: 'Hàng nhẹ/Tài liệu (<7kg)', priceRange: 'Miễn phí', minPrice: 0, maxPrice: 0 },
    heavy: { label: 'Hàng nặng (>7kg)', priceRange: '10.000đ/kg', minPrice: 10000, maxPrice: 10000 },
    scooter: { label: 'Xe tay ga', priceRange: '320.000đ', minPrice: 320000, maxPrice: 320000 },
    maxi_scooter: { label: 'Xe tay côn/SH', priceRange: '1.300.000đ', minPrice: 1300000, maxPrice: 1300000 },
    motorcycle: { label: 'Gửi xe máy thông thường', priceRange: '270.000đ', minPrice: 270000, maxPrice: 270000 }
  }
  const calculateCargoPrice = (type, weight = '') => {
    if (type === 'none' || type === 'light') return 0

    if (type === 'heavy' && weight) {
      const w = parseFloat(weight)
      if (w <= 7) return 0 // Free if <= 7kg
      const pricePerKg = 10000
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
