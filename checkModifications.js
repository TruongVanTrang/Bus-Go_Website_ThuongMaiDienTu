const fs = require('fs');
const content = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8');
console.log('Has cancelled in statusMap?', content.includes("'cancelled': { ...baseStyle, backgroundColor: '#ef4444', text: 'Đã hủy', icon: FiX }"));
console.log('Has Đặt lại button?', content.includes('Đặt lại'));
console.log('Has FiRefreshCw import?', content.includes('FiRefreshCw'));
