const fs = require('fs');
const lines = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8').split('\n');
for(let i=800; i<825; i++) {
  console.log(i + ': ' + lines[i]);
}
