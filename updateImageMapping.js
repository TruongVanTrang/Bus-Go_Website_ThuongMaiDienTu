const fs = require('fs');
let content = fs.readFileSync('backend/controllers/driverController.js', 'utf8');

const replacementFunc = `(function(imgStr) {
          if (!imgStr) return [];
          const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
          const fixUrl = (url) => url.startsWith('/') ? baseUrl + url : url;
          try {
            const parsed = JSON.parse(imgStr);
            if (Array.isArray(parsed)) return parsed.map(fixUrl);
            return imgStr.split(',').map(s => s.trim()).filter(Boolean).map(fixUrl);
          } catch(e) {
            return imgStr.split(',').map(s => s.trim()).filter(Boolean).map(fixUrl);
          }
        })(row.hinhAnh)`;

// In getTruckCargo, there are two mappings for images
// Find the maps and replace
content = content.replace(/images: \(function\(imgStr\) \{[\s\S]*?\}\)\(row\.hinhAnh\)/g, "images: " + replacementFunc);

fs.writeFileSync('backend/controllers/driverController.js', content, 'utf8');
console.log('Final fixed driverController mapping');
