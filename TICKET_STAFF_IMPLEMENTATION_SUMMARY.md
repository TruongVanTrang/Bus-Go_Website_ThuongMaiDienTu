# Ticket Staff Functions Implementation Summary

## Overview
Implemented 4 new API endpoints for ticket counter staff to manage bus ticket operations at the counter.

## Implementation Details

### Files Modified
1. **backend/controllers/staffController.js** - Added 4 new functions
2. **backend/routes/staffRoutes.js** - Added 4 new routes
3. **backend/server.js** - Already has staff routes configured

### Helper Functions Added
- `formatDate()`: Convert date to YYYY-MM-DD format
- `formatTime()`: Convert time to HH:mm format

---

## Implemented Endpoints

### 1. GET /api/staff/tickets
**Purpose**: View list of booked tickets by trip or date

**Controller Function**: `getTicketsList()`

**Features**:
- Filter tickets by trip ID (maChuyenXe) or date (ngayDi)
- Returns complete ticket information with trip details
- Includes passenger info, payment method, seat number, and QR code
- At least one filter parameter is required

**Database Query**:
- Joins VeDienTu, ChuyenXe, TuyenDuong, GheNgoi, and PhuongThucThanhToan tables
- Filters by trip or date as specified

---

### 2. POST /api/staff/tickets/check-in
**Purpose**: Check-in passenger by scanning QR code or using ticket ID

**Controller Function**: `checkInTicket()`

**Features**:
- Accepts either QR code (maQR) or ticket ID (maVe)
- Validates ticket exists and is not already checked-in
- Updates ticket status from "da_thanh_toan" to "da_su_dung"
- Prevents double check-in and cancelled ticket check-in
- Returns confirmation with passenger name

**Status Transitions**:
- Valid states for check-in: "da_thanh_toan", "da_dat"
- Final state: "da_su_dung"

---

### 3. POST /api/staff/tickets/offline
**Purpose**: Create and print ticket directly at counter for walk-in customers

**Controller Function**: `createOfflineTicket()`

**Features**:
- Creates tickets for walk-in customers without online booking
- Supports multiple seats in one transaction
- Automatically uses "Tiền mặt" (Cash) payment method
- Generates unique offline booking ID (OFFLINE-timestamp)
- Supports optional cargo information
- Automatically assigns seats if they don't exist
- Uses database transaction for consistency

**Ticket Status**: "da_thanh_toan" (immediately marked as paid since cash is received)

**Response Includes**:
- Booking ID for reference
- All created tickets with QR codes
- Trip information for printing
- Total price for payment confirmation

---

### 4. PUT /api/staff/tickets/:id/refund
**Purpose**: Process refund when customer cancels ticket at counter

**Controller Function**: `refundTicket()`

**Features**:
- Updates ticket status to "da_huy" (cancelled)
- Frees up the seat in GheNgoi table (status = "trong")
- Records refund reason
- Validates ticket state before refunding
- Prevents refunding already used tickets
- Uses database transaction for consistency

**Ticket State Validation**:
- Cannot refund if already "da_huy"
- Cannot refund if already "da_su_dung" (used)
- Can refund from "da_thanh_toan" or "da_dat"

---

## Data Models

### Ticket Status Values
```
- cho_thanh_toan: Waiting for payment
- da_thanh_toan: Paid
- da_su_dung: Used (checked-in)
- da_huy: Cancelled
```

### Seat Status Values
```
- trong: Empty/Available
- da_dat: Booked
```

---

## Authentication & Authorization

All endpoints require:
- **Authentication**: JWT token in Authorization header
- **Header**: `Authorization: Bearer <token>`
- **Middleware**: `protect` middleware validates token

Note: Currently, any authenticated user can access these endpoints. Consider adding role-based access control (RBAC) for Ticket-Staff role specifically if needed.

---

## Transaction Safety

Critical operations use database transactions:
1. **createOfflineTicket**: Transaction ensures all seats are reserved or operation is rolled back
2. **refundTicket**: Transaction ensures ticket and seat are updated consistently

Benefits:
- Data consistency
- Prevents race conditions
- Atomic operations (all or nothing)

---

## API Response Format

### Success Responses
```json
{
  "message": "Operation successful message",
  "data": {}
}
```

### Error Responses
- 400: Bad Request - Missing or invalid data
- 401: Unauthorized - No token or invalid token
- 404: Not Found - Ticket or trip not found
- 500: Server Error - Database or system error

---

## Query Parameters

### GET /api/staff/tickets
```
?maChuyenXe=1          // Filter by trip ID
?ngayDi=2024-01-15     // Filter by date (YYYY-MM-DD)
?maChuyenXe=1&ngayDi=2024-01-15  // Filter by both
```

---

## Request/Response Examples

### Create Offline Ticket
**Request**:
```json
{
  "maChuyenXe": 1,
  "selectedSeats": ["A1", "A2"],
  "passengerInfo": {
    "firstName": "Nguyen",
    "lastName": "Van A",
    "email": "email@example.com",
    "phone": "0987654321"
  },
  "cargoInfo": {
    "type": "none"
  }
}
```

**Response**:
```json
{
  "message": "Tạo vé tại quầy thành công",
  "bookingId": "OFFLINE-1234567890",
  "passengerInfo": {...},
  "trip": {...},
  "tickets": [...],
  "totalPrice": 300000
}
```

---

## Integration Points

1. **With Booking Controller**: Uses similar ticket creation logic but optimized for counter
2. **With Payment**: Assumes cash payment - no payment processing needed
3. **With Email Service**: Could be extended to send confirmation emails
4. **With QR Code**: Uses simple string-based QR codes (can be enhanced with QR library)

---

## Potential Enhancements

1. **Role-Based Access Control (RBAC)**
   - Add check for "Ticket-Staff" role
   - Restrict access based on user role

2. **Receipt Generation**
   - Generate PDF receipts for counter sales
   - Include trip details, seats, price, and payment confirmation

3. **Offline Mode Support**
   - Store tickets locally if database is unavailable
   - Sync when connection restored

4. **Real QR Code Generation**
   - Generate actual QR code images
   - Encode ticket information in QR

5. **Staff Performance Tracking**
   - Log who created/refunded each ticket
   - Track staff productivity metrics

6. **Refund Policy Implementation**
   - Different refund amounts based on cancellation time
   - Apply refund policies automatically

7. **Payment Methods at Counter**
   - Support multiple payment methods (card, mobile wallet, etc.)
   - Replace hardcoded cash payment

8. **Cargo Integration**
   - Full cargo validation and pricing
   - Weight-based pricing calculations

---

## Testing

See `TICKET_STAFF_API_TEST_GUIDE.md` for:
- Test cases for each endpoint
- cURL examples
- Postman setup instructions
- Common issues and solutions

---

## Files Documentation

### staffController.js (updated)
- Added helper functions: formatDate, formatTime
- Added 4 new controller functions
- Maintains existing staff creation/management functions

### staffRoutes.js (updated)
- Added 4 new routes
- All routes protected with JWT authentication
- Follows RESTful conventions

---

## Database Transactions

The implementation uses SQL transactions for:
1. Creating offline tickets (locks rows during creation)
2. Processing refunds (ensures atomic seat and ticket updates)

Benefits:
- Prevents race conditions
- Ensures data consistency
- Atomic operations (fail completely or succeed completely)

---

## Performance Considerations

1. **Query Optimization**: Uses single query to fetch all ticket details
2. **Transaction Scope**: Minimal transaction scope to reduce lock time
3. **Database Indexes**: Recommend indexes on:
   - VeDienTu(maChuyenXe, ngayDatVe)
   - VeDienTu(maQR)
   - GheNgoi(maChuyenXe, trangThaiGhe)

---

## Security Considerations

1. **Authentication**: All endpoints require JWT token
2. **Input Validation**: Validates all user inputs
3. **SQL Injection**: Uses parameterized queries
4. **Authorization**: Currently uses basic authentication (consider adding role check)
5. **Error Messages**: Doesn't leak sensitive database information

---

## Deployment Checklist

- [ ] Verify database tables exist (VeDienTu, GheNgoi, etc.)
- [ ] Test with valid JWT tokens
- [ ] Verify payment method "Tiền mặt" exists in database
- [ ] Test transaction rollback scenarios
- [ ] Validate date format handling (UTC vs local)
- [ ] Check database connection pooling
- [ ] Monitor performance with production data volume
- [ ] Set up error logging and monitoring
- [ ] Create backup/recovery procedures for refunds

