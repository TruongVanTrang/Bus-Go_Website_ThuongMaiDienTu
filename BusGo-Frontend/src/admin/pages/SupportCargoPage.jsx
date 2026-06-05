import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthUtil, StorageUtil, FormatUtil } from '@/utils/helpers';
import { ROLE_MENU } from '@/utils/constants';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopbar from '../components/AdminTopbar';
import axios from 'axios';

// Import custom UI components
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

// Import Lucide icons
import { 
  Package, Search, FileText, CheckCircle2, Trash2, Plus, X, 
  Undo, Eye, Users, TrendingUp, MapPin, Clock, User, DollarSign, AlertTriangle, Inbox
} from 'lucide-react';

const API = 'http://localhost:5000/api';

const selectCls = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm focus:border-[#004b87] focus:outline-none focus:ring-2 focus:ring-[#004b87]/15 transition-all";
const inputCls = selectCls;

function SupportCargoPage({ defaultTab = 'cargo-assign' }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  // Tabs: 'cargo-assign', 'ticket-lookup', 'refund', 'cancel-requests'
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Cargo Assign states
  const [consignments, setConsignments] = useState([]);
  const [loadingCargo, setLoadingCargo] = useState(true);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [selectedCargo, setSelectedCargo] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [submittingAssign, setSubmittingAssign] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Ticket Lookup states
  const [searchQuery, setSearchQuery] = useState('');
  const [ticketDetails, setTicketDetails] = useState(null);
  const [searchingTicket, setSearchingTicket] = useState(false);

  // Cancel request states
  const [cancelRequests, setCancelRequests] = useState([]);
  const [loadingCancelReqs, setLoadingCancelReqs] = useState(false);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    const role = AuthUtil.getCurrentRole();
    const user = AuthUtil.getCurrentUser();
    if (!role) {
      navigate('/login');
      return;
    }
    setUserRole(role);
    setUserName(user?.name || 'Support Staff');
    setLoading(false);
    fetchConsignments();
    fetchDrivers();
    fetchVehicles();
  }, [navigate]);

  useEffect(() => {
    if (activeTab === 'cancel-requests') {
      fetchCancelRequests();
    }
  }, [activeTab]);

  const token = () => StorageUtil.getToken();
  const headers = () => ({ Authorization: `Bearer ${token()}` });

  // Lấy tất cả đơn ký gửi (cả gui_kem lẫn van_tai)
  const fetchConsignments = async () => {
    try {
      setLoadingCargo(true);
      const res = await axios.get(`${API}/cargo/staff/consignments`, { headers: headers() });
      setConsignments(res.data);
    } catch (err) {
      console.error('Lỗi tải danh sách đơn ký gửi:', err);
      setConsignments([]);
    } finally {
      setLoadingCargo(false);
    }
  };

  // Lấy danh sách tài xế từ DB
  const fetchDrivers = async () => {
    try {
      setLoadingDrivers(true);
      const res = await axios.get(`${API}/cargo/staff/drivers`, { headers: headers() });
      setDrivers(res.data);
    } catch (err) {
      console.error('Lỗi tải danh sách tài xế:', err);
      setDrivers([]);
    } finally {
      setLoadingDrivers(false);
    }
  };

  // Lấy danh sách xe tải từ DB
  const fetchVehicles = async () => {
    try {
      const res = await axios.get(`${API}/cargo/staff/vehicles`, { headers: headers() });
      setVehicles(res.data);
    } catch (err) {
      console.error('Lỗi tải danh sách xe tải:', err);
      setVehicles([]);
    }
  };

  // Lấy yêu cầu hủy đơn chờ duyệt
  const fetchCancelRequests = async () => {
    try {
      setLoadingCancelReqs(true);
      const res = await axios.get(`${API}/cargo/staff/consignments`, { headers: headers() });
      setCancelRequests(res.data.filter(c => c.yeuCauHuy === 'pending'));
    } catch (err) {
      console.error('Lỗi tải yêu cầu hủy:', err);
      setCancelRequests([]);
    } finally {
      setLoadingCancelReqs(false);
    }
  };

  // Mở modal xem chi tiết đơn hàng
  const handleViewDetail = (cargo) => {
    setSelectedCargo(cargo);
    setShowDetailModal(true);
  };

  // Mở modal phân phối xe tải
  const handleOpenAssignModal = (cargo) => {
    setSelectedCargo(cargo);
    const matchVehicle = vehicles.find(v =>
      (cargo.loaiXeVanTai === 'truck_5t' && v.loaiXe === 'truck_5t') ||
      (cargo.loaiXeVanTai === 'truck_10t' && v.loaiXe === 'truck_10t') ||
      (cargo.loaiXeVanTai === 'truck_30t' && v.loaiXe === 'truck_30t')
    );
    
    const vehicleId = matchVehicle?.maPhuongTien || vehicles[0]?.maPhuongTien || '';
    setSelectedVehicleId(vehicleId);

    const v = vehicles.find(vv => String(vv.maPhuongTien) === String(vehicleId));
    const matchDriver = drivers.find(d => d.bienSoXe === v?.bienSoXe);
    
    setSelectedDriverId(matchDriver ? String(matchDriver.maNguoiDung) : (drivers[0]?.maNguoiDung || ''));
    
    setShowAssignModal(true);
  };

  // Xác nhận phân phối tài xế + xe tải
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDriverId || !selectedVehicleId) {
      alert('Vui lòng chọn tài xế và xe tải để phân phối!');
      return;
    }

    setSubmittingAssign(true);
    const selectedDriver = drivers.find(d => String(d.maNguoiDung) === String(selectedDriverId));
    const selectedVehicle = vehicles.find(v => String(v.maPhuongTien) === String(selectedVehicleId));
    const driverName = selectedDriver?.tenNguoiDung || 'Tài xế';
    const driverPhone = selectedDriver?.soDienThoai || '';
    const truckPlate = selectedVehicle?.bienSoXe || '';
    const truckType = {
      truck_5t: 'Xe tải 5 Tấn',
      truck_10t: 'Xe tải 10 Tấn',
      truck_30t: 'Xe tải 30 Tấn'
    }[selectedVehicle?.loaiXe] || 'Xe tải';

    const cargoId = selectedCargo.consignmentId || selectedCargo.id;

    try {
      const payload = {
        trangThaiKyGui: 'dang_cho_xac_nhan',
        maTaiXe: parseInt(selectedDriverId),
        driverInfo: `${driverName} (SĐT: ${driverPhone} • Biển số: ${truckPlate} • ${truckType})`,
        viTriHienTai: 'Đã chỉ định tài xế, chờ tài xế xác nhận đơn'
      };

      await axios.put(`${API}/cargo/consignment/${cargoId}/status`, payload);
      alert(`✅ Đã phân phối thành công!\nTài xế: ${driverName}\nXe: ${truckPlate} (${truckType})`);
      setShowAssignModal(false);
      fetchConsignments();
    } catch (err) {
      console.error('Lỗi phân phối tài xế:', err);
      alert('Có lỗi khi phân phối tài xế. Vui lòng thử lại.');
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Duyệt hoặc từ chối yêu cầu hủy
  const handleApproveCancel = async (cargoId, approve) => {
    const action = approve ? 'đồng ý hủy đơn' : 'từ chối hủy đơn';
    if (!window.confirm(`Xác nhận ${action} #${cargoId}?`)) return;

    try {
      await axios.put(`${API}/cargo/consignment/${cargoId}/approve-cancel`, {
        approved: approve
      }, { headers: headers() });
      alert(`Đã ${action} thành công!`);
      fetchCancelRequests();
      fetchConsignments();
    } catch (err) {
      console.error('Lỗi xử lý yêu cầu hủy:', err);
      alert('Có lỗi khi xử lý yêu cầu hủy.');
    }
  };

  // Tra cứu vé
  const handleTicketSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchingTicket(true);
    setTicketDetails(null);
    try {
      const res = await axios.get(`${API}/admin/tickets`, { headers: headers() });
      const matched = res.data.find(t =>
        String(t.maVe) === searchQuery ||
        t.hoTenHanhKhach?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setTicketDetails(matched || 'not_found');
    } catch (err) {
      setTicketDetails('not_found');
    } finally {
      setSearchingTicket(false);
    }
  };

  const getStatusBadge = (status, yeuCauHuy) => {
    if (yeuCauHuy === 'pending') return <Badge variant="warning" className="font-extrabold rounded-lg text-xs px-2.5 py-0.5 animate-pulse">⏳ Chờ duyệt hủy</Badge>;
    const map = {
      dang_cho_xac_nhan: { text: 'Chờ tài xế duyệt', variant: 'warning' },
      dang_tim_xe_trong: { text: 'Chờ gán xe tải', variant: 'info' },
      da_xac_nhan: { text: 'Tài xế đã duyệt', variant: 'info' },
      received_at_station: { text: 'Đã nhận kho', variant: 'warning' },
      in_transit: { text: 'Đang giao hàng', variant: 'warning' },
      delivered: { text: 'Đã giao hàng', variant: 'success' },
      failed: { text: 'Đã hủy/Từ chối', variant: 'destructive' },
      da_huy: { text: 'Khách đã hủy', variant: 'destructive' }
    };
    const res = map[status] || { text: status, variant: 'secondary' };
    return <Badge variant={res.variant} className="font-extrabold rounded-lg text-xs px-2.5 py-0.5">{res.text}</Badge>;
  };

  const getLoaiHangLabel = (loai) => {
    return { bulky: 'Hàng cồng kềnh', documents: 'Tài liệu', fragile: 'Hàng dễ vỡ', motorcycle: 'Xe máy' }[loai] || loai;
  };

  // Lọc consignments theo filterStatus
  const getFilteredConsignments = () => {
    return consignments.filter(c => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'van_tai_pending') return c.loaiDichVu === 'van_tai' && c.trangThaiKyGui === 'dang_tim_xe_trong';
      if (filterStatus === 'gui_kem_pending') return c.loaiDichVu === 'gui_kem' && c.trangThaiKyGui === 'dang_cho_xac_nhan';
      if (filterStatus === 'paid') return c.trangThaiThanhToan === 'paid';
      if (filterStatus === 'cancelled') return c.trangThaiKyGui === 'failed';
      return true;
    });
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  const menuItems = ROLE_MENU[userRole] || [];

  return (
    <div className="admin-dashboard">
      <AdminSidebar isOpen={sidebarOpen} userRole={userRole} userName={userName} menuItems={menuItems} onClose={() => setSidebarOpen(false)} />

      <div className="admin-main">
        <AdminTopbar userName={userName} userRole={userRole} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="admin-content">
          <div className="p-6 max-w-7xl mx-auto space-y-6">
            
            {/* Header */}
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800 flex items-center gap-2">
                {activeTab === 'cargo-assign' && <Truck className="h-8 w-8 text-[#004b87]" />}
                {activeTab === 'ticket-lookup' && <Search className="h-8 w-8 text-[#004b87]" />}
                {activeTab === 'cancel-requests' && <AlertTriangle className="h-8 w-8 text-rose-600" />}
                {activeTab === 'cargo-assign' && 'Phân phối & Điều phối xe Ký gửi'}
                {activeTab === 'ticket-lookup' && 'Tra cứu thông tin đặt vé'}
                {activeTab === 'cancel-requests' && 'Yêu cầu hủy đơn sau thanh toán'}
              </h1>
              <p className="text-slate-500 text-sm font-semibold mt-1">
                {activeTab === 'cargo-assign' && 'Quản lý phân phối tài xế và phương tiện cho đơn hàng ký gửi'}
                {activeTab === 'ticket-lookup' && 'Tìm kiếm và kiểm tra thông tin đặt vé của khách hàng'}
                {activeTab === 'cancel-requests' && 'Duyệt các yêu cầu hủy đơn hàng đã thanh toán'}
              </p>
            </div>

            {/* Sub Tabs */}
            <div className="flex flex-wrap gap-2 p-1 bg-slate-100/80 backdrop-blur rounded-2xl w-fit border border-slate-200/50">
              {[
                ['cargo-assign', '🚚 Phân phối xe'],
                ['ticket-lookup', '🔍 Tra cứu vé'],
                ['cancel-requests', '🔴 Yêu cầu hủy đơn']
              ].map(([key, label]) => {
                const isActive = activeTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveTab(key);
                      setFilterStatus('all');
                    }}
                    className={`px-5 py-2.5 rounded-xl text-sm font-extrabold tracking-wide transition-all border-none ${
                      isActive 
                        ? 'bg-white text-[#004b87] shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
                    }`}
                  >
                    {key === 'cancel-requests' ? (
                      <span className="flex items-center gap-1.5">
                        🔴 Yêu cầu hủy đơn
                        {consignments.filter(c => c.yeuCauHuy === 'pending').length > 0 && (
                          <Badge variant="destructive" className="font-extrabold text-[10px] h-4 min-w-4 px-1 flex items-center justify-center rounded-full border-none">
                            {consignments.filter(c => c.yeuCauHuy === 'pending').length}
                          </Badge>
                        )}
                      </span>
                    ) : label}
                  </button>
                );
              })}
            </div>

            {/* ====================================================== */}
            {/* CARGO ASSIGN TAB CONTENT */}
            {/* ====================================================== */}
            {activeTab === 'cargo-assign' && (
              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="text-lg font-extrabold text-slate-800">Tất cả đơn ký gửi hàng</CardTitle>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchConsignments} className="border-slate-200 bg-white">
                    🔄 Làm mới
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Filter Buttons */}
                  <div className="flex flex-wrap gap-1.5 bg-slate-100/80 p-1 rounded-2xl w-fit border border-slate-200/50">
                    {[
                      { key: 'all', label: 'Tất cả' },
                      { key: 'van_tai_pending', label: '🚚 Chờ gán xe tải' },
                      { key: 'gui_kem_pending', label: '🚌 Chờ tài xế duyệt' },
                      { key: 'paid', label: '✅ Đã thanh toán' },
                      { key: 'cancelled', label: '❌ Đã hủy' },
                    ].map(f => (
                      <button
                        key={f.key}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border-none ${
                          filterStatus === f.key ? 'bg-white text-[#004b87] shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                        onClick={() => setFilterStatus(f.key)}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {loadingCargo ? (
                    <div className="flex justify-center py-16">
                      <div className="h-8 w-8 border-4 border-[#004b87] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : getFilteredConsignments().length === 0 ? (
                    <div className="text-center py-16 text-slate-400 font-semibold">
                      <Inbox className="h-8 w-8 mx-auto mb-2 text-slate-350" />
                      Không tìm thấy đơn hàng nào phù hợp
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="font-extrabold text-slate-600">Mã đơn</TableHead>
                          <TableHead className="font-extrabold text-slate-600">Loại dịch vụ</TableHead>
                          <TableHead className="font-extrabold text-slate-600">Hành trình</TableHead>
                          <TableHead className="font-extrabold text-slate-600">Thông tin hàng</TableHead>
                          <TableHead className="font-extrabold text-slate-600">Tài xế / Xe</TableHead>
                          <TableHead className="font-extrabold text-slate-600 text-center">Thanh toán</TableHead>
                          <TableHead className="font-extrabold text-slate-600 text-center">Trạng thái</TableHead>
                          <TableHead className="font-extrabold text-slate-600 text-end">Hành động</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getFilteredConsignments().map(cargo => {
                          const orderId = cargo.consignmentId || cargo.id;
                          const isTruck = cargo.loaiDichVu === 'van_tai';
                          const isUnassigned = cargo.trangThaiKyGui === 'dang_tim_xe_trong';
                          const isPaid = cargo.trangThaiThanhToan === 'paid';
                          const isCancelled = cargo.trangThaiKyGui === 'failed';

                          return (
                            <TableRow 
                              key={orderId} 
                              className={`hover:bg-slate-50/50 ${
                                isCancelled ? 'bg-red-50/30' : cargo.yeuCauHuy === 'pending' ? 'bg-amber-50/30' : ''
                              }`}
                            >
                              <TableCell className="font-bold text-slate-500">#{orderId}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={isTruck ? 'default' : 'secondary'}
                                  className="font-bold rounded-lg text-xs"
                                >
                                  {isTruck ? '🚚 Vận tải riêng' : '🚌 Gửi kèm'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                  {cargo.diemGui}
                                  <span>➔</span>
                                  {cargo.diemNhan}
                                </div>
                                <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                                  {cargo.tenNguoiNhan} ({cargo.soDienThoaiNguoiNhan})
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-bold text-slate-700">{getLoaiHangLabel(cargo.loaiHangHoa)}</div>
                                <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{cargo.trongLuong} kg • {cargo.soLuong} kiện</div>
                                {isTruck && (
                                  <Badge variant="info" className="mt-1 font-bold text-[9px] px-1.5 rounded">
                                    {cargo.loaiXeVanTai === 'truck_30t' ? '30 Tấn' : cargo.loaiXeVanTai === 'truck_10t' ? '10 Tấn' : '5 Tấn'}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {cargo.driverInfo ? (
                                  <div>
                                    <div className="font-bold text-slate-700 text-xs">{cargo.driverInfo.split('•')[0]}</div>
                                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{cargo.driverInfo.split('•').slice(1).join('•').trim()}</div>
                                  </div>
                                ) : (
                                  <span className="text-red-500 text-xs font-bold italic">Chưa phân phối</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant={isPaid ? 'success' : 'secondary'} className="font-bold rounded-lg text-xs">
                                  {isPaid ? 'Đã thanh toán' : 'Chờ thanh toán'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">{getStatusBadge(cargo.trangThaiKyGui, cargo.yeuCauHuy)}</TableCell>
                              <TableCell className="text-end">
                                <div className="flex justify-end gap-1.5 flex-wrap">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewDetail(cargo)}
                                    className="border-slate-200 text-[#004b87] hover:bg-sky-50 font-bold h-8 rounded-lg text-xs px-2.5"
                                  >
                                    👁 Chi tiết
                                  </Button>
                                  {isTruck && isUnassigned && !isCancelled && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleOpenAssignModal(cargo)}
                                      className="bg-[#004b87] hover:bg-[#003b6b] text-white font-extrabold h-8 rounded-lg text-xs px-3 border-none shadow-sm flex items-center gap-1"
                                    >
                                      🚚 Gán xe & Tài xế
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ====================================================== */}
            {/* TICKET LOOKUP TAB CONTENT */}
            {/* ====================================================== */}
            {activeTab === 'ticket-lookup' && (
              <Card className="border-slate-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-extrabold text-slate-800">Tra cứu đặt vé hành khách</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handleTicketSearch} className="flex gap-3 max-w-2xl">
                    <input
                      type="text"
                      className={inputCls}
                      placeholder="Nhập mã vé hoặc Tên hành khách..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                    <Button type="submit" disabled={searchingTicket} className="h-12 px-6 rounded-xl font-extrabold text-sm border-none cursor-pointer">
                      {searchingTicket ? 'Đang tra cứu...' : '🔍 Tìm kiếm'}
                    </Button>
                  </form>

                  {ticketDetails === 'not_found' && (
                    <div className="flex items-center gap-2 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-bold text-sm">
                      <AlertTriangle className="h-4 w-4" /> Không tìm thấy thông tin vé phù hợp.
                    </div>
                  )}
                  {ticketDetails && ticketDetails !== 'not_found' && (
                    <Card className="border-[#004b87]/30 border-2 bg-gradient-to-br from-white to-slate-50/30 max-w-xl">
                      <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-base font-black text-slate-800">Vé #{ticketDetails.maVe}</CardTitle>
                        </div>
                        <Badge variant={ticketDetails.trangThaiVe === 'da_thanh_toan' ? 'success' : 'warning'} className="font-extrabold rounded-lg text-xs">
                          {ticketDetails.trangThaiVe === 'da_thanh_toan' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4 text-sm font-semibold">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-slate-400 block text-xs font-bold uppercase tracking-wider">Hành khách</span>
                            <span className="text-slate-800 font-black">{ticketDetails.hoTenHanhKhach}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-xs font-bold uppercase tracking-wider">Hành trình</span>
                            <span className="text-slate-800 font-black flex items-center gap-1">
                              {ticketDetails.diemDon} <ArrowRight className="h-3 w-3 text-[#004b87]" /> {ticketDetails.diemTra}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-xs font-bold uppercase tracking-wider">Giá vé</span>
                            <span className="text-[#004b87] font-black">{FormatUtil.formatCurrency(ticketDetails.giaVe)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ====================================================== */}
            {/* CANCEL REQUESTS TAB CONTENT */}
            {/* ====================================================== */}
            {activeTab === 'cancel-requests' && (
              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="text-lg font-extrabold text-slate-800">Đơn đã thanh toán yêu cầu hủy</CardTitle>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchCancelRequests} className="border-slate-200 bg-white">
                    🔄 Làm mới
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingCancelReqs ? (
                    <div className="flex justify-center py-16">
                      <div className="h-8 w-8 border-4 border-[#004b87] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : cancelRequests.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 font-semibold">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                      Không có yêu cầu hủy đơn nào đang chờ xử lý
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-amber-50/50">
                        <TableRow>
                          <TableHead className="font-extrabold text-slate-650">Mã đơn</TableHead>
                          <TableHead className="font-extrabold text-slate-650">Khách hàng</TableHead>
                          <TableHead className="font-extrabold text-slate-650">Hành trình</TableHead>
                          <TableHead className="font-extrabold text-slate-650">Số tiền đã trả</TableHead>
                          <TableHead className="font-extrabold text-slate-650">Lý do hủy</TableHead>
                          <TableHead className="font-extrabold text-slate-650">Tài xế được gán</TableHead>
                          <TableHead className="font-extrabold text-slate-650 text-end">Hành động</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cancelRequests.map(cargo => (
                          <TableRow key={cargo.consignmentId} className="hover:bg-amber-50/10">
                            <TableCell className="font-bold text-slate-500">#{cargo.consignmentId}</TableCell>
                            <TableCell>
                              <div className="font-bold text-slate-800">{cargo.tenNguoiGui}</div>
                              <div className="text-xs text-slate-400 font-bold mt-0.5">{cargo.soDienThoaiNguoiGui}</div>
                            </TableCell>
                            <TableCell className="font-bold text-slate-800">{cargo.diemGui} ➔ {cargo.diemNhan}</TableCell>
                            <TableCell className="font-black text-emerald-650">{FormatUtil.formatCurrency(cargo.tongTien)}</TableCell>
                            <TableCell className="text-slate-600 font-semibold max-w-[200px] truncate" title={cargo.lyDoHuy}>
                              {cargo.lyDoHuy || 'Không có lý do'}
                            </TableCell>
                            <TableCell>
                              {cargo.driverInfo ? (
                                <span className="text-xs text-slate-700 font-bold">{cargo.driverInfo.split('•')[0]}</span>
                              ) : (
                                <span className="text-xs text-slate-400 italic font-bold">Chưa gán</span>
                              )}
                            </TableCell>
                            <TableCell className="text-end">
                              <div className="flex justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveCancel(cargo.consignmentId, true)}
                                  className="bg-green-650 hover:bg-green-700 text-white font-extrabold h-8 rounded-lg text-xs px-3 border-none flex items-center gap-1 shadow-sm"
                                >
                                  ✓ Đồng ý
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleApproveCancel(cargo.consignmentId, false)}
                                  className="h-8 rounded-lg text-xs px-2.5 border-none font-bold"
                                >
                                  Từ chối
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* ====================================================== */}
      {/* DETAILED CARGO DIALOG */}
      {/* ====================================================== */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl rounded-2xl bg-white border border-slate-200 p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="bg-slate-900 text-white p-6 pb-4">
            <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
              <Package className="h-5 w-5 text-sky-400" />
              Chi tiết đơn ký gửi #{selectedCargo?.consignmentId}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4 text-sm font-semibold">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-slate-400 uppercase block tracking-wider mb-0.5">Loại dịch vụ</label>
                <div className="font-extrabold text-slate-800">{selectedCargo?.loaiDichVu === 'van_tai' ? '🚚 Vận tải riêng' : '🚌 Gửi kèm'}</div>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase block tracking-wider mb-0.5">Hành trình</label>
                <div className="font-extrabold text-slate-800 flex items-center gap-1">{selectedCargo?.diemGui} ➔ {selectedCargo?.diemNhan}</div>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase block tracking-wider mb-0.5">Người gửi</label>
                <div className="text-slate-700">{selectedCargo?.tenNguoiGui} - {selectedCargo?.soDienThoaiNguoiGui}</div>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase block tracking-wider mb-0.5">Người nhận</label>
                <div className="text-slate-700">{selectedCargo?.tenNguoiNhan} - {selectedCargo?.soDienThoaiNguoiNhan}</div>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase block tracking-wider mb-0.5">Địa chỉ gửi</label>
                <div className="text-slate-600">{selectedCargo?.diaChiGuiChiTiet}</div>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase block tracking-wider mb-0.5">Địa chỉ nhận</label>
                <div className="text-slate-600">{selectedCargo?.diaChiNhanChiTiet}</div>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase block tracking-wider mb-0.5">Loại hàng</label>
                <div className="text-slate-700">{getLoaiHangLabel(selectedCargo?.loaiHangHoa)}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase block tracking-wider mb-0.5">Trọng lượng</label>
                  <div className="text-slate-700">{selectedCargo?.trongLuong} kg</div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase block tracking-wider mb-0.5">Số lượng</label>
                  <div className="text-slate-700">{selectedCargo?.soLuong} kiện</div>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase block tracking-wider mb-0.5">Cước phí</label>
                <div className="text-[#004b87] font-black">{FormatUtil.formatCurrency(selectedCargo?.giaCuoc)}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase block tracking-wider mb-0.5">Bảo hiểm</label>
                  <div className="text-slate-700">{FormatUtil.formatCurrency(selectedCargo?.giaBAO_HIEM)}</div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase block tracking-wider mb-0.5">Tổng cộng</label>
                  <div className="text-emerald-650 font-black">{FormatUtil.formatCurrency(selectedCargo?.tongTien)}</div>
                </div>
              </div>
              {selectedCargo?.driverInfo && (
                <div className="md:col-span-2">
                  <label className="text-[10px] text-slate-400 uppercase block tracking-wider mb-0.5">Tài xế / Xe được gán</label>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700">{selectedCargo.driverInfo}</div>
                </div>
              )}
              {selectedCargo?.viTriHienTai && (
                <div className="md:col-span-2">
                  <label className="text-[10px] text-slate-400 uppercase block tracking-wider mb-0.5">Vị trí hiện tại</label>
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 font-extrabold flex items-center gap-1.5">
                    📍 {selectedCargo.viTriHienTai}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowDetailModal(false)} className="rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-100 h-10 px-5 shadow-none">
              Đóng
            </Button>
            {selectedCargo?.loaiDichVu === 'van_tai' && selectedCargo?.trangThaiKyGui === 'dang_tim_xe_trong' && (
              <Button
                onClick={() => {
                  setShowDetailModal(false);
                  handleOpenAssignModal(selectedCargo);
                }}
                className="bg-[#004b87] hover:bg-[#003c6c] text-white font-extrabold h-10 px-5 rounded-xl border-none"
              >
                🚚 Gán Xe & Tài xế
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====================================================== */}
      {/* DRIVER ASSIGN DIALOG */}
      {/* ====================================================== */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="max-w-md rounded-2xl bg-white border border-slate-200 p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="bg-slate-900 text-white p-6 pb-4">
            <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
              <Truck className="h-5 w-5 text-sky-400" />
              Gán xe tải & Tài xế cho đơn #{selectedCargo?.consignmentId}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssignSubmit}>
            <div className="p-6 space-y-4">
              <div className="bg-sky-50 border border-sky-100 p-3 rounded-xl text-xs text-sky-800 font-semibold leading-relaxed">
                <strong>Yêu cầu:</strong> {selectedCargo?.loaiXeVanTai === 'truck_30t' ? 'Xe tải 30 Tấn' : selectedCargo?.loaiXeVanTai === 'truck_10t' ? 'Xe tải 10 Tấn' : 'Xe tải 5 Tấn'} <br />
                <strong>Hành trình:</strong> {selectedCargo?.diemGui} → {selectedCargo?.diemNhan}
              </div>

              {/* Chọn xe tải từ DB */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Chọn xe tải khả dụng *</label>
                {vehicles.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 font-bold">Không có xe tải trống trong hệ thống</div>
                ) : (
                  <select className={selectCls} value={selectedVehicleId} onChange={e => {
                    setSelectedVehicleId(e.target.value);
                    const v = vehicles.find(vv => String(vv.maPhuongTien) === e.target.value);
                    const matchDriver = drivers.find(d => d.bienSoXe === v?.bienSoXe);
                    if (matchDriver) setSelectedDriverId(String(matchDriver.maNguoiDung));
                  }} required>
                    <option value="">-- Chọn xe tải --</option>
                    {vehicles.filter(v => v.loaiXe === selectedCargo?.loaiXeVanTai).length === 0 ? (
                      <option disabled>Không có xe tải nào phù hợp tải trọng yêu cầu</option>
                    ) : (
                      vehicles.filter(v => v.loaiXe === selectedCargo?.loaiXeVanTai).map(v => (
                        <option key={v.maPhuongTien} value={v.maPhuongTien}>
                          {v.bienSoXe} | {v.nhanHieu} | {v.loaiXe === 'truck_10t' ? '10 Tấn' : v.loaiXe === 'truck_5t' ? '5 Tấn' : '30 Tấn'}
                          {v.tenTaiXe ? ` | Tài xế: ${v.tenTaiXe}` : ' | Chưa có tài xế'}
                        </option>
                      ))
                    )}
                  </select>
                )}
              </div>

              {/* Chọn tài xế từ DB */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Chọn tài xế phụ trách *</label>
                {loadingDrivers ? (
                  <div className="flex justify-center py-2"><div className="h-5 w-5 border-2 border-[#004b87] border-t-transparent rounded-full animate-spin" /></div>
                ) : drivers.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 font-bold">Không có tài xế trong hệ thống</div>
                ) : (
                  <select className={selectCls} value={selectedDriverId} onChange={e => setSelectedDriverId(e.target.value)} required>
                    <option value="">-- Chọn tài xế --</option>
                    {drivers.map(drv => (
                      <option key={drv.maNguoiDung} value={drv.maNguoiDung}>
                        {drv.tenNguoiDung} | {drv.soDienThoai}
                        {drv.bienSoXe ? ` | Xe: ${drv.bienSoXe}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <DialogFooter className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAssignModal(false)} className="rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-100 h-10 px-5 shadow-none">
                Hủy
              </Button>
              <Button type="submit" disabled={submittingAssign || loadingDrivers || vehicles.length === 0} className="bg-[#004b87] hover:bg-[#003b6b] text-white font-extrabold h-10 px-5 rounded-xl border-none">
                {submittingAssign ? '⏳ Đang gán...' : '✅ Xác nhận gán'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SupportCargoPage;
