# BusGo - Nền tảng Đặt vé Xe & Ký gửi Hàng hóa

Dự án BusGo là hệ thống hiện đại giúp tìm kiếm, đặt vé xe khách và ký gửi hàng hóa trên toàn quốc. Dự án được thiết kế theo mô hình **Monorepo** bao gồm cả Frontend, Backend và Database.

## 🚀 Công nghệ sử dụng
- **Frontend**: React.js 18, Vite, Bootstrap 5, Tailwind CSS.
- **Backend**: Node.js, Express.js, JWT Auth, Bcryptjs.
- **Database**: SQL Server (MSSQL).

## 📁 Cấu trúc thư mục (Monorepo)
```text
BusGo-Project/
├── frontend/       # Giao diện người dùng (React/Vite)
├── backend/        # API Server (Node.js/Express)
└── database/       # Chứa script khởi tạo CSDL (SQL Server)
```

## ✨ Tính năng chính
- **Khách hàng**: Đăng ký/Đăng nhập, Tìm vé, Đặt chỗ sơ đồ ghế, Ký gửi hàng hóa, Lịch sử giao dịch, Quản lý tài khoản.
- **Nhân viên / Admin**: Thống kê, Quản lý chuyến xe, Quản lý đơn hàng/ký gửi.
- **Bảo mật**: Xác thực bằng JWT, phân quyền theo Role, mã hóa mật khẩu.

## 📦 Hướng dẫn cài đặt & Khởi chạy

### 1. Database (SQL Server)
1. Mở file `database/BusGo_DB_Updated.sql` bằng SQL Server Management Studio (SSMS).
2. Thực thi (Execute) toàn bộ script để tạo database `BusGoDBs` và dữ liệu mẫu.

### 2. Chạy Backend (Cổng 5000)
```bash
cd backend
npm install
# Cập nhật thông tin DB_USER, DB_PASSWORD trong file .env nếu cần
node server.js
```

### 3. Chạy Frontend (Cổng 3000/5173)
```bash
cd frontend
npm install
npm run dev
```

## 🔐 Tài khoản Test Mặc định
- **Admin**: `admin@busgo.vn` / `secure_hash` (Hoặc theo cấu hình DB)
- **Khách hàng**: `customer@busgo.vn` / `secure_hash`

---
**Phát triển bởi**: BusGo Team | **Cập nhật lần cuối**: Tháng 05/2026
