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
  Package, Calendar, Truck, Check, X, RefreshCw, MapPin, 
  Clock, Play, Inbox, ClipboardList, AlertTriangle 
} from 'lucide-react';

const API = 'http://localhost:5000/api';

const selectCls = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm focus:border-[#004b87] focus:outline-none focus:ring-2 focus:ring-[#004b87]/15 transition-all";
const inputCls = selectCls;

function DriverCargoPage({ defaultTab = 'cargo' }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Tabs: 'cargo', 'schedule', 'trip-status'
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Cargo states
  const [cargoList, setCargoList] = useState([]);
  const [loadingCargo, setLoadingCargo] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, active, completed
  const [selectedCargo, setSelectedCargo] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newLocation, setNewLocation] = useState('');

  // Trip schedules states
  const [trips, setTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(false);

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
    setUserName(user?.name || 'Driver');
    setUserId(user?.id);
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    if (userId) {
      if (activeTab === 'cargo') {
        fetchCargo();
      } else if (activeTab === 'schedule' || activeTab === 'trip-status') {
        fetchTrips();
      }
    }
  }, [userId, activeTab]);

  const token = () => StorageUtil.getToken();
  const headers = () => ({ Authorization: `Bearer ${token()}` });

  // Fetch Driver Cargo từ DB thực sự
  const fetchCargo = async () => {
    try {
      setLoadingCargo(true);
      const res = await axios.get(`${API}/cargo/driver/consignments`, { headers: headers() });
      setCargoList(res.data);
    } catch (err) {
      console.error('Lỗi tải danh sách vận đơn:', err);
      setCargoList([]);
    } finally {
      setLoadingCargo(false);
    }
  };

  // Fetch Assigned Trips từ DB
  const fetchTrips = async () => {
    try {
      setLoadingTrips(true);
      const res = await axios.get(`${API}/trips?driverId=${userId}`, { headers: headers() });
      setTrips(res.data || []);
    } catch (err) {
      console.error('Lỗi tải lịch trình:', err);
      setTrips([]);
    } finally {
      setLoadingTrips(false);
    }
  };

  // Confirm/Accept Cargo
  const handleConfirmCargo = async (consignmentId) => {
    if (!window.confirm('Xác nhận nhận vận chuyển đơn ký gửi này?')) return;

    try {
      const driver = AuthUtil.getCurrentUser();
      const driverName = driver?.name || 'Tài xế';
      const driverPhone = driver?.phone || '';
      const payload = {
        trangThaiKyGui: 'da_xac_nhan',
        maTaiXe: userId,
        driverInfo: `${driverName} (SĐT: ${driverPhone || 'N/A'})`,
        viTriHienTai: 'Tài xế đã xác nhận nhận hàng, chờ bàn giao'
      };

      await axios.put(`${API}/cargo/consignment/${consignmentId}/status`, payload);
      alert('✅ Đã xác nhận nhận đơn thành công! Khách hàng sẽ được thông báo.');
      fetchCargo();
    } catch (err) {
      console.error('Lỗi xác nhận đơn:', err);
      alert('Có lỗi khi xác nhận đơn. Vui lòng thử lại.');
    }
  };

  // Cập nhật trạng thái vận chuyển
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setUpdatingStatus(true);

    try {
      const payload = {
        trangThaiKyGui: newStatus,
        viTriHienTai: newLocation
      };

      await axios.put(`${API}/cargo/consignment/${selectedCargo.consignmentId || selectedCargo.id}/status`, payload);
      setShowStatusModal(false);
      alert('✅ Đã cập nhật trạng thái vận đơn thành công!');
      fetchCargo();
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái:', err);
      alert('Có lỗi khi cập nhật trạng thái.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Cập nhật trạng thái chuyến xe
  const handleUpdateTripStatus = async (tripId, currentStatus) => {
    let nextStatus = 'da_len_lich';
    if (currentStatus === 'da_len_lich') nextStatus = 'dang_khoi_hanh';
    else if (currentStatus === 'dang_khoi_hanh') nextStatus = 'da_hoan_thanh';
    else return;

    const labelMap = { dang_khoi_hanh: 'Đang khởi hành', da_hoan_thanh: 'Đã hoàn thành' };
    if (!window.confirm(`Xác nhận cập nhật trạng thái chuyến sang: ${labelMap[nextStatus]}?`)) return;

    try {
      await axios.put(`${API}/trips/${tripId}`, { trangThaiChuyen: nextStatus }, { headers: headers() });
      fetchTrips();
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái chuyến xe:', err);
      setTrips(trips.map(t => t.maChuyenXe === tripId ? { ...t, trangThaiChuyen: nextStatus } : t));
    }
  };

  const openStatusModal = (cargo) => {
    setSelectedCargo(cargo);
    setNewStatus(cargo.trangThaiKyGui);
    setNewLocation(cargo.viTriHienTai || '');
    setShowStatusModal(true);
  };

  const getStatusBadge = (status) => {
    const map = {
      dang_cho_xac_nhan: { text: 'Chờ tài xế duyệt', variant: 'warning' },
      dang_tim_xe_trong: { text: 'Chờ gán xe tải', variant: 'info' },
      da_xac_nhan: { text: 'Đã xác nhận', variant: 'info' },
      received_at_station: { text: 'Đã nhận tại trạm', variant: 'warning' },
      in_transit: { text: 'Đang vận chuyển', variant: 'warning' },
      delivered: { text: 'Đã giao hàng', variant: 'success' },
      failed: { text: 'Giao thất bại', variant: 'destructive' }
    };
    const res = map[status] || { text: status, variant: 'secondary' };
    return <Badge variant={res.variant} className="font-extrabold rounded-lg text-xs px-2.5 py-0.5">{res.text}</Badge>;
  };

  const getTripStatusBadge = (status) => {
    const map = {
      da_len_lich: { text: 'Đã lên lịch', variant: 'secondary' },
      dang_khoi_hanh: { text: 'Đang chạy', variant: 'info' },
      da_hoan_thanh: { text: 'Đã hoàn thành', variant: 'success' }
    };
    const res = map[status] || { text: status, variant: 'secondary' };
    return <Badge variant={res.variant} className="font-extrabold rounded-lg text-xs px-2.5 py-0.5">{res.text}</Badge>;
  };

  // Filter cargo list based on tab filters
  const getFilteredCargo = () => {
    return cargoList.filter(item => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'pending') return item.trangThaiKyGui === 'dang_cho_xac_nhan';
      if (filterStatus === 'active') return ['da_xac_nhan', 'received_at_station', 'in_transit'].includes(item.trangThaiKyGui);
      if (filterStatus === 'completed') return item.trangThaiKyGui === 'delivered' || item.trangThaiKyGui === 'failed';
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
                {activeTab === 'cargo' && <Package className="h-8 w-8 text-[#004b87]" />}
                {activeTab === 'schedule' && <Calendar className="h-8 w-8 text-[#004b87]" />}
                {activeTab === 'trip-status' && <Truck className="h-8 w-8 text-[#004b87]" />}
                {activeTab === 'cargo' && 'Phê duyệt & Vận chuyển Ký gửi'}
                {activeTab === 'schedule' && 'Lịch trình chạy được phân công'}
                {activeTab === 'trip-status' && 'Cập nhật trạng thái hành trình'}
              </h1>
              <p className="text-slate-500 text-sm font-semibold mt-1">
                {activeTab === 'cargo' && 'Quản lý yêu cầu ký gửi hành lý và vận đơn của khách hàng'}
                {activeTab === 'schedule' && 'Xem thông tin các chuyến xe được chỉ định chạy trong ngày của bạn'}
                {activeTab === 'trip-status' && 'Cập nhật nhanh tiến trình di chuyển của chuyến chạy'}
              </p>
            </div>

            {/* Quick Navigation Tabs */}
            <div className="flex flex-wrap gap-2 p-1 bg-slate-100/80 backdrop-blur rounded-2xl w-fit border border-slate-200/50">
              {[
                ['cargo', '📦 Xác nhận ký gửi'],
                ['schedule', '📅 Lịch trình chạy'],
                ['trip-status', '🛣️ Cập nhật hành trình']
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
                    {label}
                  </button>
                );
              })}
            </div>

            {/* ====================================================== */}
            {/* CARGO TAB CONTENT */}
            {/* ====================================================== */}
            {activeTab === 'cargo' && (
              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="text-lg font-extrabold text-slate-800">Danh sách đơn ký gửi cần vận chuyển</CardTitle>
                  </div>
                  
                  {/* Status Filters */}
                  <div className="flex flex-wrap gap-1.5 bg-slate-100/80 p-1 rounded-2xl w-fit border border-slate-200/50">
                    {[
                      { key: 'all', label: 'Tất cả' },
                      { key: 'pending', label: 'Chờ xác nhận' },
                      { key: 'active', label: 'Đang chạy' },
                      { key: 'completed', label: 'Hoàn thành/Hủy' }
                    ].map(f => (
                      <button
                        key={f.key}
                        onClick={() => setFilterStatus(f.key)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border-none ${
                          filterStatus === f.key ? 'bg-white text-[#004b87] shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingCargo ? (
                    <div className="flex justify-center py-16">
                      <div className="h-8 w-8 border-4 border-[#004b87] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : getFilteredCargo().length === 0 ? (
                    <div className="text-center py-16 text-slate-400 font-semibold">
                      <Inbox className="h-8 w-8 mx-auto mb-2 text-slate-350" />
                      Không tìm thấy yêu cầu ký gửi nào
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="font-extrabold text-slate-600">Mã đơn</TableHead>
                          <TableHead className="font-extrabold text-slate-600">Dịch vụ</TableHead>
                          <TableHead className="font-extrabold text-slate-600">Hành trình</TableHead>
                          <TableHead className="font-extrabold text-slate-600">Thông tin hàng hóa</TableHead>
                          <TableHead className="font-extrabold text-slate-600">Khách hàng</TableHead>
                          <TableHead className="font-extrabold text-slate-600">Tổng tiền</TableHead>
                          <TableHead className="font-extrabold text-slate-600 text-center">Thanh toán</TableHead>
                          <TableHead className="font-extrabold text-slate-600 text-center">Trạng thái</TableHead>
                          <TableHead className="font-extrabold text-slate-600 text-end">Hành động</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getFilteredCargo().map(cargo => {
                          const orderId = cargo.consignmentId || cargo.id;
                          const isPaid = cargo.trangThaiThanhToan === 'paid';
                          const isPending = cargo.trangThaiKyGui === 'dang_cho_xac_nhan';
                          const isCancelled = cargo.trangThaiKyGui === 'failed';

                          return (
                            <TableRow key={orderId} className="hover:bg-slate-50/50">
                              <TableCell className="font-bold text-slate-500">#{orderId}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={cargo.loaiDichVu === 'gui_kem' ? 'secondary' : 'default'}
                                  className="font-bold rounded-lg text-xs"
                                >
                                  {cargo.loaiDichVu === 'gui_kem' ? '🚌 Gửi kèm' : '🚚 Vận tải'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-slate-800 font-bold flex items-center gap-1.5">
                                  {cargo.diemGui}
                                  <span>➔</span>
                                  {cargo.diemNhan}
                                </div>
                                <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                                  {cargo.ngayGui ? new Date(cargo.ngayGui).toLocaleDateString('vi-VN') : ''}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-bold text-slate-700 text-sm">
                                  {cargo.loaiHangHoa === 'bulky' && 'Hàng cồng kềnh'}
                                  {cargo.loaiHangHoa === 'documents' && 'Tài liệu'}
                                  {cargo.loaiHangHoa === 'fragile' && 'Hàng dễ vỡ'}
                                  {cargo.loaiHangHoa === 'motorcycle' && 'Xe máy'} 
                                  {` (${cargo.trongLuong} kg)`}
                                </div>
                                <div className="text-[11px] text-slate-400 font-semibold mt-0.5">SL: {cargo.soLuong} kiện</div>
                              </TableCell>
                              <TableCell>
                                <div className="font-bold text-slate-700">{cargo.tenNguoiGui || cargo.tenKhachHang}</div>
                                <div className="text-[11px] text-slate-400 font-semibold">{cargo.soDienThoaiNguoiGui}</div>
                              </TableCell>
                              <TableCell className="font-black text-[#004b87]">{FormatUtil.formatCurrency(cargo.tongTien)}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant={isPaid ? 'success' : 'secondary'} className="font-bold rounded-lg text-xs">
                                  {isPaid ? 'Đã trả' : 'Chưa trả'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">{getStatusBadge(cargo.trangThaiKyGui)}</TableCell>
                              <TableCell className="text-end">
                                <div className="flex justify-end gap-1.5">
                                  {isPending && (
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleConfirmCargo(orderId)}
                                      className="bg-green-650 hover:bg-green-700 text-white font-extrabold h-8 rounded-lg text-xs px-3 border-none flex items-center gap-1 shadow-sm"
                                    >
                                      <Check className="h-3 w-3" /> Duyệt đơn
                                    </Button>
                                  )}
                                  {!isPending && !isCancelled && (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => openStatusModal(cargo)}
                                      className="border-slate-200 text-slate-600 hover:bg-slate-50 font-bold h-8 rounded-lg text-xs px-2.5"
                                    >
                                      🔄 Cập nhật
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
            {/* SCHEDULES TAB CONTENT */}
            {/* ====================================================== */}
            {activeTab === 'schedule' && (
              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-extrabold text-slate-800">Danh sách chuyến chạy được phân công</CardTitle>
                  <Button variant="outline" size="sm" onClick={fetchTrips} className="border-slate-200 bg-white">
                    <RefreshCw className="h-4 w-4 mr-1.5" /> Làm mới
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingTrips ? (
                    <div className="flex justify-center py-16">
                      <div className="h-8 w-8 border-4 border-[#004b87] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : trips.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 font-semibold">
                      <Inbox className="h-8 w-8 mx-auto mb-2 text-slate-350" />
                      Bạn chưa được phân công chuyến chạy nào
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="font-extrabold text-slate-600">Mã chuyến</TableHead>
                          <TableHead className="font-extrabold text-slate-600">Hành trình</TableHead>
                          <TableHead className="font-extrabold text-slate-600">Thời gian chạy</TableHead>
                          <TableHead className="font-extrabold text-slate-600">Biển số xe</TableHead>
                          <TableHead className="font-extrabold text-slate-600 text-center">Ghế trống</TableHead>
                          <TableHead className="font-extrabold text-slate-600 text-center">Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trips.map(trip => (
                          <TableRow key={trip.maChuyenXe} className="hover:bg-slate-50/50">
                            <TableCell className="font-bold text-slate-500">#{trip.maChuyenXe}</TableCell>
                            <TableCell className="font-bold text-slate-800 flex items-center gap-1.5">
                              {trip.diemDi}
                              <span>➔</span>
                              {trip.diemDen}
                            </TableCell>
                            <TableCell className="font-semibold text-slate-600 text-sm">
                              {new Date(trip.thoiGianDi).toLocaleString('vi-VN')}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-black border-slate-300 text-slate-700 bg-slate-50 rounded-lg py-1 px-2.5">
                                {trip.bienSoXe}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-bold text-slate-650 text-center">{trip.soGheConTrong} ghế</TableCell>
                            <TableCell className="text-center">
                              {getTripStatusBadge(trip.trangThaiChuyen)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ====================================================== */}
            {/* TRIP STATUS UPDATE TAB CONTENT */}
            {/* ====================================================== */}
            {activeTab === 'trip-status' && (
              <div className="space-y-4">
                {loadingTrips ? (
                  <div className="flex justify-center py-16">
                    <div className="h-8 w-8 border-4 border-[#004b87] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : trips.length === 0 ? (
                  <Card className="border-slate-100 p-12 text-center text-slate-400 font-semibold">
                    <Inbox className="h-8 w-8 mx-auto mb-2 text-slate-350" />
                    Bạn không có chuyến chạy nào để cập nhật hành trình
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {trips.map(trip => {
                      const isCreated = trip.trangThaiChuyen === 'da_len_lich';
                      const isRunning = trip.trangThaiChuyen === 'dang_khoi_hanh';
                      const isDone = trip.trangThaiChuyen === 'da_hoan_thanh';

                      return (
                        <Card key={trip.maChuyenXe} className="border-slate-150 shadow-sm relative overflow-hidden bg-white/70">
                          <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between items-start mb-2 gap-2">
                              <div>
                                <h3 className="font-black text-slate-800 text-lg flex items-center gap-1.5">
                                  {trip.diemDi} ➔ {trip.diemDen}
                                </h3>
                                <small className="text-slate-400 font-bold">Chuyến #{trip.maChuyenXe} • Xe {trip.bienSoXe}</small>
                              </div>
                              {getTripStatusBadge(trip.trangThaiChuyen)}
                            </div>
                            
                            <p className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              Khởi hành: <strong>{new Date(trip.thoiGianDi).toLocaleString('vi-VN')}</strong>
                            </p>

                            <div className="h-px bg-slate-100" />

                            <div className="flex gap-2">
                              {isCreated && (
                                <Button 
                                  onClick={() => handleUpdateTripStatus(trip.maChuyenXe, 'da_len_lich')}
                                  className="bg-[#004b87] hover:bg-[#003d72] text-white font-black w-full py-2 border-none rounded-xl"
                                >
                                  ▶ Xuất bến (Khởi hành)
                                </Button>
                              )}
                              {isRunning && (
                                <Button 
                                  onClick={() => handleUpdateTripStatus(trip.maChuyenXe, 'dang_khoi_hanh')}
                                  className="bg-green-650 hover:bg-green-700 text-white font-black w-full py-2 border-none rounded-xl shadow-md shadow-green-500/10"
                                >
                                  ✓ Cập nhật đã đến nơi (Hoàn thành)
                                </Button>
                              )}
                              {isDone && (
                                <Button 
                                  disabled
                                  className="bg-slate-50 border border-slate-200 text-slate-400 font-bold w-full py-2 rounded-xl"
                                >
                                  ✓ Đã hoàn tất hành trình
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        </main>
      </div>

      {/* ====================================================== */}
      {/* STATUS UPDATE DIALOG */}
      {/* ====================================================== */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent className="max-w-md rounded-2xl bg-white border border-slate-200 p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="bg-slate-900 text-white p-6 pb-4">
            <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
              <Package className="h-5 w-5 text-sky-400" />
              Cập nhật vận đơn #{selectedCargo?.consignmentId || selectedCargo?.id}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateStatus}>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Trạng thái vận chuyển *</label>
                <select className={selectCls} value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  <option value="da_xac_nhan">Đã xác nhận (Chờ xếp lên xe)</option>
                  <option value="received_at_station">Đã nhận kho tại trạm gửi</option>
                  <option value="in_transit">Đang vận chuyển trên đường</option>
                  <option value="delivered">Đã giao hàng thành công</option>
                  <option value="failed">Hủy / Giao hàng thất bại</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Vị trí hiện tại (Lịch trình tracking) *</label>
                <input 
                  type="text" 
                  className={inputCls} 
                  placeholder="Ví dụ: Đang đi qua trạm trung chuyển Huế"
                  value={newLocation} 
                  onChange={e => setNewLocation(e.target.value)} 
                  required
                />
              </div>
            </div>
            <DialogFooter className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowStatusModal(false)} className="rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-100 h-10 px-5 shadow-none">
                Hủy
              </Button>
              <Button type="submit" disabled={updatingStatus} className="bg-[#004b87] hover:bg-[#003b6b] text-white font-extrabold h-10 px-5 rounded-xl border-none">
                {updatingStatus ? 'Đang lưu...' : 'Lưu cập nhật'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DriverCargoPage;
