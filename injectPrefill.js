const fs = require('fs');

function injectStateLoad(file, isEditMode) {
  let content = fs.readFileSync(file, 'utf8');
  
  if (isEditMode) {
    const target1 = `  // Tự động load dữ liệu từ trang Lịch sử
  useEffect(() => {
    if (location.state && location.state.consignment) {
      const c = location.state.consignment;
      setEditingId(c.id);
      setServiceType(c.serviceType || 'van_tai');
      if (c.serviceType === 'gui_kem') setSelectedTripId(c.tripId);
      // Bạn có thể mở rộng logic load form ở đây dựa theo cấu trúc state form
    }
  }, [location.state]);`;

    const replacement1 = `  // Tự động load dữ liệu từ trang Lịch sử
  useEffect(() => {
    if (location.state && location.state.consignment) {
      const c = location.state.consignment;
      setEditingId(c.id);
      setServiceType(c.loaiDichVu || 'van_tai');
      if (c.loaiDichVu === 'gui_kem') setSelectedTripId(c.maChuyenXe);
      if (c.loaiDichVu === 'van_tai') setSelectedTruckType(c.loaiXeVanTai || 'truck_10t');
      
      setRouteData({
        from: c.diemGui || '',
        to: c.diemNhan || '',
        date: c.ngayGui ? new Date(c.ngayGui).toISOString().split('T')[0] : '',
        senderAddress: c.diaChiGuiChiTiet || '',
        receiverAddress: c.diaChiNhanChiTiet || ''
      });
      
      setCargoData({
        type: c.loaiHangHoa || 'documents',
        weight: c.trongLuong || '',
        quantity: c.soLuong || 1,
        images: c.hinhAnh || []
      });
      
      setPersonData({
        senderName: c.tenNguoiGui || '',
        senderPhone: c.soDienThoaiNguoiGui || '',
        senderCCCD: c.soCCCD || '',
        senderEmail: c.emailNguoiGui || '',
        receiverName: c.tenNguoiNhan || '',
        receiverPhone: c.soDienThoaiNguoiNhan || ''
      });
      
      setSignatureImage(c.chieKySo || null);
    }
  }, [location.state]);`;

    content = content.replace(target1, replacement1);
    fs.writeFileSync(file, content, 'utf8');
  } else {
    // For CargoConsignmentPage
    const target2 = `  const location = useLocation()`;
    const replacement2 = `  const location = useLocation()

  // Tự động load dữ liệu từ Đặt lại đơn
  useEffect(() => {
    if (location.state && location.state.reorderData) {
      const c = location.state.reorderData;
      setServiceType(c.loaiDichVu || 'van_tai');
      if (c.loaiDichVu === 'gui_kem') setSelectedTripId(c.maChuyenXe);
      if (c.loaiDichVu === 'van_tai') setSelectedTruckType(c.loaiXeVanTai || 'truck_10t');
      
      setRouteData({
        from: c.diemGui || '',
        to: c.diemNhan || '',
        date: '', // Khách hàng phải tự chọn lại ngày
        senderAddress: c.diaChiGuiChiTiet || '',
        receiverAddress: c.diaChiNhanChiTiet || ''
      });
      
      setCargoData({
        type: c.loaiHangHoa || 'documents',
        weight: c.trongLuong || '',
        quantity: c.soLuong || 1,
        images: c.hinhAnh || []
      });
      
      setPersonData({
        senderName: c.tenNguoiGui || '',
        senderPhone: c.soDienThoaiNguoiGui || '',
        senderCCCD: c.soCCCD || '',
        senderEmail: c.emailNguoiGui || '',
        receiverName: c.tenNguoiNhan || '',
        receiverPhone: c.soDienThoaiNguoiNhan || ''
      });
    }
  }, [location.state]);`;

    // Only inject if not already injected
    if (!content.includes('Tự động load dữ liệu từ Đặt lại đơn')) {
      content = content.replace(target2, replacement2);
      fs.writeFileSync(file, content, 'utf8');
    }
  }
}

injectStateLoad('BusGo-Frontend/src/customer/pages/EditConsignmentPage.jsx', true);
injectStateLoad('BusGo-Frontend/src/customer/pages/CargoConsignmentPage.jsx', false);
console.log('Injected pre-fill state logic!');
