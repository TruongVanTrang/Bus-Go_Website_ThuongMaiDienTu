// Constants for user roles in BusGo system
export const USER_ROLES = {
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
  DRIVER: 'DRIVER',
  TICKET_STAFF: 'TICKET_STAFF',
  SUPPORT_STAFF: 'SUPPORT_STAFF'
}

// API endpoints
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  ROLE: 'userRole'
}

// Test accounts for development
export const TEST_ACCOUNTS = {
  [USER_ROLES.ADMIN]: {
    email: 'admin@busgo.com',
    phone: '0987654321',
    password: 'admin123',
    name: 'Admin BusGo',
    role: USER_ROLES.ADMIN
  },
  [USER_ROLES.DRIVER]: {
    email: 'driver@busgo.com',
    phone: '0912345678',
    password: 'staff123',
    name: 'Tài xế Nguyễn Văn A',
    role: USER_ROLES.DRIVER
  },
  [USER_ROLES.TICKET_STAFF]: {
    email: 'ticket@busgo.com',
    phone: '0911111111',
    password: 'staff123',
    name: 'Nhân viên soát vé Trần Thị B',
    role: USER_ROLES.TICKET_STAFF
  },
  [USER_ROLES.SUPPORT_STAFF]: {
    email: 'support@busgo.com',
    phone: '0922222222',
    password: 'staff123',
    name: 'Nhân viên hỗ trợ Lê Văn C',
    role: USER_ROLES.SUPPORT_STAFF
  },
  [USER_ROLES.CUSTOMER]: {
    email: 'user@gmail.com',
    phone: '0998765432',
    password: 'user123',
    name: 'Khách hàng',
    role: USER_ROLES.CUSTOMER
  }
}

// Menu items based on role
export const ROLE_MENU = {
  [USER_ROLES.ADMIN]: [
    { id: 'vehicles', label: 'Quản lý đội xe', icon: 'bus', path: '/admin/vehicles' },
    { id: 'routes', label: 'Quản lý tuyến đường', icon: 'route', path: '/admin/routes' },
    { id: 'schedules', label: 'Quản lý lịch trình', icon: 'clock', path: '/admin/schedules' },
    { id: 'users', label: 'Quản lý người dùng', icon: 'users', path: '/admin/users' },
    { id: 'reports', label: 'Thống kê & Báo cáo', icon: 'chart', path: '/admin/reports' }
  ],
  [USER_ROLES.DRIVER]: [
    { id: 'schedule', label: 'Tiếp nhận lịch trình chạy', icon: 'calendar', path: '/admin/driver/schedule' },
    { id: 'trip-status', label: 'Cập nhật trạng thái hành trình', icon: 'road', path: '/admin/driver/trip-status' }
  ],
  [USER_ROLES.TICKET_STAFF]: [
    { id: 'qr-scan', label: 'Quét mã QR soát vé', icon: 'qrcode', path: '/admin/staff/scan' },
    { id: 'passengers', label: 'Danh sách hành khách', icon: 'users', path: '/admin/staff/passengers' }
  ],
  [USER_ROLES.SUPPORT_STAFF]: [
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
