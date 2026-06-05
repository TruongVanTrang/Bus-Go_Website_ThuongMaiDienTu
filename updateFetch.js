const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/customer/pages/EditConsignmentPage.jsx', 'utf8');

const targetFetch = `        const response = await fetch('http://localhost:5000/api/cargo/consignment', {
          method: 'POST',`;

const replacementFetch = `        const url = isEditingMode && editingId 
          ? \`http://localhost:5000/api/cargo/consignment/\${editingId}\` 
          : 'http://localhost:5000/api/cargo/consignment';
          
        const response = await fetch(url, {
          method: (isEditingMode && editingId) ? 'PUT' : 'POST',`;

content = content.replace(targetFetch, replacementFetch);
fs.writeFileSync('BusGo-Frontend/src/customer/pages/EditConsignmentPage.jsx', content, 'utf8');
console.log('Fixed fetch method in EditConsignmentPage');
