const fs = require('fs');
let content = fs.readFileSync('driverController.js', 'utf8');

const target1 = `      senderAddress: row.diaChiGuiChiTiet || row.diemGui,
      receiverAddress: row.diaChiNhanChiTiet || row.diemNhan,`;

const replacement1 = `      senderAddress: row.diaChiGuiChiTiet || row.diemGui,
      receiverAddress: row.diaChiNhanChiTiet || row.diemNhan,
      isEdited: row.isEdited,`;

content = content.replace(new RegExp(target1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement1);
fs.writeFileSync('driverController.js', content, 'utf8');
console.log('Injected isEdited into driverController');
