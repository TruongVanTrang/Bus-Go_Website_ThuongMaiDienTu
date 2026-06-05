const fs = require('fs');

let driverCtrl = fs.readFileSync('backend/controllers/driverController.js', 'utf8');

const search = `      senderPhone: row.soDienThoaiNguoiGui,
      senderAddress: row.diaChiGuiChiTiet || row.diemGui,
      receiverAddress: row.diaChiNhanChiTiet || row.diemNhan,
      images: row.hinhAnh ? row.hinhAnh.split(',') : []
    }));`;

const replace = `      senderPhone: row.soDienThoaiNguoiGui,
      senderAddress: row.diaChiGuiChiTiet || row.diemGui,
      receiverAddress: row.diaChiNhanChiTiet || row.diemNhan,
      images: (function(imgStr) {
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
      })(row.hinhAnh)
    }));`;

driverCtrl = driverCtrl.replace(search, replace);

fs.writeFileSync('backend/controllers/driverController.js', driverCtrl, 'utf8');
console.log('Fixed driverController.js images');
