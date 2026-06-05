const fs = require('fs');

// 1. Fix UserHistory.jsx
let userHistory = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8');
const searchMap = `  const statusMap = {
    'pending': { ...baseStyle, backgroundColor: '#f59e0b', text: 'Chờ xác nhận', icon: FiClock },
    'confirmed': { ...baseStyle, backgroundColor: '#3b82f6', text: 'Đã xác nhận', icon: FiCheckSquare },
    'in_transit': { ...baseStyle, backgroundColor: '#8b5cf6', text: 'Đang vận chuyển', icon: FiTruck },
    'delivered': { ...baseStyle, backgroundColor: '#10b981', text: 'Đã giao', icon: FiCheckCircle }
  }`;

const replaceMap = `  const statusMap = {
    'pending': { ...baseStyle, backgroundColor: '#f59e0b', text: 'Chờ xác nhận', icon: FiClock },
    'dang_tim_xe_trong': { ...baseStyle, backgroundColor: '#3b82f6', text: 'Chờ phân xe', icon: FiClock },
    'dang_cho_xac_nhan': { ...baseStyle, backgroundColor: '#f59e0b', text: 'Chờ tài xế duyệt', icon: FiClock },
    'da_xac_nhan': { ...baseStyle, backgroundColor: '#3b82f6', text: 'Đã xác nhận', icon: FiCheckSquare },
    'confirmed': { ...baseStyle, backgroundColor: '#3b82f6', text: 'Đã xác nhận', icon: FiCheckSquare },
    'in_transit': { ...baseStyle, backgroundColor: '#8b5cf6', text: 'Đang vận chuyển', icon: FiTruck },
    'delivered': { ...baseStyle, backgroundColor: '#10b981', text: 'Đã giao', icon: FiCheckCircle },
    'da_huy': { ...baseStyle, backgroundColor: '#ef4444', text: 'Đã hủy', icon: FiXCircle },
    'failed': { ...baseStyle, backgroundColor: '#ef4444', text: 'Đã hủy', icon: FiXCircle }
  }`;

userHistory = userHistory.replace(searchMap, replaceMap);
fs.writeFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', userHistory, 'utf8');
console.log('Fixed UserHistory.jsx');

// 2. Fix cargoController.js getDriverConsignments
let cargoCtrl = fs.readFileSync('backend/controllers/cargoController.js', 'utf8');

const searchDriverRecords = `    const records = result.recordset.map(r => {
      try {
        r.hinhAnh = JSON.parse(r.hinhAnh || '[]');
      } catch (e) {
        r.hinhAnh = [];
      }
      return r;
    });`;

const replaceDriverRecords = `    const baseUrl = req.protocol + '://' + req.get('host');
    const fixUrl = (url) => url && url.startsWith('/') ? baseUrl + url : url;
    const records = result.recordset.map(r => {
      try {
        const parsed = JSON.parse(r.hinhAnh || '[]');
        if (Array.isArray(parsed)) {
          r.hinhAnh = parsed.map(fixUrl);
        } else if (typeof parsed === 'string') {
          r.hinhAnh = [fixUrl(parsed)];
        } else {
          r.hinhAnh = [];
        }
      } catch (e) {
        const str = r.hinhAnh || '';
        r.hinhAnh = str ? str.split(',').map(s => s.trim()).filter(Boolean).map(fixUrl) : [];
      }
      return r;
    });`;

cargoCtrl = cargoCtrl.replace(searchDriverRecords, replaceDriverRecords);

// Apply fix to getStaffConsignments too, just to be safe
cargoCtrl = cargoCtrl.replace(searchDriverRecords, replaceDriverRecords);

fs.writeFileSync('backend/controllers/cargoController.js', cargoCtrl, 'utf8');
console.log('Fixed cargoController.js');
