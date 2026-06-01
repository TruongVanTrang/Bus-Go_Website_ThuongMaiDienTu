import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthUtil, StorageUtil } from '@/utils/helpers';
import { ROLE_MENU } from '@/utils/constants';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopbar from '../components/AdminTopbar';
import axios from 'axios';
import './AdminDashboard.css';

const API = 'http://localhost:5000/api';

function ReportsPage() {
  const navigate = useNavigate();
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

  useEffect(() => {
    const role = AuthUtil.getCurrentRole();
    const user = AuthUtil.getCurrentUser();
    if (!role) { navigate('/login'); return; }
    setUserRole(role); setUserName(user?.name || 'User');
    fetchData('revenue');
  }, [navigate]);

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
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSearch = () => fetchData(activeTab);
  const handleTabChange = (tab) => { setActiveTab(tab); fetchData(tab); };

  const fmt = (n) => n ? Number(n).toLocaleString('vi-VN') : '0';

  const menuItems = ROLE_MENU[userRole] || [];

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
              {[['revenue', '💰 Doanh thu'], ['routes', '🛣️ Tuyến đường'], ['ratings', '⭐ Đánh giá']].map(([key, label]) => (
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
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default ReportsPage;
