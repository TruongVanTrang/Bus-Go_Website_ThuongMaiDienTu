const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/customer/pages/EditConsignmentPage.jsx', 'utf8');

// 1. Remove stepper render
content = content.replace(/<Stepper[\s\S]*?\/>/, '');

// 2. Remove step navigation buttons completely
content = content.replace(/\{renderStepNavigation\(\)\}/g, '');

// 3. Render all steps instead of currentStep switch
// The switch looks like:
// {currentStep === 1 && renderServiceSelection()}
// {currentStep === 2 && renderCargoInfo()}
// {currentStep === 3 && renderPersonInfo()}
// {currentStep === 4 && renderPayment()}
// Let's replace them with simple function calls wrapped in sections.

content = content.replace(
  /\{currentStep === 1 && renderServiceSelection\(\)\}/g,
  `<div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
     <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">1. Tuyến đường & Dịch vụ</h2>
     {renderServiceSelection()}
   </div>`
);

content = content.replace(
  /\{currentStep === 2 && renderCargoInfo\(\)\}/g,
  `<div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
     <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">2. Thông tin hàng hóa</h2>
     {renderCargoInfo()}
   </div>`
);

content = content.replace(
  /\{currentStep === 3 && renderPersonInfo\(\)\}/g,
  `<div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
     <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">3. Người gửi & Người nhận</h2>
     {renderPersonInfo()}
   </div>`
);

content = content.replace(
  /\{currentStep === 4 && renderPayment\(\)\}/g,
  `<div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
     <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">4. Phê duyệt & Cập nhật</h2>
     {renderPayment()}
   </div>`
);

// Remove the `isEditingMode` logic that changes texts since we are ALWAYS editing here.
// But the component still has `isEditingMode` state. Let's just force `isEditingMode = true`.
content = content.replace(
  /const \[isEditingMode, setIsEditingMode\] = useState\(false\)/,
  'const [isEditingMode, setIsEditingMode] = useState(true)'
);

// We need to fetch the consignment by ID if not provided via location.state (or just rely on location.state)
// Actually, relying on location.state is fine.

fs.writeFileSync('BusGo-Frontend/src/customer/pages/EditConsignmentPage.jsx', content, 'utf8');
console.log('Fixed EditConsignmentPage.jsx');
