# Ticket Staff API Test Guide

## Prerequisites
- Backend server running on `http://localhost:5000`
- Valid JWT token for authentication (must be from a user with Ticket-Staff role)
- Trip and seat data already in database

## Test Cases

### Test 1: Get Tickets by Trip ID
```bash
curl -X GET "http://localhost:5000/api/staff/tickets?maChuyenXe=1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected**: Returns list of tickets for trip with ID 1

---

### Test 2: Get Tickets by Date
```bash
curl -X GET "http://localhost:5000/api/staff/tickets?ngayDi=2024-01-15" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected**: Returns list of tickets for the specified date

---

### Test 3: Create Offline Ticket (Walk-in Customer)
```bash
curl -X POST "http://localhost:5000/api/staff/tickets/offline" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "maChuyenXe": 1,
    "selectedSeats": ["A1", "A2"],
    "passengerInfo": {
      "firstName": "Tran",
      "lastName": "Van B",
      "email": "tranvanb@example.com",
      "phone": "0912345678"
    },
    "cargoInfo": {
      "type": "none"
    }
  }'
```

**Expected**: 
- Status 201 Created
- Returns booking ID, ticket details, and QR codes for printing

**Example Response**:
```json
{
  "message": "Tạo vé tại quầy thành công",
  "bookingId": "OFFLINE-1234567890",
  "passengerInfo": {...},
  "trip": {...},
  "tickets": [
    {
      "maVe": 123,
      "soGhe": "A1",
      "maQR": "OFFLINE-1234567890-A1",
      "giaVe": 150000,
      "giaHangHoa": 0
    }
  ],
  "totalPrice": 300000
}
```

---

### Test 4: Check-in with QR Code
```bash
curl -X POST "http://localhost:5000/api/staff/tickets/check-in" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "maQR": "OFFLINE-1234567890-A1"
  }'
```

**Expected**:
- Status 200 OK
- Ticket status updated to "da_su_dung"
- Response confirms check-in success

**Example Response**:
```json
{
  "message": "Check-in thành công",
  "ticket": {
    "maVe": 123,
    "hoTenHanhKhach": "Tran Van B",
    "trangThaiMoi": "da_su_dung"
  }
}
```

---

### Test 5: Check-in with Ticket ID
```bash
curl -X POST "http://localhost:5000/api/staff/tickets/check-in" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "maVe": 123
  }'
```

**Expected**: Same as Test 4, check-in successful

---

### Test 6: Process Refund
```bash
curl -X PUT "http://localhost:5000/api/staff/tickets/123/refund" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Khách hàng yêu cầu hủy"
  }'
```

**Expected**:
- Status 200 OK
- Ticket status changed to "da_huy"
- Seat freed up
- Refund amount returned

**Example Response**:
```json
{
  "message": "Xử lý hoàn tiền thành công",
  "refund": {
    "maVe": 123,
    "soTienHoanLai": 150000,
    "lyDo": "Khách hàng yêu cầu hủy"
  }
}
```

---

### Test 7: Error - Check-in Already Used Ticket
```bash
# After test 4, try to check-in again
curl -X POST "http://localhost:5000/api/staff/tickets/check-in" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "maQR": "OFFLINE-1234567890-A1"
  }'
```

**Expected**: 
- Status 400 Bad Request
- Message: "Vé đã được check-in"

---

### Test 8: Error - Refund Without Authentication
```bash
curl -X PUT "http://localhost:5000/api/staff/tickets/123/refund" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Test"
  }'
```

**Expected**:
- Status 401 Unauthorized
- Message: "Không được phép truy cập, không có token"

---

## Testing with Postman

1. **Create Environment Variables**:
   - `base_url`: http://localhost:5000
   - `token`: Your JWT token
   - `trip_id`: 1 (or any valid trip ID)
   - `ticket_id`: The ID from created ticket

2. **Create Collection**:
   - Name: Ticket Staff APIs
   - Import the requests above

3. **Request Examples**:
   ```
   {{base_url}}/api/staff/tickets?maChuyenXe={{trip_id}}
   Authorization Header: Bearer {{token}}
   ```

---

## Database Query to Get Test Data

If you need valid ticket/trip IDs:

```sql
-- Get trip IDs
SELECT TOP 5 maChuyenXe, thoiGianDi FROM ChuyenXe;

-- Get tickets for a trip
SELECT * FROM VeDienTu WHERE maChuyenXe = 1;

-- Get staff users (Ticket-Staff)
SELECT nd.maNguoiDung, nd.tenNguoiDung, nv.vaiTro 
FROM NguoiDung nd
INNER JOIN NhanVien nv ON nd.maNguoiDung = nv.maNhanVien
WHERE nv.vaiTro = 'Ticket-Staff';
```

---

## Common Issues & Solutions

### Issue 1: "Không được phép truy cập, không có token"
- **Solution**: Make sure to include `Authorization: Bearer <token>` header

### Issue 2: "Thiếu thông tin bắt buộc"
- **Solution**: Check all required fields are present in request body

### Issue 3: "Không tìm thấy chuyến xe"
- **Solution**: Verify the trip ID (maChuyenXe) exists in database

### Issue 4: "Ghế đã được đặt"
- **Solution**: Choose a seat that's marked as "trong" (empty) in GheNgoi table

### Issue 5: Server 500 Error
- **Solution**: Check backend logs for detailed error message

---

## Performance Tips

1. When checking in large numbers of passengers, use the `/tickets` endpoint with trip ID
2. Store QR codes in a readable format for easy scanning
3. Cache trip information locally to reduce API calls
4. Implement retry logic for refund operations

---

## Security Considerations

1. Always validate user role before allowing access (should be Ticket-Staff)
2. Never expose sensitive information like payment details
3. Log all refund operations for audit trails
4. Implement rate limiting to prevent abuse
5. Use HTTPS in production
