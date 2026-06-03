# Ticket Staff API Documentation (Nhân viên phòng vé)

## Overview
This API provides functionality for ticket counter staff to manage and process bus tickets directly at the counter.

## Base URL
`/api/staff`

## Authentication
All endpoints require JWT authentication token in the header:
```
Authorization: Bearer <token>
```

---

## 1. GET /api/staff/tickets
### View List of Booked Tickets by Trip/Day

**Description**: Get a list of all tickets for a specific trip or date.

**Method**: GET

**Query Parameters**:
- `maChuyenXe` (optional): Trip ID to filter tickets by trip
- `ngayDi` (optional): Date (YYYY-MM-DD) to filter tickets by date
- At least one of these parameters must be provided

**Example Requests**:
```bash
# Get tickets for a specific trip
GET /api/staff/tickets?maChuyenXe=1

# Get tickets for a specific date
GET /api/staff/tickets?ngayDi=2024-01-15

# Get tickets for both trip and date
GET /api/staff/tickets?maChuyenXe=1&ngayDi=2024-01-15
```

**Response** (200 OK):
```json
{
  "tickets": [
    {
      "maVe": 1,
      "hoTenHanhKhach": "Nguyen Van A",
      "email": "nguyenvana@example.com",
      "phone": "0987654321",
      "maQR": "BK1234567890-A1",
      "soGhe": "A1",
      "giaVe": 150000,
      "giaHangHoa": 0,
      "giaThanhToan": 150000,
      "trangThaiVe": "da_thanh_toan",
      "ngayDatVe": "2024-01-10",
      "chuyenXe": {
        "maChuyenXe": 1,
        "diemDi": "Ho Chi Minh",
        "diemDen": "Da Nang",
        "thoiGianDi": "2024-01-15",
        "gioDi": "08:00",
        "gioTra": "16:30"
      },
      "phuongThucThanhToan": "VNPay"
    }
  ],
  "total": 1
}
```

**Error Response** (400):
```json
{
  "message": "Vui lòng cung cấp maChuyenXe hoặc ngayDi"
}
```

---

## 2. POST /api/staff/tickets/check-in
### Check-in Passenger with QR Code Scan

**Description**: Scan QR code on ticket to check-in passenger and update ticket status to "da_su_dung".

**Method**: POST

**Request Body**:
```json
{
  "maQR": "BK1234567890-A1"
}
```

OR

```json
{
  "maVe": 1
}
```

**Example Requests**:
```bash
# Check-in with QR code
curl -X POST http://localhost:5000/api/staff/tickets/check-in \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"maQR": "BK1234567890-A1"}'

# Check-in with ticket ID
curl -X POST http://localhost:5000/api/staff/tickets/check-in \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"maVe": 1}'
```

**Response** (200 OK):
```json
{
  "message": "Check-in thành công",
  "ticket": {
    "maVe": 1,
    "hoTenHanhKhach": "Nguyen Van A",
    "trangThaiMoi": "da_su_dung"
  }
}
```

**Error Responses**:
- 404: Ticket not found
  ```json
  {"message": "Không tìm thấy vé"}
  ```

- 400: Ticket already checked-in
  ```json
  {"message": "Vé đã được check-in"}
  ```

- 400: Ticket cancelled
  ```json
  {"message": "Vé đã bị hủy"}
  ```

---

## 3. POST /api/staff/tickets/offline
### Book and Print Ticket Directly at Counter

**Description**: Create ticket directly at counter for walk-in customers with cash payment.

**Method**: POST

**Request Body**:
```json
{
  "maChuyenXe": 1,
  "selectedSeats": ["A1", "A2"],
  "passengerInfo": {
    "firstName": "Nguyen",
    "lastName": "Van A",
    "email": "nguyenvana@example.com",
    "phone": "0987654321"
  },
  "cargoInfo": {
    "type": "none",
    "description": "",
    "weight": 0,
    "estimatedPrice": 0,
    "receiverName": "",
    "receiverPhone": "",
    "declaredValue": 0,
    "insuranceFee": 0
  }
}
```

**Example Request**:
```bash
curl -X POST http://localhost:5000/api/staff/tickets/offline \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "maChuyenXe": 1,
    "selectedSeats": ["A1"],
    "passengerInfo": {
      "firstName": "Nguyen",
      "lastName": "Van A",
      "email": "nguyenvana@example.com",
      "phone": "0987654321"
    },
    "cargoInfo": {
      "type": "none"
    }
  }'
```

**Response** (201 Created):
```json
{
  "message": "Tạo vé tại quầy thành công",
  "bookingId": "OFFLINE-1234567890",
  "passengerInfo": {
    "firstName": "Nguyen",
    "lastName": "Van A",
    "email": "nguyenvana@example.com",
    "phone": "0987654321"
  },
  "trip": {
    "maChuyenXe": 1,
    "diemDi": "Ho Chi Minh",
    "diemDen": "Da Nang",
    "thoiGianDi": "2024-01-15",
    "gioDi": "08:00",
    "gioTra": "16:30"
  },
  "tickets": [
    {
      "maVe": 1,
      "soGhe": "A1",
      "maQR": "OFFLINE-1234567890-A1",
      "giaVe": 150000,
      "giaHangHoa": 0
    }
  ],
  "totalPrice": 150000
}
```

**Error Responses**:
- 400: Missing required information
  ```json
  {"message": "Thiếu thông tin bắt buộc"}
  ```

- 404: Trip not found
  ```json
  {"message": "Không tìm thấy chuyến xe"}
  ```

- 400: Seat already booked
  ```json
  {"message": "Ghế A1 đã được đặt"}
  ```

---

## 4. PUT /api/staff/tickets/:id/refund
### Process Refund for Ticket Cancellation

**Description**: Handle refund request when customer cancels ticket directly at counter. Frees up the seat and updates ticket status.

**Method**: PUT

**URL Parameters**:
- `id` (required): Ticket ID (maVe)

**Request Body**:
```json
{
  "reason": "Hủy vé tại quầy"
}
```

**Example Request**:
```bash
curl -X PUT http://localhost:5000/api/staff/tickets/1/refund \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Hủy vé tại quầy"}'
```

**Response** (200 OK):
```json
{
  "message": "Xử lý hoàn tiền thành công",
  "refund": {
    "maVe": 1,
    "soTienHoanLai": 150000,
    "lyDo": "Hủy vé tại quầy"
  }
}
```

**Error Responses**:
- 404: Ticket not found
  ```json
  {"message": "Không tìm thấy vé"}
  ```

- 400: Ticket already cancelled
  ```json
  {"message": "Vé đã bị hủy"}
  ```

- 400: Cannot refund used ticket
  ```json
  {"message": "Không thể hoàn tiền vé đã sử dụng"}
  ```

---

## Ticket Status Values

- `cho_thanh_toan`: Waiting for payment
- `da_thanh_toan`: Paid
- `da_su_dung`: Used (checked-in)
- `da_huy`: Cancelled

---

## Integration Notes

1. **Payment Method**: Offline tickets are automatically marked with "Tiền mặt" (Cash) payment method
2. **QR Code**: Each ticket gets a unique QR code for check-in process
3. **Seats**: Seats are automatically reserved when ticket is created and freed when refunded
4. **Transaction Safety**: All operations use database transactions to ensure data consistency

---

## Common Workflows

### Workflow 1: Counter Ticket Sale with Check-in
1. Staff creates ticket at counter using `/offline` endpoint
2. Customer checks in later using `/check-in` endpoint with QR code

### Workflow 2: View and Manage Tickets for a Trip
1. Staff retrieves all tickets for a trip using `/tickets` endpoint
2. Staff can check refund requests for any ticket using `/refund` endpoint

### Workflow 3: Check-in Passenger at Bus Station
1. Staff scans QR code from ticket
2. Staff sends QR code to `/check-in` endpoint
3. System updates ticket status to "da_su_dung"
