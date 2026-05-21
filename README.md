# BusGo - Nền tảng Đặt vé Xe & Ký gửi Hàng hóa

Dự án BusGo là hệ thống hiện đại giúp tìm kiếm, đặt vé xe khách và ký gửi hàng hóa trên toàn quốc. Dự án được thiết kế theo mô hình **Monorepo** bao gồm cả Frontend, Backend và Database.

---

## 🚀 Công nghệ sử dụng
- **Frontend**: React.js (Vite), Bootstrap 5, Tailwind CSS, React Icons, React Router.
- **Backend**: Node.js, Express.js (v5), Nodemailer (gửi OTP/Thông báo), JWT Auth, Bcryptjs.
- **Database**: SQL Server (MSSQL v12 client).

---

## 📁 Cấu trúc thư mục (Monorepo)
```text
BusGo-Project/
├── BusGo-Frontend/  # Giao diện người dùng & dashboard quản lý (React/Vite)
├── backend/         # API Server (Node.js/Express)
├── *.sql            # Các script khởi tạo và cấu trúc database ở thư mục gốc
└── README.md        # Hướng dẫn dự án
```

---

## ✨ Tính năng chính theo vai trò
- **Khách hàng (Customer)**:
  - Đăng ký tài khoản (xác thực OTP qua Gmail), đăng nhập.
  - Tìm kiếm chuyến xe chạy, xem sơ đồ ghế ngồi trực quan.
  - Đặt vé xe trực tuyến.
  - Đăng ký gửi/nhận ký gửi hàng hóa.
  - Xem lịch sử đặt vé, theo dõi trạng thái đơn hàng và cập nhật hồ sơ cá nhân.
- **Nhân viên (Staff)**:
  - Soát vé hành khách (hỗ trợ check-in bằng QR code).
  - Tiếp nhận, phân loại và cập nhật trạng thái đơn ký gửi hàng hóa tại quầy.
- **Tài xế (Driver)**:
  - Xem danh sách chuyến xe được phân công chạy.
  - Xem danh sách hành khách và danh sách hàng hóa vận chuyển trên xe.
  - Cập nhật trạng thái chuyến chạy (`đang khởi hành`, `đã hoàn thành`).
- **Quản trị viên (Admin)**:
  - Quản lý phân quyền tài khoản (Khách hàng, Nhân viên, Tài xế).
  - Lên lịch trình, cấu hình tuyến đường & chuyến xe.
  - Quản lý trạng thái phương tiện (Xe).
  - Báo cáo và thống kê doanh thu bán vé & ký gửi hàng hóa.

---

## 📦 Hướng dẫn cài đặt & Khởi chạy

### 1. Cơ sở dữ liệu (SQL Server)
1. Sử dụng **SQL Server Management Studio (SSMS)** kết nối vào SQL Server cục bộ.
2. Thực thi (Execute) file `BusGo_DB_Updated.sql` để tạo cấu trúc bảng và các Stored Procedure cần thiết.
3. Thực thi file `seed_trips.sql` để tạo sẵn dữ liệu chuyến chạy demo.

### 2. Chạy Backend (Cổng 5000)
1. Truy cập thư mục backend và cài đặt dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Chạy server ở chế độ phát triển (tự động restart khi sửa file):
   ```bash
   npm run dev
   ```

### 3. Chạy Frontend (Cổng 3000)
1. Truy cập thư mục frontend và cài đặt dependencies:
   ```bash
   cd BusGo-Frontend
   npm install
   ```
2. Chạy server dev:
   ```bash
   npm run dev
   ```

---

## 🔌 Danh Sách API Endpoints Chính

### 🔑 1. Xác thực & Tài khoản (Public/Shared)
| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Đăng ký tài khoản khách hàng |
| `POST` | `/api/auth/login` | Public | Đăng nhập (trả về JWT Token & Role) |
| `POST` | `/api/auth/verify-otp` | Public | Xác thực mã OTP gửi về Email khi đăng ký |
| `GET` | `/api/users/profile` | Shared | Lấy thông tin cá nhân hiện tại |
| `PUT` | `/api/users/profile` | Shared | Cập nhật thông tin cá nhân |

### 🚌 2. Cho Khách hàng (Customer)
| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/trips/search` | Public | Tìm kiếm chuyến xe (`diemDi`, `diemDen`, `ngayDi`) |
| `GET` | `/api/trips/:id` | Public | Xem chi tiết chuyến xe và sơ đồ trạng thái ghế |
| `POST` | `/api/bookings` | Customer | Tạo đơn đặt vé mới (giữ ghế tạm thời) |
| `GET` | `/api/bookings/my-tickets`| Customer | Xem lịch sử đặt vé của khách hàng |
| `POST` | `/api/cargo` | Customer | Đăng ký gửi hàng ký gửi mới |
| `GET` | `/api/cargo/my-consignments`| Customer | Xem danh sách đơn ký gửi hàng hóa của tôi |
| `POST` | `/api/feedbacks` | Customer | Gửi đánh giá dịch vụ chuyến xe |

### 💼 3. Cho Nhân viên & Tài xế (Staff/Driver)
| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/staff/bookings/check-in`| Staff | Quét mã QR soát vé khách lên xe |
| `PUT` | `/api/staff/cargo/:id/status` | Staff | Cập nhật trạng thái ký gửi (`confirmed`, `in_transit`, `delivered`) |
| `GET` | `/api/driver/trips` | Driver | Xem danh sách chuyến xe được phân công |
| `PUT` | `/api/driver/trips/:id/status` | Driver | Cập nhật trạng thái chuyến chạy |

### 👑 4. Cho Quản trị viên (Admin)
| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/users` | Admin | Danh sách quản lý người dùng & phân quyền |
| `POST` | `/api/admin/trips` | Admin | Lên lịch chạy chuyến xe mới |
| `POST` | `/api/admin/vehicles` | Admin | Quản lý danh sách & trạng thái phương tiện (Xe) |
| `GET` | `/api/admin/analytics/revenue`| Admin | Thống kê báo cáo doanh thu vé & hàng hóa |

---
**Phát triển bởi**: BusGo Team | **Cập nhật lần cuối**: Tháng 05/2026
