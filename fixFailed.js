const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8');

content = content.replace(/consignment\.cargoStatus === 'failed'/g, "consignment.cargoStatus === 'cancelled'");
content = content.replace(/selectedConsignment\.cargoStatus === 'failed'/g, "selectedConsignment.cargoStatus === 'cancelled'");

fs.writeFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', content, 'utf8');
console.log('Fixed failed to cancelled');
