// Cargo types configuration - Định nghĩa giá cước gửi hàng theo loại

/**
 * Custom hook to calculate cargo price based on type and weight
 * Centralizes cargo pricing logic for easy maintenance
 */
export const useCargoPrice = () => {
  const cargoTypes = {
    none: { label: 'Không gửi hàng', priceRange: 'Miễn phí', minPrice: 0, maxPrice: 0 },
    light: { label: 'Hàng nhẹ/Tài liệu (<10kg)', priceRange: 'Miễn phí', minPrice: 0, maxPrice: 0 },
    heavy: { label: 'Hàng nặng (>10kg)', priceRange: '3.000đ - 6.500đ/kg', minPrice: 3000, maxPrice: 6500 },
    scooter: { label: 'Xe tay ga', priceRange: '1.000.000đ', minPrice: 1000000, maxPrice: 1000000 },
    maxi_scooter: { label: 'Xe tay côn/SH', priceRange: '1.300.000đ', minPrice: 1300000, maxPrice: 1300000 },
    motorcycle: { label: 'Gửi xe máy thông thường', priceRange: '320.000đ - 400.000đ', minPrice: 320000, maxPrice: 400000 }
  }
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
