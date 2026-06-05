const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8');

const target1 = `    const statusMap = {
      'pending': { ...baseStyle, backgroundColor: '#f59e0b', text: 'Chờ xác nhận', icon: FiClock },
      'confirmed': { ...baseStyle, backgroundColor: '#3b82f6', text: 'Đã xác nhận', icon: FiCheckSquare },
      'in_transit': { ...baseStyle, backgroundColor: '#8b5cf6', text: 'Đang vận chuyển', icon: FiTruck },
      'delivered': { ...baseStyle, backgroundColor: '#10b981', text: 'Đã giao', icon: FiCheckCircle }
    }`;

const replacement1 = `    const statusMap = {
      'pending': { ...baseStyle, backgroundColor: '#f59e0b', text: 'Chờ xác nhận', icon: FiClock },
      'confirmed': { ...baseStyle, backgroundColor: '#3b82f6', text: 'Đã xác nhận', icon: FiCheckSquare },
      'in_transit': { ...baseStyle, backgroundColor: '#8b5cf6', text: 'Đang vận chuyển', icon: FiTruck },
      'delivered': { ...baseStyle, backgroundColor: '#10b981', text: 'Đã giao', icon: FiCheckCircle },
      'cancelled': { ...baseStyle, backgroundColor: '#ef4444', text: 'Đã hủy', icon: FiX }
    }`;

content = content.replace(target1, replacement1);
fs.writeFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', content, 'utf8');
console.log('Fixed status mapping to cancelled');
