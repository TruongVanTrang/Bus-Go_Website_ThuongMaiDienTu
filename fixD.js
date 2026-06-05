const fs = require('fs');
let content = fs.readFileSync('backend/controllers/driverController.js', 'utf8');
content = content.replace(/images: row\.hinhAnh \? row\.hinhAnh\.split\(\',\'\) : \[\]/g, `images: (function(imgStr) {
        if (!imgStr) return [];
        const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
        const fixUrl = (url) => url.startsWith('/') ? baseUrl + url : url;
        try {
          const parsed = JSON.parse(imgStr);
          if (Array.isArray(parsed)) return parsed.map(fixUrl);
          if (typeof parsed === 'string') return [fixUrl(parsed)];
          return imgStr.split(',').map(s => s.trim()).filter(Boolean).map(fixUrl);
        } catch(e) {
          return imgStr.split(',').map(s => s.trim()).filter(Boolean).map(fixUrl);
        }
      })(row.hinhAnh)`);
fs.writeFileSync('backend/controllers/driverController.js', content, 'utf8');
console.log('REPLACED');
