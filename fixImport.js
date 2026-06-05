const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8');

const targetImport = `import { FiHeart, FiTrash2, FiMapPin, FiClock, FiDollarSign, FiX, FiDownload, FiBell, FiCheckCircle, FiLoader, FiStar, FiPackage, FiTruck, FiCheckSquare, FiAlertTriangle } from 'react-icons/fi'`;
const replaceImport = `import { FiHeart, FiTrash2, FiMapPin, FiClock, FiDollarSign, FiX, FiDownload, FiBell, FiCheckCircle, FiLoader, FiStar, FiPackage, FiTruck, FiCheckSquare, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi'`;

if (content.includes(targetImport)) {
    content = content.replace(targetImport, replaceImport);
    fs.writeFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', content, 'utf8');
    console.log('Added import FiRefreshCw');
} else if (content.includes('FiRefreshCw')) {
    console.log('FiRefreshCw already imported');
} else {
    console.log('Could not find import to replace');
}
