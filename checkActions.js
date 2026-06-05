const fs = require('fs');
const lines = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8').split('\n');
const start = lines.findIndex(l => l.includes('<div className="action-buttons" style={{ display: \'flex\', gap: \'0.5rem\' }}>'));
for(let i=start-5; i<=start+20; i++) console.log(i + ': ' + lines[i]);
