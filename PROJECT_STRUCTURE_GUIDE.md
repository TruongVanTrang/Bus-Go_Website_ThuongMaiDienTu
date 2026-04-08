# 📁 BusGo Project Structure - Client & Management Separation

## Current Structure Issue
Hiện tại, tất cả components được trộn lẫn lại, khó bảo trì và quản lý quyền hạn

## ✅ Recommended Structure

```
src/
├── App.jsx                           # Root component với routing logic
├── main.jsx
│
├── 📂 auth/                          # Authentication & Authorization
│   ├── LoginPage.jsx                 # Giao diện đăng nhập chung
│   ├── ProtectedRoute.jsx            # HOC bảo vệ route theo role
│   ├── AuthContext.jsx               # Context lưu thông tin user & token
│   └── authUtils.js                  # Hàm kiểm tra token, lưu/xóa token
│
├── 📂 client/                        # CLIENT SIDE - Khách hàng
│   ├── components/
│   │   ├── booking/
│   │   │   ├── BookingSummary.jsx
│   │   │   └── SeatMap.jsx
│   │   ├── chat/
│   │   │   └── ChatBot.jsx
│   │   ├── home/
│   │   │   ├── Features.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   └── Testimonials.jsx
│   │   ├── search/
│   │   │   ├── SearchFilters.jsx
│   │   │   └── TripCard.jsx
│   │   ├── ticket/
│   │   │   └── TicketCard.jsx
│   │   └── layout/
│   │       ├── Header.jsx
│   │       └── Footer.jsx
│   │
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── SearchResultsPage.jsx
│   │   ├── BookingPage.jsx
│   │   ├── PaymentPage.jsx
│   │   ├── ETicketPage.jsx
│   │   └── UserHistory.jsx
│   │
│   └── styles/
│       └── globals.css
│
├── 📂 admin/                         # MANAGEMENT SIDE - Quản lý
│   ├── components/
│   │   ├── Sidebar.jsx               # Menu động theo role
│   │   ├── Topbar.jsx                # Hiển thị user info & logout
│   │   └── shared/
│   │       ├── StatCard.jsx
│   │       └── DataTable.jsx
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx             # Trang chủ admin (chuyển hướng theo role)
│   │   ├── vehicles/
│   │   │   ├── VehicleManagement.jsx
│   │   │   ├── VehicleForm.jsx
│   │   │   └── VehicleList.jsx
│   │   ├── routes/
│   │   │   ├── RouteManagement.jsx
│   │   │   └── ScheduleManagement.jsx
│   │   ├── users/
│   │   │   ├── UserManagement.jsx
│   │   │   └── UserList.jsx
│   │   ├── driver/
│   │   │   ├── DriverSchedule.jsx
│   │   │   └── TripStatus.jsx
│   │   ├── staff/
│   │   │   ├── TicketScan.jsx
│   │   │   ├── TicketScanList.jsx
│   │   │   └── PassengerList.jsx
│   │   ├── support/
│   │   │   ├── TicketLookup.jsx
│   │   │   ├── RefundRequest.jsx
│   │   │   └── CancellationRequest.jsx
│   │   └── reports/
│   │       ├── RevenueReport.jsx
│   │       └── Statistics.jsx
│   │
│   └── styles/
│       └── admin.css
│
├── 📂 services/                      # API Services (dùng chung)
│   ├── apiClient.js                  # Axios instance với token tự động
│   ├── authService.js                # Login, logout, token refresh
│   ├── busService.js                 # API quản lý xe buýt
│   ├── routeService.js               # API quản lý tuyến đường
│   ├── userService.js                # API quản lý người dùng
│   ├── bookingService.js             # API đặt vé
│   └── ticketService.js              # API quản lý vé
│
├── 📂 utils/                         # Utilities (dùng chung)
│   ├── constants.js                  # Hằng số role, status
│   ├── helpers.js                    # Hàm hỗ trợ (format date, currency...)
│   ├── validators.js                 # Hàm kiểm tra form
│   └── storage.js                    # LocalStorage helper
│
├── 📂 styles/                        # Global styles
│   ├── globals.css
│   └── variables.css                 # CSS variables (màu, font...)
│
└── 📂 assets/                        # Images, icons, etc.
    ├── logo/
    ├── icons/
    └── images/
```

---

## 🔐 Lợi ích của cấu trúc này

### 1. **Bảo mật tốt hơn** 🛡️
- **Phân tách riêng biệt**: Client code hoàn toàn tách biệt với Admin code
- **ProtectedRoute**: Ngăn user không có quyền truy cập vào `/admin` routes
- **Token validation**: Mỗi API request đều kèm JWT token tự động
- **Hạn chế XSS**: Admin features không được load vào client bundle

### 2. **Kiểm soát quyền hạn (RBAC)** 👥
```javascript
// Dễ dàng kiểm tra role trước khi render
if (!hasRole('ADMIN', 'DRIVER')) {
  return <Redirect to="/unauthorized" />
}

// Menu hiển thị dựa trên role
const menuItems = ROLE_MENU[userRole]
```

### 3. **Dễ bảo trì & mở rộng** 📦
- Tìm code nhanh hơn (driver features → `admin/pages/driver/`)
- Thêm feature mới không ảnh hưởng đến phần còn lại
- Code organization rõ ràng, dễ onboard developer mới

### 4. **Performance tốt hơn** ⚡
- Code splitting: Admin code riêng, Client code riêng
- Lazy load dashboard theo route
- Giảm bundle size cho end users

### 5. **Testing dễ hơn** ✅
- Unit test, integration test riêng cho từng phần
- Mock API dễ dàng hơn
- E2E test theo flow (customer flow vs admin flow)

---

## 🚀 Migration Steps

1. **Tạo thư mục mới**
   ```bash
   mkdir -p src/auth src/client src/admin src/services src/utils
   ```

2. **Di chuyển files theo hướng dẫn trên**
   - Client components → `src/client/components/`
   - Pages → `src/client/pages/` hoặc `src/admin/pages/`

3. **Cập nhật imports**
   - `import Header from '@/client/components/layout/Header'`
   - Sử dụng path alias (@) để imports sạch

4. **Thiết lập Vite alias** (trong `vite.config.js`)
   ```javascript
   resolve: {
     alias: {
       '@': path.resolve(__dirname, './src'),
     }
   }
   ```

---

## 📋 Role-Based Menu Mapping

| Role | Accessible Routes | Menu Items |
|------|-------------------|-----------|
| **Admin** | `/admin/*` | Xe buýt, Tuyến đường, Người dùng, Báo cáo |
| **Driver** | `/admin/driver` | Tiếp nhận lịch trình, Cập nhật trạng thái |
| **Ticket Staff** | `/admin/staff/scan` | Quét QR, Danh sách hành khách |
| **Support Staff** | `/admin/support` | Tra cứu vé, Xử lý hoàn/hủy |
| **Customer** | `/home`, `/search`, `/booking`, `/payment` | Tìm kiếm, Đặt vé, Lịch sử |

---

## ✨ Lợi ích thêm: Monorepo-ready
Cấu trúc này sẽ dễ dàng chuyển sang Monorepo sau:
- `apps/busgo-client/` (React)
- `apps/busgo-admin/` (React Dashboard)
- `apps/busgo-api/` (Node.js / Rails backend)
- `packages/shared/` (Types, constants, utils)
