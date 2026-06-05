const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8');

const targetStr = `cargoStatus: mappedStatus,
            date: item.ngayGui,
            images: item.hinhAnh || []
          }`;

const replaceStr = `cargoStatus: mappedStatus,
            date: item.ngayGui,
            images: item.hinhAnh || [],
            rawBackendData: item
          }`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', content, 'utf8');
  console.log('Added rawBackendData to initial load');
} else {
  console.log('Not found');
}
