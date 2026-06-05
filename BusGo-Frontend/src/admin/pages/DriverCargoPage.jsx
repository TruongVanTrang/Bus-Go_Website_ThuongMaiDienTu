import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthUtil, StorageUtil, FormatUtil } from '@/utils/helpers';
import { ROLE_MENU } from '@/utils/constants';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopbar from '../components/AdminTopbar';
import axios from 'axios';
import './AdminDashboard.css';

const API = 'http://localhost:5000/api';

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
      // API trả về các chuyến xe có maNhanVien = userId
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
      // Lấy biển số xe từ dữ liệu tài xế (hiện tại dùng driverInfo cũ nếu có)
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
      dang_cho_xac_nhan: { text: 'Chờ tài xế duyệt', class: 'bg-warning text-dark' },
      dang_tim_xe_trong: { text: 'Chờ gán xe tải', class: 'bg-info text-dark' },
      da_xac_nhan: { text: 'Đã xác nhận', class: 'bg-primary text-white' },
      received_at_station: { text: 'Đã nhận tại trạm', class: 'bg-purple text-white' },
      in_transit: { text: 'Đang vận chuyển', class: 'bg-indigo text-white' },
      delivered: { text: 'Đã giao hàng', class: 'bg-success text-white' },
      failed: { text: 'Đã hủy/Từ chối', class: 'bg-danger text-white' }
    };
    const res = map[status] || { text: status, class: 'bg-secondary text-white' };
    return <span className={`badge ${res.class}`}>{res.text}</span>;
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
              {activeTab === 'cargo' && '📦 Phê duyệt & Vận chuyển Ký gửi'}
              {activeTab === 'schedule' && '📅 Lịch trình chạy được phân công'}
              {activeTab === 'trip-status' && '🛣️ Cập nhật trạng thái hành trình'}
            </h1>

            {/* Quick Navigation Tabs inside content area */}
            <ul className="nav nav-tabs mb-4">
              <li className="nav-item">
                <button className={`nav-link ${activeTab === 'cargo' ? 'active' : ''}`} onClick={() => setActiveTab('cargo')}>
                  📦 Xác nhận ký gửi hàng
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>
                  📅 Lịch trình chạy
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link ${activeTab === 'trip-status' ? 'active' : ''}`} onClick={() => setActiveTab('trip-status')}>
                  🛣️ Cập nhật hành trình
                </button>
              </li>
            </ul>

            {/* ====================================================== */}
            {/* CARGO TAB CONTENT */}
            {/* ====================================================== */}
            {activeTab === 'cargo' && (
              <div className="card shadow-sm p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <p className="text-muted mb-0">Xem danh sách các đơn hàng ký gửi của khách cần xác nhận hoặc vận chuyển</p>
                  
                  {/* Status Filters */}
                  <div className="btn-group btn-group-sm">
                    <button className={`btn btn-outline-secondary ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>Tất cả</button>
                    <button className={`btn btn-outline-secondary ${filterStatus === 'pending' ? 'active' : ''}`} onClick={() => setFilterStatus('pending')}>Chờ xác nhận</button>
                    <button className={`btn btn-outline-secondary ${filterStatus === 'active' ? 'active' : ''}`} onClick={() => setFilterStatus('active')}>Đang chạy</button>
                    <button className={`btn btn-outline-secondary ${filterStatus === 'completed' ? 'active' : ''}`} onClick={() => setFilterStatus('completed')}>Hoàn thành/Hủy</button>
                  </div>
                </div>

                {loadingCargo ? (
                  <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
                ) : getFilteredCargo().length === 0 ? (
                  <div className="text-center py-5 text-muted">Không tìm thấy yêu cầu ký gửi nào khớp với bộ lọc</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light text-xs uppercase text-slate-500">
                        <tr>
                          <th>Mã đơn</th>
                          <th>Dịch vụ</th>
                          <th>Hành trình</th>
                          <th>Thông tin hàng hóa</th>
                          <th>Khách hàng</th>
                          <th>Tổng tiền</th>
                          <th>Thanh toán</th>
                          <th>Trạng thái</th>
                          <th>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredCargo().map(cargo => {
                          const orderId = cargo.consignmentId || cargo.id;
                          const isPaid = cargo.trangThaiThanhToan === 'paid';
                          const isPending = cargo.trangThaiKyGui === 'dang_cho_xac_nhan';
                          const isCancelled = cargo.trangThaiKyGui === 'failed';

                          return (
                            <tr key={orderId}>
                              <td className="fw-bold">#{orderId}</td>
                              <td>
                                <span className={`badge ${cargo.loaiDichVu === 'gui_kem' ? 'bg-light text-dark' : 'bg-dark text-white'}`}>
                                  {cargo.loaiDichVu === 'gui_kem' ? '🚌 Gửi kèm' : '🚚 Vận tải'}
                                </span>
                              </td>
                              <td>
                                <div className="text-slate-800 fw-bold">{cargo.diemGui} ➔ {cargo.diemNhan}</div>
                                <div className="text-[11px] text-slate-400">
                                  {cargo.ngayGui ? new Date(cargo.ngayGui).toLocaleDateString('vi-VN') : ''}
                                </div>
                              </td>
                              <td>
                                <div className="fw-semibold text-slate-700">
                                  {cargo.loaiHangHoa === 'bulky' && 'Hàng cồng kềnh'}
                                  {cargo.loaiHangHoa === 'documents' && 'Tài liệu'}
                                  {cargo.loaiHangHoa === 'fragile' && 'Hàng dễ vỡ'}
                                  {cargo.loaiHangHoa === 'motorcycle' && 'Xe máy'} 
                                  {` (${cargo.trongLuong} kg)`}
                                </div>
                                <div className="text-[11px] text-slate-500">SL: {cargo.soLuong} kiện</div>
                              </td>
                              <td>
                                <div className="fw-bold text-slate-700">{cargo.tenNguoiGui || cargo.tenKhachHang}</div>
                                <div className="text-[11px] text-slate-400">{cargo.soDienThoaiNguoiGui}</div>
                              </td>
                              <td className="fw-bold text-slate-800">{FormatUtil.formatCurrency(cargo.tongTien)}</td>
                              <td>
                                <span className={`badge bg-${isPaid ? 'success' : 'secondary'}`}>
                                  {isPaid ? 'Đã trả' : 'Chưa trả'}
                                </span>
                              </td>
                              <td>{getStatusBadge(cargo.trangThaiKyGui)}</td>
                              <td>
                                <div className="d-flex gap-1.5">
                                  {isPending && (
                                    <button 
                                      className="btn btn-sm btn-primary py-1 px-2.5 text-xs fw-bold" 
                                      onClick={() => handleConfirmCargo(orderId)}
                                    >
                                      ✓ Duyệt đơn
                                    </button>
                                  )}
                                  {!isPending && !isCancelled && (
                                    <button 
                                      className="btn btn-sm btn-outline-secondary py-1 px-2 text-xs" 
                                      onClick={() => openStatusModal(cargo)}
                                    >
                                      🔄 Cập nhật
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
            {/* SCHEDULES TAB CONTENT */}
            {/* ====================================================== */}
            {activeTab === 'schedule' && (
              <div className="card shadow-sm p-4">
                <p className="text-muted mb-4">Danh sách chuyến xe (xe khách) hoặc tuyến chạy xe tải bạn được phân công điều khiển</p>
                {loadingTrips ? (
                  <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
                ) : trips.length === 0 ? (
                  <div className="text-center py-5 text-muted">Bạn chưa được phân công chuyến chạy nào</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Mã chuyến</th>
                          <th>Hành trình</th>
                          <th>Thời gian chạy</th>
                          <th>Biển số xe</th>
                          <th>Trạng thái xe</th>
                          <th>Ghế trống</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trips.map(trip => (
                          <tr key={trip.maChuyenXe}>
                            <td className="fw-bold">#{trip.maChuyenXe}</td>
                            <td className="fw-bold">{trip.diemDi} ➔ {trip.diemDen}</td>
                            <td>{new Date(trip.thoiGianDi).toLocaleString('vi-VN')}</td>
                            <td><span className="badge bg-dark px-2 py-1.5">{trip.bienSoXe}</span></td>
                            <td>
                              <span className={`badge bg-${trip.trangThaiChuyen === 'da_len_lich' ? 'secondary' : trip.trangThaiChuyen === 'dang_khoi_hanh' ? 'primary' : 'success'}`}>
                                {trip.trangThaiChuyen === 'da_len_lich' && 'Đã lên lịch'}
                                {trip.trangThaiChuyen === 'dang_khoi_hanh' && 'Đang chạy'}
                                {trip.trangThaiChuyen === 'da_hoan_thanh' && 'Đã hoàn thành'}
                              </span>
                            </td>
                            <td>{trip.soGheConTrong} ghế</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ====================================================== */}
            {/* TRIP STATUS UPDATE TAB CONTENT */}
            {/* ====================================================== */}
            {activeTab === 'trip-status' && (
              <div className="card shadow-sm p-4">
                <p className="text-muted mb-4">Cập nhật nhanh tiến trình di chuyển của chuyến xe để hành khách và người gửi hàng theo dõi hành trình thời gian thực</p>
                {loadingTrips ? (
                  <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
                ) : trips.length === 0 ? (
                  <div className="text-center py-5 text-muted">Bạn không có chuyến xe nào để cập nhật hành trình</div>
                ) : (
                  <div className="row g-4">
                    {trips.map(trip => {
                      const isCreated = trip.trangThaiChuyen === 'da_len_lich';
                      const isRunning = trip.trangThaiChuyen === 'dang_khoi_hanh';
                      const isDone = trip.trangThaiChuyen === 'da_hoan_thanh';

                      return (
                        <div className="col-md-6" key={trip.maChuyenXe}>
                          <div className="card border p-3.5 shadow-sm rounded-3">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                              <div>
                                <h5 className="fw-bold m-0 text-slate-800">{trip.diemDi} ➔ {trip.diemDen}</h5>
                                <small className="text-slate-500">Chuyến #{trip.maChuyenXe} • Xe {trip.bienSoXe}</small>
                              </div>
                              <span className={`badge px-2 py-1.5 ${isCreated ? 'bg-secondary' : isRunning ? 'bg-primary' : 'bg-success'}`}>
                                {isCreated ? 'Chờ xuất bến' : isRunning ? 'Đang chạy' : 'Đã hoàn thành'}
                              </span>
                            </div>
                            
                            <p className="text-xs text-slate-600 mb-4">
                              Khởi hành: <strong>{new Date(trip.thoiGianDi).toLocaleString('vi-VN')}</strong>
                            </p>

                            <div className="d-flex gap-2">
                              {isCreated && (
                                <button 
                                  className="btn btn-primary btn-sm fw-bold w-100 py-2" 
                                  onClick={() => handleUpdateTripStatus(trip.maChuyenXe, 'da_len_lich')}
                                >
                                  ▶ Xuất bến (Khởi hành)
                                </button>
                              )}
                              {isRunning && (
                                <button 
                                  className="btn btn-success btn-sm fw-bold w-100 py-2" 
                                  onClick={() => handleUpdateTripStatus(trip.maChuyenXe, 'dang_khoi_hanh')}
                                >
                                  ✓ Cập nhật đã đến nơi (Hoàn thành)
                                </button>
                              )}
                              {isDone && (
                                <button className="btn btn-outline-secondary btn-sm w-100 py-2" disabled>
                                  ✓ Đã hoàn tất hành trình
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
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
      {/* STATUS UPDATE MODAL */}
      {/* ====================================================== */}
      {showStatusModal && selectedCargo && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: '1050' }} onClick={() => setShowStatusModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">📦 Cập nhật vận đơn #{selectedCargo.consignmentId || selectedCargo.id}</h5>
                <button type="button" className="btn-close" onClick={() => setShowStatusModal(false)} />
              </div>
              <form onSubmit={handleUpdateStatus}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Trạng thái vận chuyển *</label>
                    <select className="form-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                      <option value="da_xac_nhan">Đã xác nhận (Chờ xếp lên xe)</option>
                      <option value="received_at_station">Đã nhận kho tại trạm gửi</option>
                      <option value="in_transit">Đang vận chuyển trên đường</option>
                      <option value="delivered">Đã giao hàng thành công</option>
                      <option value="failed">Hủy / Giao hàng thất bại</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Vị trí hiện tại (Lịch trình tracking) *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Ví dụ: Đang đi qua trạm trung chuyển Huế"
                      value={newLocation} 
                      onChange={e => setNewLocation(e.target.value)} 
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer border-top bg-light">
                  <button type="button" className="btn btn-secondary text-xs px-4 py-2" onClick={() => setShowStatusModal(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary text-xs px-4 py-2" disabled={updatingStatus}>
                    {updatingStatus ? 'Đang lưu...' : 'Lưu cập nhật'}
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

export default DriverCargoPage;
