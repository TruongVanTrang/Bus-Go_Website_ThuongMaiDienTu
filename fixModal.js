const fs = require('fs');

let userHistory = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8');

const search = '<div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative flex flex-col \\nmax-h-[90vh]" onClick={(e) => e.stopPropagation()}>';
const replace = '<div className={`bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh] ${(selectedConsignment.cargoStatus === \\'da_huy\\' || selectedConsignment.cargoStatus === \\'failed\\') ? \\'border-4 border-red-500\\' : \\'\\'}`} onClick={(e) => e.stopPropagation()}>';

// The source might have a newline inside the className string or not, let's just do a regex replace that handles spaces/newlines
userHistory = userHistory.replace(
  /<div className=\"bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative flex flex-col\s+max-h-\[90vh\]\" onClick=\{\(e\) => e\.stopPropagation\(\)\}>/g,
  replace
);

fs.writeFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', userHistory, 'utf8');
console.log('Fixed Modal border');
