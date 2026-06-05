const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8');

const targetStr = `images: item.hinhAnh || []
          }
        })
        setConsignments`;

const replaceStr = `images: item.hinhAnh || [],
            rawBackendData: item
          }
        })
        setConsignments`;

content = content.replace(targetStr, replaceStr);
fs.writeFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', content, 'utf8');
console.log('Added rawBackendData');
