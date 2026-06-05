const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/driver/pages/DriverDashboard.jsx', 'utf8');

const newStr = `\r\n      {/* Ẩn input file để chọn ảnh từ thiết bị */}\r\n      <input\r\n        type="file"\r\n        ref={fileInputRef}\r\n        onChange={handleFileSelect}\r\n        className="hidden"\r\n        accept="image/*"\r\n        capture="environment"\r\n      />\r\n    </div>\r\n  )\r\n}\r\n`;

content = content.replace(/    <\/div>\r?\n  \)\r?\n}\r?\n?$/, newStr);
fs.writeFileSync('BusGo-Frontend/src/driver/pages/DriverDashboard.jsx', content, 'utf8');
console.log('Added hidden file input successfully with regex.');
