const fs = require('fs');

let content = fs.readFileSync('BusGo-Frontend/src/driver/pages/DriverDashboard.jsx', 'utf8');

content = content.replace(/dbStatus === 'delivered'/g, "dbStatus === 'DELIVERED'");
content = content.replace(/\['in_transit', 'received_at_station'\].includes\(dbStatus\)/g, "['SHIPPING'].includes(dbStatus)");

fs.writeFileSync('BusGo-Frontend/src/driver/pages/DriverDashboard.jsx', content, 'utf8');
console.log('Fixed DriverDashboard logic');
