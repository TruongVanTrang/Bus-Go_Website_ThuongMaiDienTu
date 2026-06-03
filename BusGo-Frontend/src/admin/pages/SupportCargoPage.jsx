import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthUtil, StorageUtil, FormatUtil } from '@/utils/helpers';
import { ROLE_MENU } from '@/utils/constants';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopbar from '../components/AdminTopbar';
import axios from 'axios';
import './AdminDashboard.css';

const API = 'http://localhost:5000/api';

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
      // Lọc những đơn có yeuCauHuy = 'pending'
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
    // Auto-select vehicle phù hợp loại yêu cầu
    const matchVehicle = vehicles.find(v =>
      (cargo.loaiXeVanTai === 'truck_5t' && v.loaiXe === 'truck_5t') ||
      (cargo.loaiXeVanTai === 'truck_10t' && v.loaiXe === 'truck_10t') ||
      (cargo.loaiXeVanTai === 'truck_30t' && v.loaiXe === 'truck_30t')
    );
    
    const vehicleId = matchVehicle?.maPhuongTien || vehicles[0]?.maPhuongTien || '';
    setSelectedVehicleId(vehicleId);

    // Auto-select tài xế chính của chiếc xe vừa được chọn
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
    if (yeuCauHuy === 'pending') return <span className="badge bg-warning text-dark animate-pulse">⏳ Chờ duyệt hủy</span>;
    const map = {
      dang_cho_xac_nhan: { text: 'Chờ tài xế duyệt', class: 'bg-warning text-dark' },
      dang_tim_xe_trong: { text: 'Chờ gán xe tải', class: 'bg-info text-dark' },
      da_xac_nhan: { text: 'Tài xế đã duyệt', class: 'bg-primary text-white' },
      received_at_station: { text: 'Đã nhận kho', class: 'bg-purple text-white' },
      in_transit: { text: 'Đang giao hàng', class: 'bg-indigo text-white' },
      delivered: { text: 'Đã giao hàng', class: 'bg-success text-white' },
      failed: { text: 'Đã hủy/Từ chối', class: 'bg-danger text-white' },
      da_huy: { text: 'Khách đã hủy', class: 'bg-danger text-white' }
    };
    const res = map[status] || { text: status, class: 'bg-secondary text-white' };
    return <span className={`badge ${res.class}`}>{res.text}</span>;
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
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  const menuItems = ROLE_MENU[userRole] || [];

  return (
    <div className="admin-dashboard">
      <AdminSidebar isOpen={sidebarOpen} userRole={userRole} menuItems={menuItems} onClose={() => setSidebarOpen(false)} />

      <div className="admin-main">
        <AdminTopbar userName={userName} userRole={userRole} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="admin-content">
          <div className="dashboard-content">
            <h1 className="page-title mb-4">
              {activeTab === 'cargo-assign' && '🚚 Phân phối & Điều phối xe Ký gửi'}
              {activeTab === 'ticket-lookup' && '🔍 Tra cứu thông tin đặt vé'}
              {activeTab === 'cancel-requests' && '🔴 Yêu cầu hủy đơn sau thanh toán'}
            </h1>

            {/* Sub Tabs */}
            <ul className="nav nav-tabs mb-4">
              <li className="nav-item">
                <button className={`nav-link ${activeTab === 'cargo-assign' ? 'active' : ''}`} onClick={() => setActiveTab('cargo-assign')}>
                  🚚 Phân phối xe ký gửi
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link ${activeTab === 'ticket-lookup' ? 'active' : ''}`} onClick={() => setActiveTab('ticket-lookup')}>
                  🔍 Tra cứu vé
                </button>
              </li>
              <li className="nav-item position-relative">
                <button className={`nav-link ${activeTab === 'cancel-requests' ? 'active' : ''}`} onClick={() => setActiveTab('cancel-requests')}>
                  🔴 Yêu cầu hủy đơn
                  {consignments.filter(c => c.yeuCauHuy === 'pending').length > 0 && (
                    <span className="badge bg-danger rounded-pill ms-1">
                      {consignments.filter(c => c.yeuCauHuy === 'pending').length}
                    </span>
                  )}
                </button>
              </li>
            </ul>

            {/* ====================================================== */}
            {/* CARGO ASSIGN TAB CONTENT */}
            {/* ====================================================== */}
            {activeTab === 'cargo-assign' && (
              <div className="card shadow-sm p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <p className="text-muted mb-0">Tất cả đơn ký gửi hàng trong hệ thống (gửi kèm xe khách & vận tải riêng)</p>
                  <button className="btn btn-sm btn-outline-primary" onClick={fetchConsignments}>🔄 Làm mới</button>
                </div>

                {/* Filter Buttons */}
                <div className="btn-group btn-group-sm mb-3">
                  {[
                    { key: 'all', label: 'Tất cả' },
                    { key: 'van_tai_pending', label: '🚚 Chờ gán xe tải' },
                    { key: 'gui_kem_pending', label: '🚌 Chờ tài xế duyệt' },
                    { key: 'paid', label: '✅ Đã thanh toán' },
                    { key: 'cancelled', label: '❌ Đã hủy' },
                  ].map(f => (
                    <button
                      key={f.key}
                      className={`btn btn-outline-secondary ${filterStatus === f.key ? 'active' : ''}`}
                      onClick={() => setFilterStatus(f.key)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {loadingCargo ? (
                  <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
                ) : getFilteredConsignments().length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <div style={{ fontSize: '3rem' }}>📦</div>
                    <p>Không có đơn hàng nào phù hợp với bộ lọc</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Mã đơn</th>
                          <th>Loại dịch vụ</th>
                          <th>Hành trình</th>
                          <th>Thông tin hàng</th>
                          <th>Tài xế / Xe</th>
                          <th>Thanh toán</th>
                          <th>Trạng thái</th>
                          <th>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredConsignments().map(cargo => {
                          const orderId = cargo.consignmentId || cargo.id;
                          const isTruck = cargo.loaiDichVu === 'van_tai';
                          const isUnassigned = cargo.trangThaiKyGui === 'dang_tim_xe_trong';
                          const isPaid = cargo.trangThaiThanhToan === 'paid';
                          const isCancelled = cargo.trangThaiKyGui === 'failed';

                          return (
                            <tr key={orderId} className={isCancelled ? 'table-danger' : cargo.yeuCauHuy === 'pending' ? 'table-warning' : ''}>
                              <td className="fw-bold">#{orderId}</td>
                              <td>
                                <span className={`badge ${isTruck ? 'bg-dark text-white' : 'bg-primary text-white'}`}>
                                  {isTruck ? '🚚 Vận tải riêng' : '🚌 Gửi kèm xe khách'}
                                </span>
                              </td>
                              <td>
                                <div className="fw-bold text-slate-800">{cargo.diemGui} ➔ {cargo.diemNhan}</div>
                                <div className="text-xs text-slate-500">
                                  {cargo.tenNguoiNhan} ({cargo.soDienThoaiNguoiNhan})
                                </div>
                              </td>
                              <td>
                                <div className="fw-semibold text-slate-700">{getLoaiHangLabel(cargo.loaiHangHoa)}</div>
                                <div className="text-xs text-slate-500">{cargo.trongLuong} kg • {cargo.soLuong} kiện</div>
                                {isTruck && (
                                  <span className="badge bg-secondary text-white mt-1">
                                    {cargo.loaiXeVanTai === 'truck_30t' ? '30 Tấn' : cargo.loaiXeVanTai === 'truck_10t' ? '10 Tấn' : '5 Tấn'}
                                  </span>
                                )}
                              </td>
                              <td>
                                {cargo.driverInfo ? (
                                  <div>
                                    <div className="fw-semibold text-slate-700 text-xs">{cargo.driverInfo.split('•')[0]}</div>
                                    <div className="text-xs text-slate-400">{cargo.driverInfo.split('•').slice(1).join('•').trim()}</div>
                                  </div>
                                ) : (
                                  <span className="text-danger text-xs italic">Chưa phân phối</span>
                                )}
                              </td>
                              <td>
                                <span className={`badge bg-${isPaid ? 'success' : 'secondary'}`}>
                                  {isPaid ? 'Đã thanh toán' : 'Chờ thanh toán'}
                                </span>
                              </td>
                              <td>{getStatusBadge(cargo.trangThaiKyGui, cargo.yeuCauHuy)}</td>
                              <td>
                                <div className="d-flex gap-1 flex-wrap">
                                  <button
                                    className="btn btn-sm btn-outline-info py-1 px-2 text-xs"
                                    onClick={() => handleViewDetail(cargo)}
                                  >
                                    👁 Chi tiết
                                  </button>
                                  {isTruck && isUnassigned && !isCancelled && (
                                    <button
                                      className="btn btn-sm btn-primary py-1 px-2 text-xs fw-bold"
                                      onClick={() => handleOpenAssignModal(cargo)}
                                    >
                                      🚚 Gán xe & Tài xế
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ====================================================== */}
            {/* TICKET LOOKUP TAB CONTENT */}
            {/* ====================================================== */}
            {activeTab === 'ticket-lookup' && (
              <div className="card shadow-sm p-4">
                <p className="text-muted mb-4">Tra cứu nhanh thông tin đặt vé qua mã vé hoặc tên hành khách</p>
                <form onSubmit={handleTicketSearch} className="row g-3 align-items-center mb-4">
                  <div className="col-md-8">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Nhập mã vé hoặc Tên hành khách..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <button type="submit" className="btn btn-primary w-100 fw-bold py-2" disabled={searchingTicket}>
                      {searchingTicket ? 'Đang tra cứu...' : '🔍 Tìm kiếm'}
                    </button>
                  </div>
                </form>

                {ticketDetails === 'not_found' && (
                  <div className="alert alert-warning">Không tìm thấy thông tin vé phù hợp.</div>
                )}
                {ticketDetails && ticketDetails !== 'not_found' && (
                  <div className="border rounded-4 p-4 bg-white shadow-sm">
                    <div className="d-flex justify-content-between border-bottom pb-3 mb-3">
                      <h4 className="fw-black text-slate-800 m-0">Vé #{ticketDetails.maVe}</h4>
                      <span className={`badge align-self-start px-2 py-1.5 bg-${ticketDetails.trangThaiVe === 'da_thanh_toan' ? 'success' : 'warning'}`}>
                        {ticketDetails.trangThaiVe === 'da_thanh_toan' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                      </span>
                    </div>
                    <div className="row g-3 text-sm">
                      <div className="col-md-6">
                        <span className="text-slate-400 block text-xs">Hành khách</span>
                        <strong>{ticketDetails.hoTenHanhKhach}</strong>
                      </div>
                      <div className="col-md-6">
                        <span className="text-slate-400 block text-xs">Hành trình</span>
                        <strong>{ticketDetails.diemDon} ➔ {ticketDetails.diemTra}</strong>
                      </div>
                      <div className="col-md-6">
                        <span className="text-slate-400 block text-xs">Giá vé</span>
                        <strong>{FormatUtil.formatCurrency(ticketDetails.giaVe)}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ====================================================== */}
            {/* CANCEL REQUESTS TAB CONTENT */}
            {/* ====================================================== */}
            {activeTab === 'cancel-requests' && (
              <div className="card shadow-sm p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <p className="text-muted mb-0">
                    Các đơn ký gửi <strong>đã thanh toán</strong> mà khách hàng yêu cầu hủy — cần nhân viên xem xét và phê duyệt
                  </p>
                  <button className="btn btn-sm btn-outline-secondary" onClick={fetchCancelRequests}>🔄 Làm mới</button>
                </div>

                {loadingCancelReqs ? (
                  <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
                ) : cancelRequests.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <div style={{ fontSize: '3rem' }}>✅</div>
                    <p>Không có yêu cầu hủy đơn nào đang chờ xử lý</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-warning">
                        <tr>
                          <th>Mã đơn</th>
                          <th>Khách hàng</th>
                          <th>Hành trình</th>
                          <th>Số tiền đã trả</th>
                          <th>Lý do hủy</th>
                          <th>Tài xế được gán</th>
                          <th>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cancelRequests.map(cargo => (
                          <tr key={cargo.consignmentId}>
                            <td className="fw-bold">#{cargo.consignmentId}</td>
                            <td>
                              <div className="fw-bold">{cargo.tenNguoiGui}</div>
                              <div className="text-xs text-slate-500">{cargo.soDienThoaiNguoiGui}</div>
                            </td>
                            <td className="fw-bold">{cargo.diemGui} ➔ {cargo.diemNhan}</td>
                            <td className="fw-bold text-success">{FormatUtil.formatCurrency(cargo.tongTien)}</td>
                            <td className="text-slate-600">{cargo.lyDoHuy || 'Không có lý do'}</td>
                            <td>
                              {cargo.driverInfo ? (
                                <span className="text-xs text-slate-700">{cargo.driverInfo.split('•')[0]}</span>
                              ) : (
                                <span className="text-xs text-slate-400">Chưa gán</span>
                              )}
                            </td>
                            <td>
                              <div className="d-flex gap-1">
                                <button
                                  className="btn btn-sm btn-success px-2 py-1 text-xs fw-bold"
                                  onClick={() => handleApproveCancel(cargo.consignmentId, true)}
                                >
                                  ✓ Đồng ý hủy
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger px-2 py-1 text-xs"
                                  onClick={() => handleApproveCancel(cargo.consignmentId, false)}
                                >
                                  ✗ Từ chối
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ====================================================== */}
      {/* MODAL XEM CHI TIẾT ĐƠN */}
      {/* ====================================================== */}
      {showDetailModal && selectedCargo && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: '1050' }} onClick={() => setShowDetailModal(false)}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-bottom bg-primary text-white rounded-top-4">
                <h5 className="modal-title fw-bold">📦 Chi tiết đơn #{selectedCargo.consignmentId}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowDetailModal(false)} />
              </div>
              <div className="modal-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="text-xs text-slate-400 fw-bold uppercase">Loại dịch vụ</label>
                    <div className="fw-bold">{selectedCargo.loaiDichVu === 'van_tai' ? '🚚 Vận tải riêng' : '🚌 Gửi kèm xe khách'}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="text-xs text-slate-400 fw-bold uppercase">Hành trình</label>
                    <div className="fw-bold">{selectedCargo.diemGui} ➔ {selectedCargo.diemNhan}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="text-xs text-slate-400 fw-bold uppercase">Người gửi</label>
                    <div>{selectedCargo.tenNguoiGui} - {selectedCargo.soDienThoaiNguoiGui}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="text-xs text-slate-400 fw-bold uppercase">Người nhận</label>
                    <div>{selectedCargo.tenNguoiNhan} - {selectedCargo.soDienThoaiNguoiNhan}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="text-xs text-slate-400 fw-bold uppercase">Địa chỉ gửi</label>
                    <div>{selectedCargo.diaChiGuiChiTiet}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="text-xs text-slate-400 fw-bold uppercase">Địa chỉ nhận</label>
                    <div>{selectedCargo.diaChiNhanChiTiet}</div>
                  </div>
                  <div className="col-md-4">
                    <label className="text-xs text-slate-400 fw-bold uppercase">Loại hàng</label>
                    <div>{getLoaiHangLabel(selectedCargo.loaiHangHoa)}</div>
                  </div>
                  <div className="col-md-4">
                    <label className="text-xs text-slate-400 fw-bold uppercase">Trọng lượng</label>
                    <div>{selectedCargo.trongLuong} kg</div>
                  </div>
                  <div className="col-md-4">
                    <label className="text-xs text-slate-400 fw-bold uppercase">Số lượng</label>
                    <div>{selectedCargo.soLuong} kiện</div>
                  </div>
                  <div className="col-md-4">
                    <label className="text-xs text-slate-400 fw-bold uppercase">Cước phí</label>
                    <div className="fw-bold text-primary">{FormatUtil.formatCurrency(selectedCargo.giaCuoc)}</div>
                  </div>
                  <div className="col-md-4">
                    <label className="text-xs text-slate-400 fw-bold uppercase">Bảo hiểm</label>
                    <div>{FormatUtil.formatCurrency(selectedCargo.giaBAO_HIEM)}</div>
                  </div>
                  <div className="col-md-4">
                    <label className="text-xs text-slate-400 fw-bold uppercase">Tổng tiền</label>
                    <div className="fw-bold text-success">{FormatUtil.formatCurrency(selectedCargo.tongTien)}</div>
                  </div>
                  {selectedCargo.driverInfo && (
                    <div className="col-12">
                      <label className="text-xs text-slate-400 fw-bold uppercase">Tài xế / Xe được gán</label>
                      <div className="p-2 bg-light rounded">{selectedCargo.driverInfo}</div>
                    </div>
                  )}
                  {selectedCargo.viTriHienTai && (
                    <div className="col-12">
                      <label className="text-xs text-slate-400 fw-bold uppercase">Vị trí hiện tại</label>
                      <div className="p-2 bg-success bg-opacity-10 rounded text-success fw-bold">📍 {selectedCargo.viTriHienTai}</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>Đóng</button>
                {selectedCargo.loaiDichVu === 'van_tai' && selectedCargo.trangThaiKyGui === 'dang_tim_xe_trong' && (
                  <button
                    className="btn btn-primary fw-bold"
                    onClick={() => {
                      setShowDetailModal(false);
                      handleOpenAssignModal(selectedCargo);
                    }}
                  >
                    🚚 Gán Xe & Tài xế
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* MODAL GÁN TÀI XẾ XE TẢI */}
      {/* ====================================================== */}
      {showAssignModal && selectedCargo && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: '1050' }} onClick={() => setShowAssignModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">🚚 Gán xe tải & Tài xế cho đơn #{selectedCargo.consignmentId}</h5>
                <button type="button" className="btn-close" onClick={() => setShowAssignModal(false)} />
              </div>
              <form onSubmit={handleAssignSubmit}>
                <div className="modal-body p-4">
                  <div className="alert alert-info py-2 mb-3 text-sm">
                    <strong>Yêu cầu:</strong> {selectedCargo.loaiXeVanTai === 'truck_30t' ? 'Xe tải 30 Tấn' : selectedCargo.loaiXeVanTai === 'truck_10t' ? 'Xe tải 10 Tấn' : 'Xe tải 5 Tấn'} •
                    Hành trình: {selectedCargo.diemGui} → {selectedCargo.diemNhan}
                  </div>

                  {/* Chọn xe tải từ DB */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">Chọn xe tải khả dụng *</label>
                    {vehicles.length === 0 ? (
                      <div className="alert alert-warning py-2 text-sm">Không có xe tải trống trong hệ thống</div>
                    ) : (
                      <select className="form-select" value={selectedVehicleId} onChange={e => {
                        setSelectedVehicleId(e.target.value);
                        // Auto-select tài xế gắn với xe
                        const v = vehicles.find(vv => String(vv.maPhuongTien) === e.target.value);
                        const matchDriver = drivers.find(d => d.bienSoXe === v?.bienSoXe);
                        if (matchDriver) setSelectedDriverId(String(matchDriver.maNguoiDung));
                      }} required>
                        <option value="">-- Chọn xe tải --</option>
                        {vehicles.filter(v => v.loaiXe === selectedCargo.loaiXeVanTai).length === 0 ? (
                          <option disabled>Không có xe tải nào phù hợp tải trọng yêu cầu</option>
                        ) : (
                          vehicles.filter(v => v.loaiXe === selectedCargo.loaiXeVanTai).map(v => (
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
                  <div className="mb-3">
                    <label className="form-label fw-bold">Chọn tài xế phụ trách *</label>
                    {loadingDrivers ? (
                      <div className="text-center py-2"><div className="spinner-border spinner-border-sm text-primary" /></div>
                    ) : drivers.length === 0 ? (
                      <div className="alert alert-warning py-2 text-sm">Không có tài xế trong hệ thống</div>
                    ) : (
                      <select className="form-select" value={selectedDriverId} onChange={e => setSelectedDriverId(e.target.value)} required>
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
                <div className="modal-footer border-top bg-light">
                  <button type="button" className="btn btn-secondary px-4 py-2" onClick={() => setShowAssignModal(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary px-4 py-2 fw-bold" disabled={submittingAssign || loadingDrivers || vehicles.length === 0}>
                    {submittingAssign ? '⏳ Đang gán...' : '✅ Xác nhận gán xe & Tài xế'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupportCargoPage;
