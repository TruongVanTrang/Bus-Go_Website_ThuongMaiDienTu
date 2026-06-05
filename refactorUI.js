const fs = require('fs');

let content = fs.readFileSync('C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\8a99e967-a01d-4069-866d-d0b10feddfef\\scratch\\UserHistory.jsx', 'utf8');

// Replace tab container
content = content.replace(
  '<div className="tabs-container mb-4">',
  '<div className="mb-6 flex overflow-x-auto border-b border-gray-200">'
);
content = content.replace(
  '<div className="tabs-header">',
  '<div className="flex gap-4">'
);
content = content.replace(
  /className={`tab-button \$\{activeTab === 'history' \? 'active' : ''\}`}/g,
  "className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}"
);
content = content.replace(
  /className={`tab-button \$\{activeTab === 'watchlist' \? 'active' : ''\}`}/g,
  "className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'watchlist' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}"
);
content = content.replace(
  /className={`tab-button \$\{activeTab === 'cargo' \? 'active' : ''\}`}/g,
  "className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'cargo' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}"
);

// Replace cargo filters
content = content.replace(
  '<div className="status-filter-container mb-4">',
  '<div className="flex flex-wrap gap-2 mb-6">'
);

// We replace all filter-btn
content = content.replace(
  /className={`filter-btn \$\{cargoStatusFilter === '([a-z_]+)' \? 'active' : ''\}`}/g,
  "className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${cargoStatusFilter === '$1' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}"
);

// Replace booking filters
content = content.replace(
  /className={`filter-btn \$\{statusFilter === '([a-z_]+)' \? 'active' : ''\}`}/g,
  "className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${statusFilter === '$1' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}"
);

// Cargo modal styling
content = content.replace(
  /<div className="modal-content modal-lg" onClick=\{\(e\) => e.stopPropagation\(\)\}>/g,
  '<div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>'
);

content = content.replace(
  '<div className="modal-header">',
  '<div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">'
);
content = content.replace(
  /<div className="modal-body">/g,
  '<div className="px-6 py-4 overflow-y-auto flex-1">'
);

content = content.replace(
  /<div className="modal-footer">/g,
  '<div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">'
);

fs.writeFileSync('C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\8a99e967-a01d-4069-866d-d0b10feddfef\\scratch\\UserHistory.jsx', content, 'utf8');
console.log('UI refactored');
