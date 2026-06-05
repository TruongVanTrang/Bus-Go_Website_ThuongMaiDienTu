const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8');

const targetStr = `  if (loading) {`;
const injectStr = `  console.log('CONSIGNMENTS DATA:', consignments);
  if (loading) {`;

content = content.replace(targetStr, injectStr);
fs.writeFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', content, 'utf8');
console.log('Added console.log');
