const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/driver/pages/DriverDashboard.jsx', 'utf8');

const targetStr = `  getTruckCargoAPI,
  updateCargoStatusAPI 
} from '@/services/driverService'`;

const replacement = `  getTruckCargoAPI,
  updateCargoStatusAPI,
  uploadImageAPI
} from '@/services/driverService'`;

content = content.replace(targetStr, replacement);
fs.writeFileSync('BusGo-Frontend/src/driver/pages/DriverDashboard.jsx', content, 'utf8');
console.log('Fixed imports in DriverDashboard.');
