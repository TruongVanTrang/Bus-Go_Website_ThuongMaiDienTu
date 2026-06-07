// Constants for user roles in BusGo system
export const USER_ROLES = {
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
  DRIVER: 'DRIVER',
  TRUCK_DRIVER: 'TRUCK_DRIVER',
  TICKET_STAFF: 'TICKET_STAFF',
  SUPPORT_STAFF: 'SUPPORT_STAFF'
}

// API endpoints
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  ROLE: 'userRole'
}



// Bus types and pricing (BusGo only)
export const BUS_TYPES = {
  // City transit buses (5,000 - 8,000 VNĐ)
  CITY_SMALL: {
    id: 'city_small',
    name: 'Xe buýt nhỏ',
    category: 'city',
    seats: 20,
    priceRange: [5000, 8000],
    icon: '🚌'
  },
  CITY_MEDIUM: {
    id: 'city_medium',
    name: 'Xe buýt trung',
    category: 'city',
    seats: 30,
    priceRange: [5000, 8000],
    icon: '🚌'
  },
  CITY_LARGE: {
    id: 'city_large',
    name: 'Xe buýt lớn',
    category: 'city',
    seats: 28,
    standing: 39,
    priceRange: [5000, 8000],
    icon: '🚌'
  },
  MINI_4_5: {
    id: 'mini_4_5',
    name: 'Xe 4-5 chỗ',
    category: 'city',
    seats: 5,
    priceRange: [5000, 8000],
    icon: '🚖'
  },
  MINI_7: {
    id: 'mini_7',
    name: 'Xe 7 chỗ',
    category: 'city',
    seats: 7,
    priceRange: [5000, 8000],
    icon: '🚐'
  },
  MINI_9: {
    id: 'mini_9',
    name: 'Xe 9 chỗ',
    category: 'city',
    seats: 9,
    priceRange: [5000, 8000],
    icon: '🚐'
  },
  MINI_16: {
    id: 'mini_16',
    name: 'Xe 16 chỗ',
    category: 'city',
    seats: 16,
    priceRange: [5000, 8000],
    icon: '🚌'
  },
  // Coach buses for inter-city (16-35 seats, 30,000 - 35,000 VNĐ)
  COACH_4: {
    id: 'coach_4',
    name: 'Xe 4 chỗ',
    category: 'interCity',
    seats: 4,
    priceRange: [30000, 35000],
    icon: '🚌'
  },
  COACH_7: {
    id: 'coach_7',
    name: 'Xe 7 chỗ',
    category: 'interCity',
    seats: 7,
    priceRange: [30000, 35000],
    icon: '🚌'
  },

  COACH_16: {
    id: 'coach_16',
    name: 'Xe 16 chỗ',
    category: 'interCity',
    seats: 16,
    priceRange: [30000, 35000],
    icon: '🚌'
  },
  COACH_29_35: {
    id: 'coach_29_35',
    name: 'Xe 29-35 chỗ',
    category: 'interCity',
    seats: 35,
    priceRange: [30000, 35000],
    icon: '🚌'
  },
  COACH_SUBURB: {
    id: 'coach_suburb',
    name: 'Xe buýt ngoại ô',
    category: 'interCity',
    seats: 45,
    standing: 50,
    priceRange: [30000, 35000],
    icon: '🚌'
  },
  SLEEPER_36: {
    id: 'sleeper_36',
    name: 'Xe giường nằm',
    category: 'interCity',
    seats: 36,
    priceRange: [200000, 500000],
    icon: '🛏️'
  }
}

// Bus type groups
export const BUS_CATEGORIES = {
  city: {
    id: 'city',
    name: 'Xe nội thành',
    description: 'Di chuyển nội thành Đà Nẵng',
    priceRange: [5000, 8000]
  },
  interCity: {
    id: 'interCity',
    name: 'Xe ngoại thành',
    description: 'Di chuyển ngoại thành',
    priceRange: [30000, 35000]
  }
}

// City destinations (Da Nang transit network)
export const CITY_DESTINATIONS = {
  central: 'Trung tâm thành phố',
  danangAirport: 'Sân bay Đà Nẵng',
  beachAccess: 'Các bãi biển',
  industrialZone: 'Khu công nghiệp',
  residentialAreas: 'Khu dân cư',
  shoppingMalls: 'Các trung tâm thương mại',
  hospitals: 'Các bệnh viện',
  universities: 'Các trường đại học'
}

// Popular city transit stops
export const CITY_STOPS = [
  'Bến xe trung tâm',
  'Sân bay Quốc tế Đà Nẵng',
  'Cầu Rồng',
  'Bãi biển Mỹ Khê',
  'Phố cổ Hội An',
  'Bãi biển Non Nước',
  'Hội An',
  'Khu công nghiệp Hòa Cầm',
  'Đại học Duy Tân',
  'Đại học Kinh tế Đà Nẵng',
  'Cộng Hòa (trung tâm)',
  'Nguyễn Văn Linh',
  'Chu Văn An',
  'Hùng Vương',
  'Phạm Văn Đồng'
]

// Inter-city popular routes (chỉ miền Trung và Bắc Trung Bộ)
export const INTERCITY_ROUTES = [
  { from: 'Đà Nẵng', to: 'Huế', distance: '108 km', category: 'interCity' },
  { from: 'Đà Nẵng', to: 'Quảng Nam', distance: '40 km', category: 'interCity' },
  { from: 'Đà Nẵng', to: 'Quảng Ngãi', distance: '130 km', category: 'interCity' },
  { from: 'Đà Nẵng', to: 'Quảng Bình', distance: '320 km', category: 'interCity' },
  { from: 'Đà Nẵng', to: 'Quảng Trị', distance: '190 km', category: 'interCity' },
  { from: 'Đà Nẵng', to: 'Hà Tĩnh', distance: '430 km', category: 'interCity' },
  { from: 'Đà Nẵng', to: 'Nghệ An', distance: '540 km', category: 'interCity' },
  { from: 'Đà Nẵng', to: 'Thanh Hóa', distance: '680 km', category: 'interCity' }
]

// City transit routes (nội thành)
export const CITY_ROUTES = [
  { from: 'Bến xe trung tâm', to: 'Sân bay Quốc tế Đà Nẵng', distance: '5 km', category: 'city' },
  { from: 'Bến xe trung tâm', to: 'Bãi biển Mỹ Khê', distance: '3 km', category: 'city' },
  { from: 'Cầu Rồng', to: 'Phố cổ Hội An', distance: '30 km', category: 'city' },
  { from: 'Sân bay Quốc tế Đà Nẵng', to: 'Bãi biển Non Nước', distance: '25 km', category: 'city' },
  { from: 'Đại học Duy Tân', to: 'Trung tâm thành phố', distance: '8 km', category: 'city' },
  { from: 'Khu công nghiệp Hòa Cầm', to: 'Bến xe trung tâm', distance: '12 km', category: 'city' },
  { from: 'Đại học Kinh tế Đà Nẵng', to: 'Cộng Hòa (trung tâm)', distance: '6 km', category: 'city' },
  { from: 'Hùng Vương', to: 'Phạm Văn Đồng', distance: '4 km', category: 'city' }
]

// Departure time slots with detailed categorization
export const DEPARTURE_TIMES = {
  early: { id: 'early', label: 'Rất sớm', start: '04:00', end: '06:00' },
  morning_early: { id: 'morning_early', label: 'Sáng sớm', start: '06:00', end: '08:00' },
  morning: { id: 'morning', label: 'Sáng', start: '08:00', end: '10:00' },
  late_morning: { id: 'late_morning', label: 'Sáng muộn', start: '10:00', end: '12:00' },
  early_afternoon: { id: 'early_afternoon', label: 'Trưa sớm', start: '12:00', end: '14:00' },
  afternoon: { id: 'afternoon', label: 'Chiều', start: '14:00', end: '16:00' },
  late_afternoon: { id: 'late_afternoon', label: 'Chiều muộn', start: '16:00', end: '18:00' },
  evening: { id: 'evening', label: 'Tối', start: '18:00', end: '20:00' },
  late_evening: { id: 'late_evening', label: 'Tối muộn', start: '20:00', end: '22:00' },
  night: { id: 'night', label: 'Đêm', start: '22:00', end: '04:00' }
}

// Menu items based on role
export const ROLE_MENU = {
  [USER_ROLES.ADMIN]: [
    { id: 'dashboard', label: 'Bảng điều khiển', icon: 'dashboard', path: '/admin/dashboard' },
    { id: 'users', label: 'Quản lý người dùng', icon: 'users', path: '/admin/users' },
    { id: 'vehicles', label: 'Quản lý đội xe', icon: 'bus', path: '/admin/vehicles' },
    { id: 'routes', label: 'Quản lý tuyến đường', icon: 'route', path: '/admin/routes' },
    { id: 'schedules', label: 'Quản lý lịch trình', icon: 'clock', path: '/admin/schedules' },
    { id: 'reports', label: 'Thống kê & Báo cáo', icon: 'chart', path: '/admin/reports' }
  ],
  [USER_ROLES.DRIVER]: [
    { id: 'cargo', label: 'Xác nhận ký gửi hàng', icon: 'bus', path: '/admin/driver/cargo' },
    { id: 'schedule', label: 'Tiếp nhận lịch trình chạy', icon: 'calendar', path: '/admin/driver/schedule' },
    { id: 'trip-status', label: 'Cập nhật trạng thái hành trình', icon: 'road', path: '/admin/driver/trip-status' }
  ],
  [USER_ROLES.TICKET_STAFF]: [
    { id: 'home', label: 'Soát vé', icon: 'clipboard', path: '/admin/dashboard' },
    { id: 'qr-scan', label: 'Quét mã QR soát vé', icon: 'qrcode', path: '/admin/staff/scan' },
    { id: 'passengers', label: 'Danh sách hành khách', icon: 'users', path: '/admin/staff/passengers' }
  ],
  [USER_ROLES.SUPPORT_STAFF]: [
    { id: 'live-chat', label: 'Hỗ trợ trực tuyến', icon: 'chat', path: '/admin/support/chat' },
    { id: 'ticket-lookup', label: 'Tra cứu vé', icon: 'search', path: '/admin/support/lookup' },
    { id: 'refund', label: 'Xử lý yêu cầu hoàn/hủy', icon: 'undo', path: '/admin/support/refund' }
  ],
  [USER_ROLES.CUSTOMER]: []
}

// HTTP status messages
export const ERROR_MESSAGES = {
  401: 'Hết phiên làm việc, vui lòng đăng nhập lại',
  403: 'Bạn không có quyền truy cập',
  404: 'Không tìm thấy tài nguyên',
  500: 'Lỗi máy chủ, vui lòng thử lại sau',
  INVALID_CREDENTIALS: 'Email/số điện thoại hoặc mật khẩu không đúng',
  NETWORK_ERROR: 'Lỗi kết nối, vui lòng kiểm tra internet'
}
