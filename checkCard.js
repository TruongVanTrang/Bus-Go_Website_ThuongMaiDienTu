const fs = require('fs');
const content = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('booking-card p-4'));
for(let i=idx-5; i<idx+15; i++) console.log(lines[i]);
