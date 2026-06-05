const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/driver/pages/DriverDashboard.jsx', 'utf8');

content = content.replace(
  /  getTruckCargoAPI,\r?\n  updateCargoStatusAPI\s*\r?\n\} from '@\/services\/driverService'/g,
  `  getTruckCargoAPI,
  updateCargoStatusAPI,
  uploadImageAPI
} from '@/services/driverService'`
);

fs.writeFileSync('BusGo-Frontend/src/driver/pages/DriverDashboard.jsx', content, 'utf8');
console.log('Fixed imports successfully using regex.');
