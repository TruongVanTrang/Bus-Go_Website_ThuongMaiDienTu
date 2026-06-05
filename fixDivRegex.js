const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8');

content = content.replace(/                    <\/div>\r?\n                  \)/, "                    </div>\n                  </div>\n                  )");

fs.writeFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', content, 'utf8');
console.log('Fixed div with regex');
