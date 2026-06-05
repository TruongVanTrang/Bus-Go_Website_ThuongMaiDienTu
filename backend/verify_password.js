const fs = require('fs');
const path = require('path');

const srcDir = 'd:\\Thu\\CNTT\\HK 2025\\HK225\\ThuongMaiDienTu\\Bus-Go_Website_ThuongMaiDienTu\\BusGo-Frontend\\src';

function search(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      search(fullPath);
    } else {
      if (file.endsWith('.css') || file.endsWith('.js') || file.endsWith('.jsx')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('admin-main')) {
          console.log('Found admin-main in:', fullPath);
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            if (line.includes('admin-main')) {
              console.log(`  ${idx+1}: ${line.trim()}`);
            }
          });
        }
      }
    }
  }
}

search(srcDir);
