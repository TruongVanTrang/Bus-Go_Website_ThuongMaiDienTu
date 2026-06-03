# Frontend Integration Guide - Ticket Staff APIs

## Service Integration Example

Create a new service file: `src/services/ticketStaffService.js`

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/staff';

// Get token from localStorage or auth context
const getToken = () => localStorage.getItem('token');

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add token to requests
axiosInstance.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const ticketStaffService = {
  // Get tickets by trip or date
  getTickets: async (filters) => {
    const params = new URLSearchParams();
    if (filters.maChuyenXe) params.append('maChuyenXe', filters.maChuyenXe);
    if (filters.ngayDi) params.append('ngayDi', filters.ngayDi);
    
    const response = await axiosInstance.get(`/tickets?${params.toString()}`);
    return response.data;
  },

  // Check-in ticket with QR code
  checkInTicket: async (maQR) => {
    const response = await axiosInstance.post('/tickets/check-in', {
      maQR: maQR
    });
    return response.data;
  },

  // Check-in ticket with ID
  checkInTicketById: async (maVe) => {
    const response = await axiosInstance.post('/tickets/check-in', {
      maVe: maVe
    });
    return response.data;
  },

  // Create offline ticket (walk-in customer)
  createOfflineTicket: async (ticketData) => {
    const response = await axiosInstance.post('/tickets/offline', ticketData);
    return response.data;
  },

  // Process refund
  refundTicket: async (maVe, reason) => {
    const response = await axiosInstance.put(`/tickets/${maVe}/refund`, {
      reason: reason
    });
    return response.data;
  }
};

export default ticketStaffService;
```

---

## Component Examples

### 1. Ticket List Component

```jsx
import { useState, useEffect } from 'react';
import ticketStaffService from '../services/ticketStaffService';

export function TicketListPage() {
  const [tickets, setTickets] = useState([]);
  const [filters, setFilters] = useState({
    maChuyenXe: '',
    ngayDi: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!filters.maChuyenXe && !filters.ngayDi) {
      setError('Vui lòng chọn chuyến xe hoặc ngày');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await ticketStaffService.getTickets(filters);
      setTickets(data.tickets);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải vé');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ticket-list-container">
      <h2>Danh Sách Vé</h2>
      
      <div className="filters">
        <input
          type="number"
          placeholder="Mã chuyến xe"
          value={filters.maChuyenXe}
          onChange={(e) => setFilters({...filters, maChuyenXe: e.target.value})}
        />
        <input
          type="date"
          value={filters.ngayDi}
          onChange={(e) => setFilters({...filters, ngayDi: e.target.value})}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Đang tải...' : 'Tìm kiếm'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <table>
        <thead>
          <tr>
            <th>ID Vé</th>
            <th>Hành khách</th>
            <th>Ghế</th>
            <th>Trạng thái</th>
            <th>Giá</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map(ticket => (
            <tr key={ticket.maVe}>
              <td>{ticket.maVe}</td>
              <td>{ticket.hoTenHanhKhach}</td>
              <td>{ticket.soGhe}</td>
              <td>{ticket.trangThaiVe}</td>
              <td>{ticket.giaThanhToan.toLocaleString()} VNĐ</td>
              <td>
                <button onClick={() => handleCheckIn(ticket.maQR)}>Check-in</button>
                {ticket.trangThaiVe === 'da_thanh_toan' && (
                  <button onClick={() => handleRefund(ticket.maVe)}>Hủy</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  async function handleCheckIn(maQR) {
    try {
      const result = await ticketStaffService.checkInTicket(maQR);
      alert('Check-in thành công: ' + result.ticket.hoTenHanhKhach);
      handleSearch(); // Refresh list
    } catch (err) {
      alert('Lỗi: ' + err.response?.data?.message);
    }
  }

  async function handleRefund(maVe) {
    const reason = prompt('Lý do hủy:');
    if (!reason) return;

    try {
      await ticketStaffService.refundTicket(maVe, reason);
      alert('Hoàn tiền thành công');
      handleSearch(); // Refresh list
    } catch (err) {
      alert('Lỗi: ' + err.response?.data?.message);
    }
  }
}
```

### 2. Offline Ticket Creation Component

```jsx
import { useState } from 'react';
import ticketStaffService from '../services/ticketStaffService';

export function CreateOfflineTicketPage() {
  const [formData, setFormData] = useState({
    maChuyenXe: '',
    selectedSeats: [],
    passengerInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    },
    cargoInfo: {
      type: 'none'
    }
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.maChuyenXe || formData.selectedSeats.length === 0) {
      alert('Vui lòng chọn chuyến xe và ghế');
      return;
    }

    setLoading(true);
    
    try {
      const data = await ticketStaffService.createOfflineTicket(formData);
      setResult(data);
      alert('Tạo vé thành công!');
    } catch (err) {
      alert('Lỗi: ' + err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-ticket-container">
      <h2>Đặt Vé Tại Quầy</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Mã chuyến xe:</label>
          <input
            type="number"
            required
            value={formData.maChuyenXe}
            onChange={(e) => setFormData({
              ...formData,
              maChuyenXe: e.target.value
            })}
          />
        </div>

        <div className="form-group">
          <label>Ghế (cách nhau bằng dấu phẩy):</label>
          <input
            type="text"
            placeholder="Ví dụ: A1, A2, B1"
            required
            onChange={(e) => setFormData({
              ...formData,
              selectedSeats: e.target.value.split(',').map(s => s.trim())
            })}
          />
        </div>

        <div className="form-group">
          <label>Tên hành khách:</label>
          <input
            type="text"
            required
            value={formData.passengerInfo.firstName}
            onChange={(e) => setFormData({
              ...formData,
              passengerInfo: {
                ...formData.passengerInfo,
                firstName: e.target.value
              }
            })}
          />
        </div>

        <div className="form-group">
          <label>Họ:</label>
          <input
            type="text"
            required
            value={formData.passengerInfo.lastName}
            onChange={(e) => setFormData({
              ...formData,
              passengerInfo: {
                ...formData.passengerInfo,
                lastName: e.target.value
              }
            })}
          />
        </div>

        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={formData.passengerInfo.email}
            onChange={(e) => setFormData({
              ...formData,
              passengerInfo: {
                ...formData.passengerInfo,
                email: e.target.value
              }
            })}
          />
        </div>

        <div className="form-group">
          <label>Số điện thoại:</label>
          <input
            type="tel"
            required
            value={formData.passengerInfo.phone}
            onChange={(e) => setFormData({
              ...formData,
              passengerInfo: {
                ...formData.passengerInfo,
                phone: e.target.value
              }
            })}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Đang tạo...' : 'Tạo Vé'}
        </button>
      </form>

      {result && (
        <div className="result">
          <h3>Vé Đã Tạo Thành Công</h3>
          <p><strong>ID đặt vé:</strong> {result.bookingId}</p>
          <p><strong>Tổng tiền:</strong> {result.totalPrice.toLocaleString()} VNĐ</p>
          
          <h4>Chi tiết vé:</h4>
          {result.tickets.map(ticket => (
            <div key={ticket.maVe} className="ticket-detail">
              <p>Ghế: {ticket.soGhe}</p>
              <p>QR Code: {ticket.maQR}</p>
              <p>Giá: {ticket.giaVe.toLocaleString()} VNĐ</p>
            </div>
          ))}

          <button onClick={() => window.print()}>In Vé</button>
        </div>
      )}
    </div>
  );
}
```

### 3. QR Code Scanner Component

```jsx
import { useState } from 'react';
import ticketStaffService from '../services/ticketStaffService';

export function QRScannerPage() {
  const [qrCode, setQrCode] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleScan = async (e) => {
    if (e.key !== 'Enter') return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await ticketStaffService.checkInTicket(qrCode);
      setResult(data);
      setQrCode('');
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi check-in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="qr-scanner-container">
      <h2>Check-in Bằng QR Code</h2>
      
      <input
        type="text"
        placeholder="Quét QR code tại đây..."
        autoFocus
        value={qrCode}
        onChange={(e) => setQrCode(e.target.value)}
        onKeyPress={handleScan}
        className="qr-input"
      />

      {loading && <p className="loading">Đang xử lý...</p>}
      
      {error && <div className="error">{error}</div>}
      
      {result && (
        <div className="success">
          <h3>✓ Check-in Thành Công</h3>
          <p><strong>Hành khách:</strong> {result.ticket.hoTenHanhKhach}</p>
          <p><strong>ID vé:</strong> {result.ticket.maVe}</p>
          <p><strong>Trạng thái:</strong> {result.ticket.trangThaiMoi}</p>
        </div>
      )}
    </div>
  );
}
```

---

## Styling Example

```css
.ticket-list-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.filters {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.filters input,
.filters button {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.filters button {
  background-color: #007bff;
  color: white;
  cursor: pointer;
  border: none;
}

.filters button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

table th,
table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

table th {
  background-color: #f5f5f5;
  font-weight: bold;
}

.error {
  background-color: #f8d7da;
  color: #721c24;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.success {
  background-color: #d4edda;
  color: #155724;
  padding: 12px;
  border-radius: 4px;
  margin-top: 20px;
}
```

---

## Error Handling Best Practices

```javascript
const handleError = (error) => {
  if (error.response) {
    // Server responded with error status
    switch (error.response.status) {
      case 400:
        return 'Dữ liệu không hợp lệ: ' + error.response.data.message;
      case 401:
        return 'Vui lòng đăng nhập lại';
      case 404:
        return 'Không tìm thấy: ' + error.response.data.message;
      case 500:
        return 'Lỗi server: ' + error.response.data.message;
      default:
        return error.response.data.message || 'Có lỗi xảy ra';
    }
  } else if (error.request) {
    // Request was made but no response
    return 'Không thể kết nối đến server';
  } else {
    // Something else
    return 'Có lỗi xảy ra: ' + error.message;
  }
};
```

---

## Testing Components

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketListPage } from './TicketListPage';
import * as ticketService from '../services/ticketStaffService';

jest.mock('../services/ticketStaffService');

describe('TicketListPage', () => {
  it('should display tickets after search', async () => {
    const mockTickets = {
      tickets: [
        { maVe: 1, hoTenHanhKhach: 'John Doe', soGhe: 'A1' }
      ],
      total: 1
    };

    ticketService.getTickets.mockResolvedValue(mockTickets);

    render(<TicketListPage />);

    const input = screen.getByPlaceholderText(/mã chuyến xe/i);
    await userEvent.type(input, '1');

    const button = screen.getByText('Tìm kiếm');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
});
```

---

## Production Deployment Notes

1. Update API_BASE_URL based on environment
2. Implement proper error logging
3. Add loading states and spinners
4. Cache trip data locally for better performance
5. Implement offline support for critical operations
6. Add analytics for ticket operations
7. Implement role-based UI (hide/show features based on user role)
8. Add print-friendly styles for ticket receipts
