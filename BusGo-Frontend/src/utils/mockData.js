// Mock data for watchlist trips (brief version)
export const mockWatchlistTrips = [
  {
    id: 101,
    from: 'Đà Nẵng',
    to: 'Hà Nội',
    date: '2026-04-20',
    departureTime: '05:00',
    busType: 'bus',
    price: 250000,
    operator: 'BusGo',
    rating: 4.5,
    averageRating: 4.5,
    type: 'trip'
  },
  {
    id: 102,
    from: 'Đà Nẵng',
    to: 'Sài Gòn',
    date: '2026-04-22',
    departureTime: '14:00',
    busType: 'minibus',
    price: 450000,
    operator: 'Sunshine Express',
    rating: 4.8,
    averageRating: 4.8,
    type: 'trip'
  },
  {
    id: 103,
    from: 'Đà Nẵng',
    to: 'Huế',
    date: '2026-04-25',
    departureTime: '08:30',
    busType: 'bus',
    price: 120000,
    operator: 'BusGo Express',
    rating: 4.6,
    averageRating: 4.6,
    type: 'trip'
  },
  {
    id: 104,
    from: 'Đà Nẵng',
    to: 'Nha Trang',
    date: '2026-04-28',
    departureTime: '10:00',
    busType: 'minibus',
    price: 280000,
    operator: 'Premium Transport',
    rating: 4.7,
    averageRating: 4.7,
    type: 'trip'
  }
]

// Mock data for trips
export const mockTrips = [
  // Inter-city trips (35-seater) - All starting from Đà Nẵng
  {
    id: 1,
    from: 'Đà Nẵng',
    to: 'Hà Nội',
    date: '2024-01-15',
    category: 'interCity',
    departureTime: '05:00',
    arrivalTime: '15:30',
    duration: '9h 30m',
    busType: 'bus',
    seatsAvailable: 25,
    totalSeats: 35,
    seats: 35,
    price: 250000,
    operator: 'BusGo',
    amenities: ['AC', 'Wifi', 'Phone Charger'],
    rating: 4.5,
    description: 'Chuyến xe tuyến đường Đà Nẵng - Hà Nội với dịch vụ tiêu chuẩn quốc tế. Trang bị đầy đủ tiện nghi với điều hòa, WiFi và sạc điện thoại. Xe khởi hành sớm, đảm bảo bạn đến đích vào buổi chiều.',
    occupiedSeats: [1, 3, 5, 10, 15, 20, 25],
    stops: [
      { name: 'Bến xe Đà Nẵng', time: '05:00', type: 'start' },
      { name: 'Giao lộ Quảng Ngãi', time: '06:30', type: 'stop' },
      { name: 'Đặc khu Quảng Nam', time: '08:00', type: 'stop' },
      { name: 'Huế', time: '10:00', type: 'stop' },
      { name: 'Vinh', time: '12:30', type: 'stop' },
      { name: 'Bến xe Hà Nội', time: '15:30', type: 'end' }
    ]
  },
  {
    id: 2,
    from: 'Đà Nẵng',
    to: 'Hà Nội',
    date: '2024-01-15',
    category: 'interCity',
    departureTime: '07:30',
    arrivalTime: '17:00',
    duration: '9h 30m',
    busType: 'minibus',
    seatsAvailable: 8,
    totalSeats: 35,
    seats: 35,
    price: 450000,
    operator: 'BusGo Premium',
    amenities: ['AC', 'Wifi', 'Phone Charger', 'Blanket'],
    rating: 4.8,
    description: 'Chuyến xe cao cấp với trang bị xe minibus hiện đại nhất. Cung cấp chăn ấm, WiFi và sạc điện thoại cho từng hành khách. Dịch vụ ăn nhẹ và nước uống miễn phí.',
    occupiedSeats: [2, 4, 6, 8],
    stops: [
      { name: 'Bến xe Đà Nẵng', time: '07:30', type: 'start' },
      { name: 'Giao lộ Quảng Ngãi', time: '09:00', type: 'stop' },
      { name: 'Đặc khu Quảng Nam', time: '10:30', type: 'stop' },
      { name: 'Huế (Lâu Đài)', time: '12:30', type: 'stop' },
      { name: 'Vinh', time: '15:00', type: 'stop' },
      { name: 'Bến xe Hà Nội', time: '17:00', type: 'end' }
    ]
  },
  {
    id: 3,
    from: 'Đà Nẵng',
    to: 'Hà Nội',
    date: '2024-01-15',
    category: 'interCity',
    departureTime: '09:00',
    arrivalTime: '18:30',
    duration: '9h 30m',
    busType: 'bus',
    seatsAvailable: 15,
    totalSeats: 35,
    seats: 35,
    price: 280000,
    operator: 'BusGo',
    amenities: ['AC', 'Wifi', 'Phone Charger', 'Toilet'],
    rating: 4.6,
    description: 'Chuyến xe thường xuyên với đầy đủ tiện nghi nhà vệ sinh trên xe. Phù hợp cho khách du lịch và công tác.',
    occupiedSeats: [1, 5, 10, 15, 20],
    stops: [
      { name: 'Bến xe Đà Nẵng', time: '09:00', type: 'start' },
      { name: 'Giao lộ Quảng Ngãi', time: '10:30', type: 'stop' },
      { name: 'Đặc khu Quảng Nam', time: '12:00', type: 'stop' },
      { name: 'Huế', time: '14:00', type: 'stop' },
      { name: 'Vinh', time: '16:30', type: 'stop' },
      { name: 'Bến xe Hà Nội', time: '18:30', type: 'end' }
    ]
  },
  {
    id: 4,
    from: 'Đà Nẵng',
    to: 'Hà Nội',
    date: '2024-01-15',
    category: 'interCity',
    departureTime: '10:30',
    arrivalTime: '20:00',
    duration: '9h 30m',
    busType: 'minibus',
    seatsAvailable: 12,
    totalSeats: 35,
    seats: 35,
    price: 480000,
    operator: 'Sunshine Express',
    amenities: ['AC', 'Wifi', 'Phone Charger', 'Blanket'],
    rating: 4.7,
    description: 'Dịch vụ cao cấp Sunshine Express với xe minibus tư nhân. Gồm chăn, gối, WiFi và dịch vụ ăn nhẹ hạng nhất.',
    occupiedSeats: [3, 7, 11],
    stops: [
      { name: 'Bến xe Đà Nẵng', time: '10:30', type: 'start' },
      { name: 'Giao lộ Quảng Ngãi', time: '12:00', type: 'stop' },
      { name: 'Đặc khu Quảng Nam', time: '13:30', type: 'stop' },
      { name: 'Huế', time: '15:30', type: 'stop' },
      { name: 'Vinh', time: '18:00', type: 'stop' },
      { name: 'Bến xe Hà Nội', time: '20:00', type: 'end' }
    ]
  },
  {
    id: 5,
    from: 'Đà Nẵng',
    to: 'Sài Gòn',
    date: '2024-01-15',
    category: 'interCity',
    departureTime: '14:00',
    arrivalTime: '23:30',
    duration: '9h 30m',
    busType: 'bus',
    seatsAvailable: 8,
    totalSeats: 35,
    seats: 35,
    price: 200000,
    operator: 'BusGo',
    amenities: ['AC'],
    rating: 4.0,
    description: 'Tuyến đường Đà Nẵng - TP.HCM với giá tốt nhất. Khởi hành chiều, đến TP.HCM vào đêm hôm sau.',
    occupiedSeats: [2, 6, 10, 14, 18, 22, 26, 30],
    stops: [
      { name: 'Bến xe Đà Nẵng', time: '14:00', type: 'start' },
      { name: 'Huế', time: '16:00', type: 'stop' },
      { name: 'Nha Trang', time: '19:00', type: 'stop' },
      { name: 'Phan Rang', time: '21:00', type: 'stop' },
      { name: 'Bến xe Miền Đông', time: '23:30', type: 'end' }
    ]
  },
  {
    id: 6,
    from: 'Đà Nẵng',
    to: 'Sài Gòn',
    date: '2024-01-15',
    category: 'interCity',
    departureTime: '16:30',
    arrivalTime: '02:00',
    duration: '9h 30m',
    busType: 'bus',
    seatsAvailable: 32,
    totalSeats: 35,
    seats: 35,
    price: 220000,
    operator: 'BusGo',
    amenities: ['AC', 'Blanket'],
    rating: 4.4,
    description: 'Chuyến xe chiều tối tới TP.HCM với chăn và điều hòa thoải mái. Lý tưởng cho những ai muốn đi chiều.',
    occupiedSeats: [1, 2, 3],
    stops: [
      { name: 'Bến xe Đà Nẵng', time: '16:30', type: 'start' },
      { name: 'Huế', time: '18:30', type: 'stop' },
      { name: 'Nha Trang', time: '21:30', type: 'stop' },
      { name: 'Phan Rang', time: '23:30', type: 'stop' },
      { name: 'Bến xe Miền Đông', time: '02:00', type: 'end' }
    ]
  },
  {
    id: 7,
    from: 'Đà Nẵng',
    to: 'Sài Gòn',
    date: '2024-01-15',
    category: 'interCity',
    departureTime: '18:00',
    arrivalTime: '03:30',
    duration: '9h 30m',
    busType: 'bus',
    seatsAvailable: 38,
    totalSeats: 35,
    seats: 35,
    price: 180000,
    operator: 'BusGo',
    amenities: ['AC', 'Pillow & Blanket', 'Toilet'],
    rating: 4.3,
    description: 'Chuyến xe buổi tối rẻ nhất với dịch vụ đầy đủ. Có gối, chăn và nhà vệ sinh trên xe.',
    occupiedSeats: [],
    stops: [
      { name: 'Bến xe Đà Nẵng', time: '18:00', type: 'start' },
      { name: 'Huế', time: '20:00', type: 'stop' },
      { name: 'Nha Trang', time: '23:00', type: 'stop' },
      { name: 'Phan Rang', time: '01:00', type: 'stop' },
      { name: 'Bến xe Miền Đông', time: '03:30', type: 'end' }
    ]
  },
  {
    id: 8,
    from: 'Đà Nẵng',
    to: 'Sài Gòn',
    date: '2024-01-15',
    category: 'interCity',
    departureTime: '20:00',
    arrivalTime: '05:30',
    duration: '9h 30m',
    busType: 'minibus',
    seatsAvailable: 5,
    totalSeats: 35,
    seats: 35,
    price: 520000,
    operator: 'Luxury Transport',
    amenities: ['AC', 'Wifi', 'Phone Charger', 'Blanket', 'Toilet'],
    rating: 4.9,
    description: 'Xe minibus sang trọng nhất với tất cả tiện nghi cao cấp. Gồm WiFi, sạc điện, chăn ấm, gối và nhà vệ sinh.',
    occupiedSeats: [5, 10, 15, 20, 25, 30],
    stops: [
      { name: 'Bến xe Đà Nẵng', time: '20:00', type: 'start' },
      { name: 'Huế', time: '22:00', type: 'stop' },
      { name: 'Nha Trang', time: '01:00', type: 'stop' },
      { name: 'Phan Rang', time: '03:00', type: 'stop' },
      { name: 'Bến xe Miền Đông', time: '05:30', type: 'end' }
    ]
  },
  {
    id: 9,
    from: 'Đà Nẵng',
    to: 'Huế',
    date: '2024-01-15',
    category: 'interCity',
    departureTime: '22:00',
    arrivalTime: '07:30',
    duration: '9h 30m',
    busType: 'bus',
    seatsAvailable: 35,
    totalSeats: 35,
    seats: 35,
    price: 190000,
    operator: 'BusGo',
    amenities: ['AC', 'Pillow & Blanket'],
    rating: 4.2,
    description: 'Đêm khuya đi Huế với giá rẻ. Cung cấp gối và chăn cho giấc ngủ thoải mái.',
    occupiedSeats: [],
    stops: [
      { name: 'Bến xe Đà Nẵng', time: '22:00', type: 'start' },
      { name: 'Lăng Cô', time: '23:30', type: 'stop' },
      { name: 'Phía Dương', time: '01:00', type: 'stop' },
      { name: 'Bến xe Huế', time: '07:30', type: 'end' }
    ]
  },
  {
    id: 10,
    from: 'Đà Nẵng',
    to: 'Quảng Nam',
    date: '2024-01-15',
    category: 'interCity',
    departureTime: '23:30',
    arrivalTime: '09:00',
    duration: '9h 30m',
    busType: 'bus',
    seatsAvailable: 42,
    totalSeats: 35,
    seats: 35,
    price: 170000,
    operator: 'BusGo',
    amenities: ['AC'],
    rating: 4.1,
    description: 'Tuyến địa phương Đà Nẵng - Quảng Nam với giá rẻ nhất. Khởi hành đêm khuya.',
    occupiedSeats: [1, 2],
    stops: [
      { name: 'Bến xe Đà Nẵng', time: '23:30', type: 'start' },
      { name: 'Giao lộ Quảng Ngãi', time: '01:00', type: 'stop' },
      { name: 'Đặc khu Quảng Nam', time: '03:00', type: 'stop' },
      { name: 'Trung tâm Quảng Nam', time: '09:00', type: 'end' }
    ]
  },
  // City transit trips (16-seater)
  {
    id: 11,
    from: 'Bến xe trung tâm',
    to: 'Sân bay Quốc tế Đà Nẵng',
    date: '2024-01-15',
    category: 'city',
    departureTime: '06:00',
    arrivalTime: '06:30',
    duration: '30m',
    busType: 'minibus',
    seatsAvailable: 12,
    totalSeats: 16,
    seats: 16,
    price: 50000,
    operator: 'BusGo',
    amenities: ['AC'],
    rating: 4.3,
    description: 'Tuyến sân bay dễ tiếp cận từ trung tâm thành phố. Khởi hành sáng sớm, xác suất tắc đường thấp nhất.',
    occupiedSeats: [1, 5, 10],
    stops: [
      { name: 'Bến xe trung tâm', time: '06:00', type: 'start' },
      { name: 'Đại lộ Võ Văn Kiệt', time: '06:10', type: 'stop' },
      { name: 'Sân bay Quốc tế Đà Nẵng', time: '06:30', type: 'end' }
    ]
  },
  {
    id: 12,
    from: 'Bến xe trung tâm',
    to: 'Bãi biển Mỹ Khê',
    date: '2024-01-15',
    category: 'city',
    departureTime: '07:00',
    arrivalTime: '07:20',
    duration: '20m',
    busType: 'minibus',
    seatsAvailable: 14,
    totalSeats: 16,
    seats: 16,
    price: 35000,
    operator: 'BusGo',
    amenities: ['AC'],
    rating: 4.4,
    description: 'Nhanh chóng tới bãi biển đẹp nhất Đà Nẵng. Chuyến xe sáng lý tưởng cho dạo biển sớm.',
    occupiedSeats: [3, 8],
    stops: [
      { name: 'Bến xe trung tâm', time: '07:00', type: 'start' },
      { name: 'Ngã tư Hùng Vương', time: '07:10', type: 'stop' },
      { name: 'Bãi biển Mỹ Khê', time: '07:20', type: 'end' }
    ]
  },
  {
    id: 13,
    from: 'Cầu Rồng',
    to: 'Phố cổ Hội An',
    date: '2024-01-15',
    category: 'city',
    departureTime: '08:00',
    arrivalTime: '08:45',
    duration: '45m',
    busType: 'minibus',
    seatsAvailable: 10,
    totalSeats: 16,
    seats: 16,
    price: 60000,
    operator: 'BusGo',
    amenities: ['AC', 'Wifi'],
    rating: 4.5,
    description: 'Đi Hội An từ Cầu Rồng với WiFi miễn phí. Phù hợp cho khách du lịch muốn khám phá phố cổ.',
    occupiedSeats: [2, 4, 6, 8, 10, 12],
    stops: [
      { name: 'Cầu Rồng', time: '08:00', type: 'start' },
      { name: 'Trung tâm thành phố', time: '08:15', type: 'stop' },
      { name: 'Đường cao tốc Đà Nẵng - Hội An', time: '08:30', type: 'stop' },
      { name: 'Phố cổ Hội An', time: '08:45', type: 'end' }
    ]
  },
  {
    id: 14,
    from: 'Sân bay Quốc tế Đà Nẵng',
    to: 'Bãi biển Non Nước',
    date: '2024-01-15',
    category: 'city',
    departureTime: '09:00',
    arrivalTime: '09:50',
    duration: '50m',
    busType: 'minibus',
    seatsAvailable: 13,
    totalSeats: 16,
    seats: 16,
    price: 55000,
    operator: 'BusGo',
    amenities: ['AC'],
    rating: 4.2,
    description: 'Từ sân bay đến bãi biển đáp ứng tiêu chuẩn UNESCO. Tuyến du lịch phổ biến.',
    occupiedSeats: [1, 7, 14],
    stops: [
      { name: 'Sân bay Quốc tế Đà Nẵng', time: '09:00', type: 'start' },
      { name: 'Khu đô thị Sơn Trà', time: '09:20', type: 'stop' },
      { name: 'Non Nước Beach Resort', time: '09:50', type: 'end' }
    ]
  },
  {
    id: 15,
    from: 'Đại học Duy Tân',
    to: 'Trung tâm thành phố',
    date: '2024-01-15',
    category: 'city',
    departureTime: '10:00',
    arrivalTime: '10:25',
    duration: '25m',
    busType: 'minibus',
    seatsAvailable: 15,
    totalSeats: 16,
    seats: 16,
    price: 40000,
    operator: 'BusGo',
    amenities: ['AC'],
    rating: 4.6,
    description: 'Tuyến xe sinh viên từ trường ĐH Duy Tân tới trung tâm. Tiện lợi cho học tập và công tác.',
    occupiedSeats: [5],
    stops: [
      { name: 'Đại học Duy Tân', time: '10:00', type: 'start' },
      { name: 'Khu công nghiệp', time: '10:10', type: 'stop' },
      { name: 'Trung tâm thành phố', time: '10:25', type: 'end' }
    ]
  },
  {
    id: 16,
    from: 'Khu công nghiệp Hòa Cầm',
    to: 'Bến xe trung tâm',
    date: '2024-01-15',
    category: 'city',
    departureTime: '11:00',
    arrivalTime: '11:35',
    duration: '35m',
    busType: 'minibus',
    seatsAvailable: 11,
    totalSeats: 16,
    seats: 16,
    price: 45000,
    operator: 'BusGo',
    amenities: ['AC'],
    rating: 4.1,
    description: 'Tuyến xe công nghiệp để công nhân tới trung tâm. Khởi hành buổi trưa.',
    occupiedSeats: [2, 6, 9, 12, 15],
    stops: [
      { name: 'Khu công nghiệp Hòa Cầm', time: '11:00', type: 'start' },
      { name: 'Cơ sở đào tạo', time: '11:15', type: 'stop' },
      { name: 'Bến xe trung tâm', time: '11:35', type: 'end' }
    ]
  },
  {
    id: 17,
    from: 'Đại học Kinh tế Đà Nẵng',
    to: 'Cộng Hòa (trung tâm)',
    date: '2024-01-15',
    category: 'city',
    departureTime: '12:00',
    arrivalTime: '12:20',
    duration: '20m',
    busType: 'minibus',
    seatsAvailable: 16,
    totalSeats: 16,
    seats: 16,
    price: 38000,
    operator: 'BusGo',
    amenities: ['AC'],
    rating: 4.7,
    description: 'Tuyến xuất phát từ Đại học Kinh tế. Nhanh chóng tới khu trung tâm thương mại.',
    occupiedSeats: [],
    stops: [
      { name: 'Đại học Kinh tế Đà Nẵng', time: '12:00', type: 'start' },
      { name: 'Bệnh viện A', time: '12:10', type: 'stop' },
      { name: 'Cộng Hòa (trung tâm)', time: '12:20', type: 'end' }
    ]
  },
  {
    id: 18,
    from: 'Hùng Vương',
    to: 'Phạm Văn Đồng',
    date: '2024-01-15',
    category: 'city',
    departureTime: '13:00',
    arrivalTime: '13:15',
    duration: '15m',
    busType: 'minibus',
    seatsAvailable: 14,
    totalSeats: 16,
    seats: 16,
    price: 32000,
    operator: 'BusGo',
    amenities: ['AC'],
    rating: 4.4,
    description: 'Tuyến dài nhất trên đường Phạm Văn Đồng. Tiện lợi giữa khu thương mại và dân cư.',
    occupiedSeats: [4, 11],
    stops: [
      { name: 'Hùng Vương', time: '13:00', type: 'start' },
      { name: 'Ngã tư Phạm Văn Đồng', time: '13:08', type: 'stop' },
      { name: 'Phạm Văn Đồng', time: '13:15', type: 'end' }
    ]
  }
]

// Mock payment methods
export const mockPaymentMethods = {
  visa: {
    name: 'Visa',
    category: 'Thẻ quốc tế',
    logo: '💳',
    description: 'Thanh toán qua thẻ Visa quốc tế'
  },
  mastercard: {
    name: 'Mastercard',
    category: 'Thẻ quốc tế',
    logo: '💳',
    description: 'Thanh toán qua thẻ Mastercard quốc tế'
  },
  jcb: {
    name: 'JCB',
    category: 'Thẻ quốc tế',
    logo: '💳',
    description: 'Thanh toán qua thẻ JCB quốc tế'
  },
  atm_napas: {
    name: 'ATM Napas',
    category: 'Thẻ nội địa',
    logo: '🏦',
    description: 'Thanh toán qua thẻ ATM nội địa qua cổng Napas'
  },
  momo: {
    name: 'Momo',
    category: 'Ví điện tử',
    logo: '📱',
    description: 'Thanh toán qua ví điện tử Momo'
  },
  zalopay: {
    name: 'ZaloPay',
    category: 'Ví điện tử',
    logo: '📱',
    description: 'Thanh toán qua ví điện tử ZaloPay'
  },
  vnpay: {
    name: 'VNPay',
    category: 'Ví điện tử',
    logo: '📱',
    description: 'Thanh toán qua ví điện tử VNPay'
  }
}

// Cargo types configuration
export const cargoTypes = {
  none: {
    label: 'Không gửi hàng',
    priceRange: 'Miễn phí',
    minPrice: 0,
    maxPrice: 0
  },
  light: {
    label: 'Hàng nhẹ/Tài liệu (<10kg)',
    priceRange: 'Miễn phí',
    minPrice: 0,
    maxPrice: 0
  },
  heavy: {
    label: 'Hàng nặng (>10kg)',
    priceRange: '3.000đ - 6.500đ/kg',
    minPrice: 3000,
    maxPrice: 6500
  },
  scooter: {
    label: 'Xe tay ga',
    priceRange: '1.000.000đ',
    minPrice: 1000000,
    maxPrice: 1000000
  },
  maxi_scooter: {
    label: 'Xe tay côn/SH',
    priceRange: '1.300.000đ',
    minPrice: 1300000,
    maxPrice: 1300000
  },
  motorcycle: {
    label: 'Gửi xe máy thông thường',
    priceRange: '320.000đ - 400.000đ',
    minPrice: 320000,
    maxPrice: 400000
  }
}
