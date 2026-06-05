const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/driver/pages/DriverDashboard.jsx', 'utf8');

// 1. Add uploadedPickupImages and uploadedDeliveryImages state
const stateTarget = "  const fileInputRef = useRef(null);\n  const [pendingCargoUpload, setPendingCargoUpload] = useState(null);\n  const [isUploading, setIsUploading] = useState(false);";
const stateReplacement = `  const fileInputRef = useRef(null);
  const [pendingCargoUpload, setPendingCargoUpload] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [uploadedPickupImages, setUploadedPickupImages] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('uploadedPickupImages') || '[]')) } catch(e) { return new Set() }
  });
  const [uploadedDeliveryImages, setUploadedDeliveryImages] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('uploadedDeliveryImages') || '[]')) } catch(e) { return new Set() }
  });

  useEffect(() => {
    localStorage.setItem('uploadedPickupImages', JSON.stringify([...uploadedPickupImages]));
  }, [uploadedPickupImages]);

  useEffect(() => {
    localStorage.setItem('uploadedDeliveryImages', JSON.stringify([...uploadedDeliveryImages]));
  }, [uploadedDeliveryImages]);`;

if (content.includes("const fileInputRef = useRef(null);") && !content.includes("uploadedPickupImages")) {
  content = content.replace(stateTarget, stateReplacement);
}

// 2. Modify triggerImageUpload and handleFileSelect
const funcTarget = `  const triggerImageUpload = (id, status, dbId, isConsignment) => {
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
  };`;

const funcReplacement = `  const triggerImageUpload = (id, uploadType, dbId, isConsignment) => {
    setPendingCargoUpload({ id, uploadType, dbId, isConsignment });
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !pendingCargoUpload) return;
    
    setIsUploading(true);
    try {
      const uploadRes = await uploadImageAPI(file);
      const imageUrl = uploadRes.url;
      
      // Update image without changing status
      const currentStatus = pendingCargoUpload.uploadType === 'pickup' ? 'SHIPPING' : 'DELIVERED';
      await updateCargoStatusAPI(pendingCargoUpload.id, currentStatus, imageUrl);
      
      // Update UI state
      if (pendingCargoUpload.uploadType === 'pickup') {
         setUploadedPickupImages(prev => new Set(prev).add(pendingCargoUpload.id));
         toast.success('Đã tải ảnh kiện hàng thành công!');
      } else {
         setUploadedDeliveryImages(prev => new Set(prev).add(pendingCargoUpload.id));
         toast.success('Đã tải ảnh giao hàng thành công!');
      }
      
      // Add image to local cargo state to show in modal
      setCargo(prev => prev.map(c => {
         if (c.id === pendingCargoUpload.id) {
           const newImages = c.images ? [...c.images] : [];
           newImages.push(imageUrl);
           return { ...c, images: newImages };
         }
         return c;
      }));
      
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Lỗi khi tải ảnh lên');
    } finally {
      setIsUploading(false);
      setPendingCargoUpload(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };`;

if (content.includes("const triggerImageUpload = (id, status, dbId, isConsignment) => {")) {
  content = content.replace(funcTarget, funcReplacement);
}

fs.writeFileSync('BusGo-Frontend/src/driver/pages/DriverDashboard.jsx', content, 'utf8');
console.log('Done 1 and 2.');
