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

## 🔌 Danh Sách Phân Công API Endpoints

Dưới đây là danh sách phân chia các API Endpoints cho hệ thống BusGo dựa trên vai trò (Roles) cụ thể. Tài liệu này đã được tách chi tiết để dễ dàng giao việc cho các thành viên trong team.

### 🔑 1. Auth & Shared (API Chung)
Các API cơ bản liên quan đến xác thực và thông tin cá nhân.
* **POST** `/api/auth/register`: Đăng ký tài khoản.
* **POST** `/api/auth/login`: Đăng nhập, cấp JWT Token.
* **POST** `/api/auth/logout`: Đăng xuất (Blacklist token).
* **POST** `/api/auth/forgot-password` & `/api/auth/reset-password`: Quên và đặt lại mật khẩu.
* **GET / PUT** `/api/users/profile`: Xem và cập nhật thông tin cá nhân cơ bản.
* **PUT** `/api/users/change-password`: Đổi mật khẩu tài khoản.
* **POST** `/api/upload/image`: API dùng chung để upload ảnh (avatar, ảnh hàng hóa, v.v.) lên Cloud (như Cloudinary/S3).

### 🚌 2. Customer - Đặt vé (Ticket Booking)
Các tính năng phục vụ cho luồng đặt vé xe khách của người dùng.
* **GET** `/api/trips/search`: Tìm kiếm chuyến xe (điểm đi, điểm đến, ngày đi).
* **GET** `/api/trips/:id`: Chi tiết chuyến xe (hiển thị sơ đồ ghế trống/đã đặt).
* **GET** `/api/routes/popular`: Lấy danh sách tuyến phổ biến (Hiển thị Home).
* **POST** `/api/bookings`: Tạo đơn đặt vé mới (Giữ ghế tạm thời).
* **GET** `/api/bookings/my-tickets`: Xem lịch sử đặt vé của tôi.
* **GET** `/api/bookings/:id`: Chi tiết vé (Hiển thị vé điện tử, mã QR).
* **PUT** `/api/bookings/:id/cancel`: Hủy vé (xử lý logic trước giờ khởi hành).
* **POST** `/api/payments/create`: Tạo URL thanh toán VNPay/Momo.
* **GET** `/api/payments/callback`: Webhook xử lý sau khi thanh toán thành công.
* **POST** `/api/feedbacks`: Đánh giá chất lượng chuyến xe sau khi hoàn thành.
* **GET / POST / DELETE** `/api/watchlist`: Quản lý danh sách chuyến xe yêu thích.

### 📦 3. Customer - Gửi hàng (Cargo/Logistics)
Các tính năng phục vụ riêng cho luồng ký gửi hàng hóa.
* **POST** `/api/cargo`: Tạo đơn ký gửi (chọn loại hàng, khối lượng, tính phí tự động).
* **GET** `/api/cargo/my-consignments`: Lịch sử các đơn ký gửi của tôi.
* **GET** `/api/cargo/track/:consignmentId`: Tra cứu lộ trình, tình trạng kiện hàng theo mã vận đơn.
* **POST** `/api/cargo/payment`: Thanh toán cước phí gửi hàng (nếu thu trước).

### 🎫 4. Ticket-Staff (Nhân viên phòng vé)
Nghiệp vụ trực tiếp tại quầy hoặc trạm xe để soát vé và bán vé.
* **GET** `/api/staff/tickets`: Xem danh sách vé xe đã đặt theo chuyến/ngày.
* **POST** `/api/staff/tickets/check-in`: Quét mã QR trên vé để check-in khách lên xe (Chuyển trạng thái `da_su_dung`).
* **POST** `/api/staff/tickets/offline`: Đặt vé & xuất vé trực tiếp tại quầy cho khách vãng lai (Thu tiền mặt).
* **PUT** `/api/staff/tickets/:id/refund`: Xử lý hoàn tiền khi khách yêu cầu hủy vé trực tiếp tại quầy.

### 🏭 5. Support-Staff (Nhân viên Điều hành & Hỗ trợ trạm)
Nghiệp vụ xử lý hàng hóa, giải đáp thắc mắc và vận hành kho bãi.
* **GET** `/api/staff/cargo/pending`: Danh sách các đơn hàng chờ nhận tại trạm.
* **PUT** `/api/staff/cargo/:id/receive`: Xác nhận nhân viên đã nhận kiện hàng từ khách tại quầy (Trạng thái `received_at_station`).
* **PUT** `/api/staff/cargo/:id/status`: Cập nhật trạng thái (`in_transit` khi đưa lên xe, `delivered` khi giao xong).
* **PUT** `/api/staff/cargo/:id/location`: Cập nhật vị trí kho bãi hiện tại của kiện hàng.
* **GET / PUT** `/api/staff/feedbacks`: Xem và phản hồi các đánh giá của khách hàng.

### 🛞 6. Driver (Tài xế)
Tương tác trực tiếp trên App Tài xế trong quá trình chạy xe.
* **GET** `/api/driver/trips`: Danh sách các chuyến được phân công chạy.
* **GET** `/api/driver/trips/:id/passengers`: Sơ đồ ghế và danh sách khách hàng cần đón theo trạm.
* **GET** `/api/driver/trips/:id/cargo`: Danh sách các kiện hàng đang nằm trên xe cần phải giao.
* **PUT** `/api/driver/trips/:id/status`: Bấm nút cập nhật hành trình (`Bắt đầu chạy`, `Đến trạm nghỉ`, `Hoàn thành chuyến`).
* **PUT** `/api/driver/trips/:id/gps`: Bắn tọa độ định vị GPS định kỳ để khách theo dõi.

### 👑 7. Admin (Quản trị viên)
Nghiệp vụ quản trị toàn diện hệ thống.
* **Người dùng:** `GET`, `PUT` `/api/admin/users` (Xem danh sách, khóa tài khoản).
* **Nhân sự:** `POST` `/api/admin/staff` (Tạo tài khoản phân quyền riêng cho Driver, Ticket-Staff, Support-Staff).
* **Phương tiện:** `POST`, `PUT`, `DELETE` `/api/admin/vehicles` (Quản lý xe 16/35 chỗ, trạng thái bảo trì).
* **Tuyến đường:** `POST`, `PUT`, `DELETE` `/api/admin/routes` (Thiết lập quãng đường, trạm dừng).
* **Chuyến xe:** `POST`, `PUT` `/api/admin/trips` (Lên lịch chuyến, gán tài xế, gán xe).
* **Báo cáo (Dashboard):** 
  * `GET /api/admin/analytics/revenue`: Doanh thu vé + Doanh thu hàng hóa.
  * `GET /api/admin/analytics/routes`: Tỷ lệ lấp đầy tuyến đường.
  * `GET /api/admin/analytics/ratings`: Tổng hợp đánh giá chất lượng tài xế/xe.

---
**Phát triển bởi**: BusGo Team | **Cập nhật lần cuối**: Tháng 05/2026
