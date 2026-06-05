const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/customer/pages/CargoConsignmentPage.jsx', 'utf8');

// 1. Add useLocation
content = content.replace(
  /import \{ useNavigate \} from 'react-router-dom'/,
  "import { useNavigate, useLocation } from 'react-router-dom'"
);

// 2. Add updateConsignmentAPI
content = content.replace(
  /import \{ createConsignmentAPI \} from '\.\.\/\.\.\/services\/cargoService'/,
  "import { createConsignmentAPI, updateConsignmentAPI } from '../../services/cargoService'"
);

// 3. Add isEditingMode and editingId
content = content.replace(
  /const navigate = useNavigate\(\)/,
  "const navigate = useNavigate()\n  const location = useLocation()\n  const [isEditingMode, setIsEditingMode] = useState(false)\n  const [editingId, setEditingId] = useState(null)"
);

// 4. Add useEffect for loading edit data
const effectCode = `  useEffect(() => {
    if (location.state?.editConsignment) {
      const editData = location.state.editConsignment;
      setIsEditingMode(true);
      setEditingId(editData.id);
      
      setServiceType(editData.serviceType || 'gui_kem');
      setRouteData({
        from: editData.from,
        to: editData.to,
        date: editData.date || new Date().toISOString().split('T')[0],
        pickupLocationDetail: editData.pickupDetail || '',
        deliveryLocationDetail: editData.deliveryDetail || ''
      });
      setCargoData({
        type: editData.cargoType || '',
        weight: editData.weight || '',
        declaredValue: '',
        qty: editData.qty || 1,
        note: ''
      });
      setPersonData({
        senderName: editData.senderName || '',
        senderPhone: editData.senderPhone || '',
        senderEmail: editData.senderEmail || '',
        senderCCCD: editData.senderCCCD || '',
        receiverName: editData.receiverName || '',
        receiverPhone: editData.receiverPhone || ''
      });
      if (editData.images) {
        setCargoImages(editData.images);
      }
    }
  }, [location.state]);`;

content = content.replace('// Load user profile', effectCode + '\n\n  // Load user profile');

// 5. Update submit logic to use updateConsignmentAPI
const submitCode = `    try {
      setPaymentLoading(true)
      const token = localStorage.getItem('busgo_token')
      
      let res;
      if (isEditingMode) {
         res = await updateConsignmentAPI(editingId, payload, token);
      } else {
         res = await createConsignmentAPI(payload, token);
      }
      
      if (res) {`;
      
content = content.replace(/    try \{\r?\n      setPaymentLoading\(true\)\r?\n      const token = localStorage\.getItem\('busgo_token'\)\r?\n      const res = await createConsignmentAPI\(payload, token\)\r?\n      if \(res\) \{/, submitCode);

// 6. Change heading Text
content = content.replace(/\{serviceType === 'gui_kem' \? 'Gửi hàng kèm xe khách' : 'Đặt xe tải nguyên chuyến'\}/g, "{isEditingMode ? 'Cập nhật đơn ký gửi' : (serviceType === 'gui_kem' ? 'Gửi hàng kèm xe khách' : 'Đặt xe tải nguyên chuyến')}");
content = content.replace(/Thanh toán/g, "{isEditingMode ? 'Cập nhật' : 'Thanh toán'}");

fs.writeFileSync('BusGo-Frontend/src/customer/pages/CargoConsignmentPage.jsx', content, 'utf8');
console.log('Fixed CargoConsignmentPage');
