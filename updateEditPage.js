const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/customer/pages/EditConsignmentPage.jsx', 'utf8');

const target1 = `  const location = useLocation()
  const [isEditingMode, setIsEditingMode] = useState(true)
  const [editingId, setEditingId] = useState(null)`;

const replacement1 = `  const location = useLocation()
  const [isEditingMode, setIsEditingMode] = useState(true)
  const [editingId, setEditingId] = useState(null)

  // Tự động load dữ liệu từ trang Lịch sử
  useEffect(() => {
    if (location.state && location.state.consignment) {
      const c = location.state.consignment;
      setEditingId(c.id);
      setServiceType(c.serviceType || 'van_tai');
      if (c.serviceType === 'gui_kem') setSelectedTripId(c.tripId);
      // Bạn có thể mở rộng logic load form ở đây dựa theo cấu trúc state form
    }
  }, [location.state]);`;

content = content.replace(target1, replacement1);
fs.writeFileSync('BusGo-Frontend/src/customer/pages/EditConsignmentPage.jsx', content, 'utf8');
console.log('Injected edit state loading');
