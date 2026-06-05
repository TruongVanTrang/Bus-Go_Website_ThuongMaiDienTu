const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/driver/pages/DriverDashboard.jsx', 'utf8');

// 1. Add states and functions
const stateTarget = "  const [searchQuery, setSearchQuery] = useState('')";
const stateReplacement = `  const fileInputRef = useRef(null);
  const [pendingCargoUpload, setPendingCargoUpload] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const triggerImageUpload = (id, status, dbId, isConsignment) => {
    setPendingCargoUpload({ id, status, dbId, isConsignment });
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

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
      toast.error(error.message || 'Lỗi khi tải ảnh lên');
    } finally {
      setIsUploading(false);
      setPendingCargoUpload(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const [searchQuery, setSearchQuery] = useState('')`;

if (!content.includes('const fileInputRef = useRef(null)')) {
  content = content.replace(stateTarget, stateReplacement);
}

// 2. Replace fakeImage prompts
const regex1 = /const fakeImage = prompt\("Nhập URL hình ảnh xác nhận nhận hàng:", "https:\/\/example\.com\/pickup\.jpg"\);\s*if \(fakeImage\) \{\s*handleCargoStatusUpdate\(item\.id, 'APPROVED', item\.dbId, true, fakeImage\);\s*\}/g;
content = content.replace(regex1, `triggerImageUpload(item.id, 'APPROVED', item.dbId, true);`);

const regex2 = /const fakeImage = prompt\("Nhập URL hình ảnh xác nhận giao hàng:", "https:\/\/example\.com\/dropoff\.jpg"\);\s*if \(fakeImage\) handleCargoStatusUpdate\(item\.id, 'SHIPPING', item\.dbId, item\.isConsignment, fakeImage\);/g;
content = content.replace(regex2, `triggerImageUpload(item.id, 'SHIPPING', item.dbId, item.isConsignment);`);

fs.writeFileSync('BusGo-Frontend/src/driver/pages/DriverDashboard.jsx', content, 'utf8');
console.log('Restored file picker functionality in DriverDashboard.');
