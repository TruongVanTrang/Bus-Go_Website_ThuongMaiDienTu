const fs = require('fs');
const content = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('<div className="action-buttons">'));
if (idx !== -1) {
  for(let i=idx; i<=idx+25; i++) console.log(lines[i]);
}
