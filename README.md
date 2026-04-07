# BusGo Frontend - Nền tảng Tìm kiếm và Đặt vé Xe Bus

## 📋 Mô tả dự án

BusGo là một nền tảng hiện đại để tìm kiếm và đặt vé xe bus/xe khách trên toàn miền Trung. Ứng dụng được xây dựng với React.js, Bootstrap 5 và Tailwind CSS, áp dụng phong cách "Chức năng chi phối" (Functional-Driven Design).

## ✨ Tính năng chính

- ✅ **Tìm kiếm vé** - Giao diện tìm kiếm tối giản và hiện đại
- ✅ **Lọc kết quả** - Bộ lọc chi tiết theo giá, loại xe, tiện nghi, giờ khởi hành
- ✅ **So sánh chuyến** - So sánh dễ dàng giữa các chuyến xe
- ✅ **Chọn ghế** - Sơ đồ ghế động với hỗ trợ nhiều loại xe (4, 16, 35 chỗ)
- ✅ **Đặt chỗ** - Quy trình đặt chỗ đơn giản chỉ 3 bước
- ✅ **Vé điện tử** - Sinh mã QR Code định danh cho vé
- ✅ **Responsive Design** - Hoàn hảo trên máy tính, tablet và điện thoại

## 🚀 Công nghệ sử dụng

- **Frontend Framework**: React 18.2
- **Routing**: React Router DOM 6
- **CSS Framework**: Bootstrap 5
- **Styling**: Tailwind CSS 3
- **Build Tool**: Vite 4
- **QR Code**: qrcode.react
- **Icons**: React Icons
- **HTTP Client**: Axios

## 📦 Cài đặt và chạy ứng dụng

### 1. Yêu cầu hệ thống
- Node.js >= 16.0.0
- npm >= 8.0.0 hoặc yarn >= 3.0.0

### 2. Cài đặt dependencies

```bash
npm install
# hoặc
yarn install
```

### 3. Chạy ứng dụng ở chế độ development

```bash
npm run dev
# hoặc
yarn dev
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

### 4. Build cho production

```bash
npm run build
# hoặc
yarn build
```

Các file build sẽ có trong thư mục `dist/`

### 5. Preview production build

```bash
npm run preview
# hoặc
yarn preview
```

## 📁 Cấu trúc thư mục

```
BusGo-Frontend/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   └── Footer.jsx
│   │   ├── home/
│   │   │   ├── SearchBar.jsx
│   │   │   ├── Features.jsx
│   │   │   └── Testimonials.jsx
│   │   ├── search/
│   │   │   ├── TripCard.jsx
│   │   │   └── SearchFilters.jsx
│   │   ├── booking/
│   │   │   ├── SeatMap.jsx
│   │   │   └── BookingSummary.jsx
│   │   └── ticket/
│   │       └── TicketCard.jsx
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── SearchResultsPage.jsx
│   │   ├── BookingPage.jsx
│   │   └── ETicketPage.jsx
│   ├── styles/
│   │   └── globals.css
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── .gitignore
```

## 🎨 CSS Variables (Brand Styling)

Tất cả màu sắc, khoảng cách, và hiệu ứng đều được quản lý thông qua CSS variables:

```css
/* Primary Colors */
--color-primary-600: #0284c7
--color-primary-700: #0369a1

/* Secondary Colors */
--color-secondary-600: #d97706

/* Status Colors */
--color-success-500: #22c55e
--color-danger-500: #ef4444
--color-warning-500: #f59e0b
```

Xem `src/styles/globals.css` để cấu hình chi tiết.

## 📄 Các trang chính

### 1. Trang chủ (`/`)
- Hero section với thanh tìm kiếm nổi bật
- Danh sách tính năng chính
- Đánh giá từ khách hàng

### 2. Trang kết quả tìm kiếm (`/search`)
- Hiển thị danh sách chuyến xe
- Bộ lọc bên trái (giá, loại xe, tiện nghi, giờ khởi hành)
- Thẻ thông tin chi tiết cho mỗi chuyến

### 3. Trang đặt chỗ (`/booking/:tripId`)
- Sơ đồ ghế ngồi động
- Form nhập thông tin hành khách
- Tóm tắt giá và ghế đã chọn

### 4. Trang vé điện tử (`/ticket/:bookingId`)
- Hiển thị vé đã đặt
- QR Code định danh
- Nút tải, in và chia sẻ

## ⚡ Tối ưu hiệu suất

- ✅ Sử dụng Vite để build nhanh
- ✅ Code splitting tự động
- ✅ Lazy loading cho components
- ✅ CSS variables cho reusability
- ✅ Responsive design tối ưu
- ✅ Thời gian phản hồi < 3 giây

## 🔐 Bảo mật

- Input validation trên tất cả form
- HTTPS ready
- Không lưu dữ liệu nhạy cảm trên localStorage

## 📱 Responsive Design

- ✅ Desktop (≥ 1200px)
- ✅ Tablet (768px - 1199px)
- ✅ Mobile (< 768px)

## 🐛 Phát triển và Debug

### Logs
Kiểm tra browser console để xem các thông báo debug

### React DevTools
Cài đặt [React DevTools](https://react-devtools-tutorial.vercel.app/) để debug React components

## 📚 API Integration

Tất cả các dữ liệu hiện tại là mock data. Để tích hợp API thực:

1. Tạo file `src/services/api.js`
2. Sử dụng Axios để gọi API
3. Thay thế mock data bằng API calls

Ví dụ:
```javascript
// src/services/api.js
import axios from 'axios'

const API_BASE_URL = 'https://api.busgo.vn'

export const searchTrips = (params) => {
  return axios.get(`${API_BASE_URL}/trips/search`, { params })
}
```

## 🤝 Đóng góp

Vui lòng tuân theo các tiêu chuẩn:
- Mã sạch, dễ đọc
- Một feature = một branch
- Tạo Pull Request để review

## 📄 Giấy phép

MIT License - Tự do sử dụng và phân phối

## 📞 Hỗ trợ

- 📧 Email: support@busgo.vn
- 📱 Hotline: 1900 123 456
- 🌐 Website: https://busgo.vn

## 📝 Ghi chú

### Phiên bản hiện tại: 1.0.0

**Tính năng sắp tới:**
- Thanh toán trực tuyến
- Lịch sử đặt vé
- Theo dõi chuyến xe real-time
- Chat hỗ trợ khách hàng
- Đánh giá và nhận xét chuyến

---

**Phát triển bởi:** BusGo Development Team  
**Cập nhật lần cuối:** January 2024
