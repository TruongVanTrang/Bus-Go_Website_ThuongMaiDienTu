const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/driver/pages/DriverDashboard.jsx', 'utf8');

// Add useRef
content = content.replace(
  "import React, { useState, useEffect, useMemo } from 'react'",
  "import React, { useState, useEffect, useMemo, useRef } from 'react'"
);

// Add uploadImageAPI
content = content.replace(
  "updateCargoStatusAPI \n} from '@/services/driverService'",
  "updateCargoStatusAPI,\n  uploadImageAPI\n} from '@/services/driverService'"
);

// Search for DriverDashboard component start to inject refs
const componentStartIdx = content.indexOf('export default function DriverDashboard() {');
const endOfNavigate = content.indexOf('const navigate = useNavigate()', componentStartIdx) + 'const navigate = useNavigate()'.length;

const injectRefs = `
  const fileInputRef = useRef(null);
  const [pendingCargoUpload, setPendingCargoUpload] = useState(null); // { id, status, dbId, isConsignment }
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !pendingCargoUpload) return;
    
    setIsUploading(true);
    try {
      // 1. Upload the image
      const uploadRes = await uploadImageAPI(file);
      const imageUrl = uploadRes.url;
      
      // 2. Call handleCargoStatusUpdate with the URL
      await handleCargoStatusUpdate(
        pendingCargoUpload.id, 
        pendingCargoUpload.status, 
        pendingCargoUpload.dbId, 
        pendingCargoUpload.isConsignment, 
        imageUrl
      );
    } catch (error) {
      console.error(error);
      toast.error('Lỗi khi tải ảnh lên');
    } finally {
      setIsUploading(false);
      setPendingCargoUpload(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerImageUpload = (id, status, dbId, isConsignment) => {
    setPendingCargoUpload({ id, status, dbId, isConsignment });
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
`;

content = content.slice(0, endOfNavigate) + '\n' + injectRefs + content.slice(endOfNavigate);

// Inject <input type="file" /> into the return
const returnDivIdx = content.indexOf('<div className="flex h-screen bg-slate-50">');
if (returnDivIdx !== -1) {
  content = content.slice(0, returnDivIdx) + `<input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />\n      ` + content.slice(returnDivIdx);
}

// Replace prompt for "Nhận hàng" (APPROVED)
const promptPickupRegex = /const fakeImage = prompt\("Nhập URL hình ảnh xác nhận nhận hàng:", "https:\/\/example\.com\/pickup\.jpg"\);\s*if \(fakeImage\) {\s*handleCargoStatusUpdate\(item\.id, 'APPROVED', item\.dbId, true, fakeImage\);\s*}/g;
content = content.replace(promptPickupRegex, "triggerImageUpload(item.id, 'APPROVED', item.dbId, true);");

// Replace prompt for "Giao hàng" (SHIPPING)
const promptDropoffRegex = /const fakeImage = prompt\("Nhập URL hình ảnh xác nhận giao hàng:", "https:\/\/example\.com\/dropoff\.jpg"\);\s*if \(fakeImage\) handleCargoStatusUpdate\(item\.id, 'SHIPPING', item\.dbId, item\.isConsignment, fakeImage\);/g;
content = content.replace(promptDropoffRegex, "triggerImageUpload(item.id, 'SHIPPING', item.dbId, item.isConsignment);");

fs.writeFileSync('BusGo-Frontend/src/driver/pages/DriverDashboard.jsx', content, 'utf8');
console.log('DriverDashboard modified for file upload');
