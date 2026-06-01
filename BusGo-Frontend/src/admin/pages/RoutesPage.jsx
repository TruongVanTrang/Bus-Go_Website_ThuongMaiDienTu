import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthUtil, StorageUtil } from '@/utils/helpers';
import { ROLE_MENU } from '@/utils/constants';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopbar from '../components/AdminTopbar';
import axios from 'axios';
import './AdminDashboard.css';

const API = 'http://localhost:5000/api';

function RoutesPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRoute, setEditRoute] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ diemDi: '', diemDen: '', loaiDichVu: 'city', khoangCach: '', danhSachTramDung: '' });

  useEffect(() => {
    const role = AuthUtil.getCurrentRole();
    const user = AuthUtil.getCurrentUser();
    if (!role) { navigate('/login'); return; }
    setUserRole(role); setUserName(user?.name || 'User');
    fetchRoutes();
  }, [navigate]);

  const token = () => StorageUtil.getToken();

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/admin/routes`, { headers: { Authorization: `Bearer ${token()}` } });
      setRoutes(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditRoute(null);
    setForm({ diemDi: '', diemDen: '', loaiDichVu: 'city', khoangCach: '', danhSachTramDung: '' });
    setFormError(''); setShowModal(true);
  };

  const openEdit = (r) => {
    setEditRoute(r);
    setForm({
      diemDi: r.diemDi, diemDen: r.diemDen, loaiDichVu: r.loaiDichVu,
      khoangCach: r.khoangCach || '',
      danhSachTramDung: r.danhSachTramDung ? JSON.stringify(JSON.parse(r.danhSachTramDung), null, 2) : ''
    });
    setFormError(''); setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormError('');
    let tramDung = null;
    if (form.danhSachTramDung) {
      try { tramDung = JSON.parse(form.danhSachTramDung); }
      catch { setFormError('Danh sách trạm dừng không đúng định dạng JSON'); return; }
    }
    const payload = { diemDi: form.diemDi, diemDen: form.diemDen, loaiDichVu: form.loaiDichVu, khoangCach: Number(form.khoangCach) || null, danhSachTramDung: tramDung };
    try {
      setSubmitting(true);
      if (editRoute) {
        await axios.put(`${API}/admin/routes/${editRoute.maTuyenDuong}`, payload, { headers: { Authorization: `Bearer ${token()}` } });
        setSuccessMsg('Cập nhật tuyến đường thành công');
      } else {
        await axios.post(`${API}/admin/routes`, payload, { headers: { Authorization: `Bearer ${token()}` } });
        setSuccessMsg('Thêm tuyến đường thành công');
      }
      setShowModal(false); fetchRoutes();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) { setFormError(err.response?.data?.message || 'Lỗi khi lưu'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xác nhận xóa tuyến đường này?')) return;
    try {
      await axios.delete(`${API}/admin/routes/${id}`, { headers: { Authorization: `Bearer ${token()}` } });
      setSuccessMsg('Xóa tuyến đường thành công');
      fetchRoutes();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) { alert(err.response?.data?.message || 'Lỗi khi xóa'); }
  };

  const menuItems = ROLE_MENU[userRole] || [];

  return (
    <div className="admin-dashboard">
      <AdminSidebar isOpen={sidebarOpen} userRole={userRole} menuItems={menuItems} onClose={() => setSidebarOpen(false)} />
      <div className="admin-main">
        <AdminTopbar userName={userName} userRole={userRole} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="admin-content">
          <div className="dashboard-content">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1 className="page-title mb-0">🛣️ Quản lý tuyến đường</h1>
              <button className="btn btn-primary" onClick={openAdd}>+ Thêm tuyến</button>
            </div>
            {successMsg && <div className="alert alert-success">{successMsg}</div>}
            <div className="card shadow-sm p-4">
              {loading ? <div className="text-center my-5"><div className="spinner-border text-primary" /></div> : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr><th>ID</th><th>Điểm đi</th><th>Điểm đến</th><th>Loại</th><th>Khoảng cách</th><th>Trạm dừng</th><th>Ngày tạo</th><th>Thao tác</th></tr>
                    </thead>
                    <tbody>
                      {routes.length === 0 ? <tr><td colSpan={8} className="text-center py-4">Chưa có tuyến đường</td></tr>
                        : routes.map(r => (
                          <tr key={r.maTuyenDuong}>
                            <td>#{r.maTuyenDuong}</td>
                            <td className="fw-bold">{r.diemDi}</td>
                            <td className="fw-bold">{r.diemDen}</td>
                            <td><span className={`badge bg-${r.loaiDichVu === 'city' ? 'info text-dark' : 'primary'}`}>{r.loaiDichVu === 'city' ? 'Nội thành' : 'Ngoại thành'}</span></td>
                            <td>{r.khoangCach ? `${r.khoangCach} km` : '-'}</td>
                            <td>{r.danhSachTramDung ? `${JSON.parse(r.danhSachTramDung).length} trạm` : '-'}</td>
                            <td>{r.ngayTao ? new Date(r.ngayTao).toLocaleDateString('vi-VN') : '-'}</td>
                            <td>
                              <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(r)}>Sửa</button>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(r.maTuyenDuong)}>Xóa</button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowModal(false)}>
          <div className="modal-dialog modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editRoute ? 'Cập nhật tuyến đường' : 'Thêm tuyến đường mới'}</h5>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {formError && <div className="alert alert-danger py-2">{formError}</div>}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Điểm đi *</label>
                      <input className="form-control" value={form.diemDi} onChange={e => setForm({...form, diemDi: e.target.value})} placeholder="TP. Hồ Chí Minh" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Điểm đến *</label>
                      <input className="form-control" value={form.diemDen} onChange={e => setForm({...form, diemDen: e.target.value})} placeholder="Đà Lạt" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Loại dịch vụ *</label>
                      <select className="form-select" value={form.loaiDichVu} onChange={e => setForm({...form, loaiDichVu: e.target.value})}>
                        <option value="city">Nội thành (city)</option>
                        <option value="interCity">Ngoại thành (interCity)</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Khoảng cách (km)</label>
                      <input className="form-control" type="number" value={form.khoangCach} onChange={e => setForm({...form, khoangCach: e.target.value})} placeholder="300" />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Danh sách trạm dừng (JSON)</label>
                      <textarea className="form-control" rows={4} value={form.danhSachTramDung} onChange={e => setForm({...form, danhSachTramDung: e.target.value})}
                        placeholder='[{"name":"Điểm đi","time":"08:00","type":"start"},{"name":"Điểm đến","time":"13:00","type":"end"}]' />
                      <small className="text-muted">Định dạng: mảng JSON với các trường name, time, type</small>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Đang lưu...' : 'Lưu'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoutesPage;
