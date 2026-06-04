import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthUtil, StorageUtil } from '@/utils/helpers';
import { ROLE_MENU } from '@/utils/constants';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopbar from '../components/AdminTopbar';
import axios from 'axios';
import './AdminDashboard.css';

const API = 'http://localhost:5000/api';

function ReportsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [activeTab, setActiveTab] = useState('revenue');
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [revenue, setRevenue] = useState(null);
  const [routeStats, setRouteStats] = useState(null);
  const [ratings, setRatings] = useState(null);

  // Incident states
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveStatus, setResolveStatus] = useState('da_xu_ly');
  const [resolveNotes, setResolveNotes] = useState('');
  const [updateTripStatus, setUpdateTripStatus] = useState('');
  const [zoomImage, setZoomImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab') || 'revenue';

  useEffect(() => {
    const role = AuthUtil.getCurrentRole();
    const user = AuthUtil.getCurrentUser();
    if (!role) { navigate('/login'); return; }
    setUserRole(role); setUserName(user?.name || 'User');
  }, [navigate]);

  useEffect(() => {
    if (['revenue', 'routes', 'ratings', 'incidents'].includes(tabParam)) {
      setActiveTab(tabParam);
      fetchData(tabParam);
    } else {
      setActiveTab('revenue');
      fetchData('revenue');
    }
  }, [tabParam]);

  const token = () => StorageUtil.getToken();
  const headers = () => ({ Authorization: `Bearer ${token()}` });

  const fetchData = async (tab) => {
    setLoading(true);
    try {
      const params = `?from=${dateFrom}&to=${dateTo}`;
      if (tab === 'revenue') {
        const res = await axios.get(`${API}/admin/analytics/revenue${params}`, { headers: headers() });
        setRevenue(res.data);
      } else if (tab === 'routes') {
        const res = await axios.get(`${API}/admin/analytics/routes${params}`, { headers: headers() });
        setRouteStats(res.data);
      } else if (tab === 'ratings') {
        const res = await axios.get(`${API}/admin/analytics/ratings${params}`, { headers: headers() });
        setRatings(res.data);
      } else if (tab === 'incidents') {
        const res = await axios.get(`${API}/admin/incidents`, { headers: headers() });
        setIncidents(res.data || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSearch = () => fetchData(activeTab);
  
  const handleTabChange = (tab) => {
    navigate(`/admin/reports?tab=${tab}`);
  };

  const handleOpenResolveModal = (incident) => {
    setSelectedIncident(incident);
    setResolveStatus(incident.trangThaiSuCo || 'da_xu_ly');
    setResolveNotes(incident.ghiChu || '');
    setUpdateTripStatus('');
    setShowResolveModal(true);
  };

  const handleResolveIncident = async (e) => {
    e.preventDefault();
    if (!selectedIncident) return;
    setSubmitting(true);
    try {
      await axios.put(`${API}/admin/incidents/${selectedIncident.maSuCo}/resolve`, {
        trangThaiSuCo: resolveStatus,
        ghiChuGiaiQuyet: resolveNotes,
        tripStatus: resolveStatus === 'da_xu_ly' ? updateTripStatus : undefined
      }, { headers: headers() });
      
      setShowResolveModal(false);
      fetchData('incidents');
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi xử lý sự cố. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (n) => n ? Number(n).toLocaleString('vi-VN') : '0';

  const menuItems = ROLE_MENU[userRole] || [];

  const filteredIncidents = incidents ? incidents.filter(inc => {
    if (!inc.thoiGianTao) return true;
    const date = new Date(inc.thoiGianTao).toISOString().split('T')[0];
    return date >= dateFrom && date <= dateTo;
  }) : [];

  return (
    <div className="admin-dashboard">
      <AdminSidebar isOpen={sidebarOpen} userRole={userRole} menuItems={menuItems} onClose={() => setSidebarOpen(false)} />
      <div className="admin-main">
        <AdminTopbar userName={userName} userRole={userRole} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="admin-content">
          <div className="dashboard-content">
            <h1 className="page-title mb-4">📊 Thống kê & Báo cáo</h1>

            {/* Bộ lọc thời gian */}
            <div className="card shadow-sm p-3 mb-4">
              <div className="d-flex gap-3 align-items-end flex-wrap">
                <div>
                  <label className="form-label fw-semibold mb-1">Từ ngày</label>
                  <input className="form-control" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                </div>
                <div>
                  <label className="form-label fw-semibold mb-1">Đến ngày</label>
                  <input className="form-control" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                </div>
                <button className="btn btn-primary" onClick={handleSearch}>Xem báo cáo</button>
              </div>
            </div>

            {/* Tabs */}
            <ul className="nav nav-tabs mb-4">
              {[
                ['revenue', '💰 Doanh thu'],
                ['routes', '🛣️ Tuyến đường'],
                ['ratings', '⭐ Đánh giá'],
                ['incidents', '⚠️ Sự cố vận hành']
              ].map(([key, label]) => (
                <li key={key} className="nav-item">
                  <button className={`nav-link ${activeTab === key ? 'active' : ''}`} onClick={() => handleTabChange(key)}>{label}</button>
                </li>
              ))}
            </ul>

            {loading ? <div className="text-center my-5"><div className="spinner-border text-primary" /></div> : (
              <>
                {/* Tab Doanh thu */}
                {activeTab === 'revenue' && revenue && (
                  <div>
                    <div className="row g-3 mb-4">
                      <div className="col-md-3">
                        <div className="card text-center p-3 border-0 shadow-sm">
                          <div className="text-muted small">Tổng doanh thu vé</div>
                          <div className="fw-bold fs-5 text-primary">{fmt(revenue.summary?.tongDoanhThuVe)}đ</div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="card text-center p-3 border-0 shadow-sm">
                          <div className="text-muted small">Doanh thu hàng hóa</div>
                          <div className="fw-bold fs-5 text-success">{fmt(revenue.summary?.tongDoanhThuHangHoa)}đ</div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="card text-center p-3 border-0 shadow-sm">
                          <div className="text-muted small">Tổng doanh thu</div>
                          <div className="fw-bold fs-5 text-danger">{fmt(revenue.summary?.tongDoanhThu)}đ</div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="card text-center p-3 border-0 shadow-sm">
                          <div className="text-muted small">Tổng số vé</div>
                          <div className="fw-bold fs-5 text-warning">{revenue.summary?.tongSoVe || 0}</div>
                        </div>
                      </div>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-8">
                        <div className="card shadow-sm p-3">
                          <h6 className="fw-bold mb-3">Doanh thu theo ngày</h6>
                          <div className="table-responsive">
                            <table className="table table-sm">
                              <thead className="table-light"><tr><th>Ngày</th><th>Doanh thu vé</th><th>Hàng hóa</th><th>Tổng</th><th>Số vé</th></tr></thead>
                              <tbody>
                                {revenue.daily?.length === 0 ? <tr><td colSpan={5} className="text-center">Không có dữ liệu</td></tr>
                                  : revenue.daily?.map((d, i) => (
                                    <tr key={i}>
                                      <td>{new Date(d.ngay).toLocaleDateString('vi-VN')}</td>
                                      <td>{fmt(d.doanhThuVe)}đ</td>
                                      <td>{fmt(d.doanhThuHangHoa)}đ</td>
                                      <td className="fw-bold">{fmt(d.tongDoanhThu)}đ</td>
                                      <td>{d.soVe}</td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card shadow-sm p-3">
                          <h6 className="fw-bold mb-3">Theo phương thức thanh toán</h6>
                          {revenue.byPaymentMethod?.length === 0 ? <p className="text-muted">Không có dữ liệu</p>
                            : revenue.byPaymentMethod?.map((p, i) => (
                              <div key={i} className="d-flex justify-content-between py-2 border-bottom">
                                <span>{p.tenPhuongThuc}</span>
                                <span className="fw-bold">{fmt(p.tongTien)}đ</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab Tuyến đường */}
                {activeTab === 'routes' && routeStats && (
                  <div className="card shadow-sm p-4">
                    <h6 className="fw-bold mb-3">Tỷ lệ lấp đầy theo tuyến đường</h6>
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light"><tr><th>Tuyến đường</th><th>Loại</th><th>Số chuyến</th><th>Ghế đã đặt</th><th>Tổng ghế</th><th>Tỷ lệ lấp đầy</th></tr></thead>
                        <tbody>
                          {routeStats.routes?.length === 0 ? <tr><td colSpan={6} className="text-center">Không có dữ liệu</td></tr>
                            : routeStats.routes?.map((r, i) => (
                              <tr key={i}>
                                <td><strong>{r.diemDi}</strong> → {r.diemDen}</td>
                                <td><span className={`badge bg-${r.loaiDichVu === 'city' ? 'info text-dark' : 'primary'}`}>{r.loaiDichVu === 'city' ? 'Nội thành' : 'Ngoại thành'}</span></td>
                                <td>{r.soChuyenXe}</td>
                                <td>{r.tongGheDat}</td>
                                <td>{r.tongGhe}</td>
                                <td>
                                  <div className="d-flex align-items-center gap-2">
                                    <div className="progress flex-grow-1" style={{ height: '8px' }}>
                                      <div className="progress-bar bg-success" style={{ width: `${r.tyLeLapDay}%` }} />
                                    </div>
                                    <span className="fw-bold">{r.tyLeLapDay}%</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tab Đánh giá */}
                {activeTab === 'ratings' && ratings && (
                  <div>
                    <div className="row g-3 mb-4">
                      {[
                        ['Tổng đánh giá', ratings.summary?.tongSoDanhGia || 0, 'primary'],
                        ['Điểm trung bình', ratings.summary?.diemTrungBinh ? `${ratings.summary.diemTrungBinh}/5` : 'N/A', 'warning'],
                        ['Điểm phục vụ', ratings.summary?.diemPhucVuTrungBinh ? `${ratings.summary.diemPhucVuTrungBinh}/5` : 'N/A', 'success'],
                        ['Điểm giao tiếp', ratings.summary?.diemGiaoThiepTrungBinh ? `${ratings.summary.diemGiaoThiepTrungBinh}/5` : 'N/A', 'info'],
                      ].map(([label, value, color], i) => (
                        <div key={i} className="col-md-3">
                          <div className="card text-center p-3 border-0 shadow-sm">
                            <div className="text-muted small">{label}</div>
                            <div className={`fw-bold fs-5 text-${color}`}>{value}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="card shadow-sm p-3">
                          <h6 className="fw-bold mb-3">Đánh giá theo tài xế</h6>
                          {ratings.byDriver?.length === 0 ? <p className="text-muted">Chưa có dữ liệu</p>
                            : ratings.byDriver?.map((d, i) => (
                              <div key={i} className="d-flex justify-content-between py-2 border-bottom">
                                <span>{d.tenTaiXe}</span>
                                <span className="fw-bold text-warning">⭐ {d.diemTrungBinh} ({d.soDanhGia} đánh giá)</span>
                              </div>
                            ))}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="card shadow-sm p-3">
                          <h6 className="fw-bold mb-3">Nhận xét gần nhất</h6>
                          {ratings.recentReviews?.length === 0 ? <p className="text-muted">Chưa có nhận xét</p>
                            : ratings.recentReviews?.map((r, i) => (
                              <div key={i} className="py-2 border-bottom">
                                <div className="d-flex justify-content-between">
                                  <span className="fw-bold">{r.tenKhachHang}</span>
                                  <span className="text-warning">{'⭐'.repeat(r.diemDanhGia)}</span>
                                </div>
                                <div className="text-muted small">{r.diemDi} → {r.diemDen}</div>
                                {r.nhanXet && <div className="text-secondary small mt-1">"{r.nhanXet}"</div>}
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab Sự cố vận hành */}
                {activeTab === 'incidents' && (
                  <div className="card shadow-sm p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="fw-bold mb-0 text-dark">⚠️ Nhật ký & Quản lý Sự cố Vận hành</h5>
                      <span className="badge bg-danger px-3 py-2 fs-6">
                        Tìm thấy {filteredIncidents.length} báo cáo
                      </span>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Mã sự cố</th>
                            <th>Chuyến xe</th>
                            <th>Tài xế</th>
                            <th>Phương tiện</th>
                            <th>Thông tin sự cố</th>
                            <th>Mức độ</th>
                            <th>Vị trí</th>
                            <th>Thời gian báo</th>
                            <th>Minh chứng</th>
                            <th>Trạng thái</th>
                            <th className="text-end">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredIncidents.length === 0 ? (
                            <tr>
                              <td colSpan={11} className="text-center py-5 text-muted">
                                <div className="fs-5 mb-2">Không tìm thấy báo cáo sự cố nào</div>
                                <small>Vui lòng kiểm tra lại bộ lọc thời gian</small>
                              </td>
                            </tr>
                          ) : (
                            filteredIncidents.map((inc) => (
                              <tr key={inc.maSuCo}>
                                <td><span className="fw-bold text-dark">#SC{inc.maSuCo}</span></td>
                                <td>
                                  <div className="fw-semibold text-dark">{inc.diemDi} &rarr; {inc.diemDen}</div>
                                  <div className="text-muted small">Mã chuyến: {inc.maChuyenXe}</div>
                                </td>
                                <td>
                                  <div className="fw-semibold text-dark">{inc.tenTaiXe}</div>
                                  <div className="text-muted small">{inc.soDienThoaiTaiXe}</div>
                                </td>
                                <td>
                                  <span className="badge bg-secondary mb-1">{inc.bienSoXe}</span>
                                  <div className="text-muted small">{inc.loaiXe}</div>
                                </td>
                                <td>
                                  <div className="fw-semibold text-danger">{inc.loaiSuCo}</div>
                                  <div className="text-truncate text-muted small" style={{ maxWidth: '200px' }} title={inc.moTa}>
                                    {inc.moTa || 'Không có mô tả'}
                                  </div>
                                </td>
                                <td>
                                  <span className={`badge ${
                                    inc.mucDo === 'Nghiêm trọng' ? 'bg-danger text-white' :
                                    inc.mucDo === 'Trung bình' ? 'bg-warning text-dark' : 'bg-info text-dark'
                                  }`}>
                                    {inc.mucDo}
                                  </span>
                                </td>
                                <td>
                                  <div className="text-truncate text-muted small" style={{ maxWidth: '150px' }} title={inc.viTri}>
                                    📍 {inc.viTri}
                                  </div>
                                </td>
                                <td>{new Date(inc.thoiGianTao).toLocaleString('vi-VN')}</td>
                                <td>
                                  {inc.anhMinhChung ? (
                                    <img 
                                      src={inc.anhMinhChung} 
                                      alt="Proof" 
                                      className="img-thumbnail"
                                      style={{ width: '45px', height: '45px', objectFit: 'cover', cursor: 'pointer' }}
                                      onClick={() => setZoomImage(inc.anhMinhChung)}
                                    />
                                  ) : (
                                    <span className="text-muted small">Không có</span>
                                  )}
                                </td>
                                <td>
                                  <span className={`badge ${
                                    inc.trangThaiSuCo === 'da_xu_ly' ? 'bg-success' :
                                    inc.trangThaiSuCo === 'dang_xu_ly' ? 'bg-warning text-dark' : 'bg-danger'
                                  }`}>
                                    {inc.trangThaiSuCo === 'da_xu_ly' ? 'Đã xử lý' :
                                     inc.trangThaiSuCo === 'dang_xu_ly' ? 'Đang xử lý' : 'Chờ xử lý'}
                                  </span>
                                </td>
                                <td className="text-end">
                                  <button 
                                    className="btn btn-sm btn-primary px-3 shadow-sm"
                                    onClick={() => handleOpenResolveModal(inc)}
                                  >
                                    Xử lý
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* RESOLVE MODAL */}
      {showResolveModal && selectedIncident && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg">
                <div className="modal-header bg-dark text-white border-0 py-3">
                  <h5 className="modal-title fw-bold">⚠️ Giải Quyết Sự Cố - Báo Cáo #SC{selectedIncident.maSuCo}</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowResolveModal(false)}></button>
                </div>
                <form onSubmit={handleResolveIncident}>
                  <div className="modal-body p-4" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                    
                    {/* Thông tin sự cố chi tiết */}
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <div className="p-3 bg-light rounded-3">
                          <h6 className="fw-bold mb-2 text-secondary">Thông tin chuyến xe</h6>
                          <div className="mb-1 text-dark"><strong>Chuyến xe:</strong> {selectedIncident.diemDi} &rarr; {selectedIncident.diemDen}</div>
                          <div className="mb-1 text-dark"><strong>Mã chuyến:</strong> {selectedIncident.maChuyenXe}</div>
                          <div className="mb-1 text-dark"><strong>Biển số:</strong> {selectedIncident.bienSoXe} ({selectedIncident.loaiXe})</div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="p-3 bg-light rounded-3">
                          <h6 className="fw-bold mb-2 text-secondary">Tài xế báo cáo</h6>
                          <div className="mb-1 text-dark"><strong>Họ tên:</strong> {selectedIncident.tenTaiXe}</div>
                          <div className="mb-1 text-dark"><strong>Số điện thoại:</strong> {selectedIncident.soDienThoaiTaiXe}</div>
                          <div className="mb-1 text-dark"><strong>Thời gian báo:</strong> {new Date(selectedIncident.thoiGianTao).toLocaleString('vi-VN')}</div>
                        </div>
                      </div>
                    </div>

                    <div className="row g-3 mb-4">
                      <div className="col-md-8">
                        <div className="mb-3">
                          <label className="fw-bold text-secondary mb-1">Loại sự cố & Mức độ</label>
                          <div>
                            <span className="badge bg-secondary me-2 fs-6 py-2 px-3">{selectedIncident.loaiSuCo}</span>
                            <span className={`badge fs-6 py-2 px-3 ${
                              selectedIncident.mucDo === 'Nghiêm trọng' ? 'bg-danger text-white' :
                              selectedIncident.mucDo === 'Trung bình' ? 'bg-warning text-dark' : 'bg-info text-dark'
                            }`}>
                              {selectedIncident.mucDo}
                            </span>
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="fw-bold text-secondary mb-1">Vị trí hiện tại</label>
                          <div className="p-2 border rounded-3 bg-light text-dark">
                            📍 {selectedIncident.viTri}
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="fw-bold text-secondary mb-1">Mô tả chi tiết</label>
                          <div className="p-3 border rounded-3 bg-white text-dark" style={{ minHeight: '80px', whiteSpace: 'pre-wrap' }}>
                            {selectedIncident.moTa || 'Không có mô tả chi tiết'}
                          </div>
                        </div>
                      </div>

                      <div className="col-md-4">
                        <label className="fw-bold text-secondary mb-1">Ảnh minh chứng</label>
                        {selectedIncident.anhMinhChung ? (
                          <div className="border rounded-3 p-2 bg-light text-center">
                            <img 
                              src={selectedIncident.anhMinhChung} 
                              alt="Proof Details" 
                              className="img-fluid rounded-3" 
                              style={{ maxHeight: '200px', cursor: 'zoom-in', objectFit: 'contain' }}
                              onClick={() => setZoomImage(selectedIncident.anhMinhChung)}
                            />
                            <div className="text-muted small mt-1">Nhấp để phóng to</div>
                          </div>
                        ) : (
                          <div className="border rounded-3 p-4 bg-light text-center text-muted">
                            Không có ảnh minh chứng
                          </div>
                        )}
                      </div>
                    </div>

                    <hr />

                    {/* Form xử lý của Admin */}
                    <h5 className="fw-bold text-dark mb-3">Thông tin xử lý sự cố</h5>
                    
                    <div className="mb-3">
                      <label className="form-label fw-bold text-dark">Trạng thái sự cố</label>
                      <select 
                        className="form-select" 
                        value={resolveStatus} 
                        onChange={e => setResolveStatus(e.target.value)}
                        required
                      >
                        <option value="cho_xu_ly">Chờ xử lý</option>
                        <option value="dang_xu_ly">Đang xử lý</option>
                        <option value="da_xu_ly">Đã xử lý (Hoàn thành)</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-bold text-dark">Biên bản / Ghi chú giải quyết sự cố</label>
                      <textarea 
                        className="form-control" 
                        rows="3" 
                        placeholder="Ghi nhận phương án xử lý (Ví dụ: Đã đổi xe trung chuyển, hành khách đã tiếp tục di chuyển...)"
                        value={resolveNotes}
                        onChange={e => setResolveNotes(e.target.value)}
                        required
                      ></textarea>
                    </div>

                    {resolveStatus === 'da_xu_ly' && (
                      <div className="mb-3 p-3 bg-warning bg-opacity-10 border border-warning rounded-3">
                        <label className="form-label fw-bold text-dark">
                          Cập nhật trạng thái chuyến xe tương ứng
                        </label>
                        <select 
                          className="form-select" 
                          value={updateTripStatus} 
                          onChange={e => setUpdateTripStatus(e.target.value)}
                        >
                          <option value="">(Mặc định: Cho xe chạy tiếp - Đang di chuyển)</option>
                          <option value="DEPARTED">✅ Cho xe chạy tiếp (Đang di chuyển)</option>
                          <option value="COMPLETED">🏁 Xác nhận hoàn thành chuyến xe</option>
                          <option value="CANCELLED">❌ Hủy chuyến xe</option>
                        </select>
                        <div className="text-muted small mt-1">
                          Hệ thống sẽ ghi nhận lịch sử hành trình và cập nhật trạng thái chuyến xe tương ứng.
                        </div>
                      </div>
                    )}

                  </div>
                  <div className="modal-footer border-0 bg-light py-3">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowResolveModal(false)}>Hủy bỏ</button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? 'Đang lưu...' : 'Xác nhận xử lý'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
        </>
      )}

      {/* ZOOM IMAGE LIGHTBOX */}
      {zoomImage && (
        <>
          <div 
            className="modal fade show d-block" 
            tabIndex="-1" 
            style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1070 }}
            onClick={() => setZoomImage(null)}
          >
            <div className="modal-dialog modal-dialog-centered modal-xl">
              <div className="modal-content bg-transparent border-0 text-center position-relative">
                <button 
                  type="button" 
                  className="btn-close btn-close-white position-absolute top-0 end-0 m-3" 
                  style={{ fontSize: '24px', zIndex: 1080 }}
                  onClick={() => setZoomImage(null)}
                ></button>
                <img 
                  src={zoomImage} 
                  alt="Zoomed Proof" 
                  className="img-fluid rounded shadow-lg mx-auto" 
                  style={{ maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain' }} 
                />
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1060 }}></div>
        </>
      )}
    </div>
  );
}

export default ReportsPage;
