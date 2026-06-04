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
  const [form, setForm] = useState({ diemDi: '', diemDen: '', loaiDichVu: 'city', khoangCach: '' });
  const [tramDungArray, setTramDungArray] = useState([]);
  const [newTramDung, setNewTramDung] = useState({ name: '', time: '', type: 'stop' });

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
    setForm({ diemDi: '', diemDen: '', loaiDichVu: 'city', khoangCach: '' });
    setTramDungArray([]);
    setNewTramDung({ name: '', time: '', type: 'stop' });
    setFormError(''); setShowModal(true);
  };

  const openEdit = (r) => {
    setEditRoute(r);
    setForm({
      diemDi: r.diemDi, diemDen: r.diemDen, loaiDichVu: r.loaiDichVu,
      khoangCach: r.khoangCach || ''
    });
    const tramDung = r.danhSachTramDung ? JSON.parse(r.danhSachTramDung) : [];
    setTramDungArray(tramDung);
    setNewTramDung({ name: '', time: '', type: 'stop' });
    setFormError(''); setShowModal(true);
  };

  const addTramDung = () => {
    if (!newTramDung.name || !newTramDung.time) {
      setFormError('Vui lòng nhập tên trạm và giờ');
      return;
    }
    setTramDungArray([...tramDungArray, newTramDung]);
    setNewTramDung({ name: '', time: '', type: 'stop' });
    setFormError('');
  };

  const removeTramDung = (index) => {
    setTramDungArray(tramDungArray.filter((_, i) => i !== index));
  };

  const updateTramDung = (index, field, value) => {
    const updated = [...tramDungArray];
    updated[index] = { ...updated[index], [field]: value };
    setTramDungArray(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormError('');
    if (!form.diemDi || !form.diemDen) {
      setFormError('Vui lòng nhập điểm đi và điểm đến');
      return;
    }
    const payload = { diemDi: form.diemDi, diemDen: form.diemDen, loaiDichVu: form.loaiDichVu, khoangCach: Number(form.khoangCach) || null, danhSachTramDung: tramDungArray.length > 0 ? tramDungArray : null };
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
      <AdminSidebar isOpen={sidebarOpen} userRole={userRole} userName={userName} menuItems={menuItems} onClose={() => setSidebarOpen(false)} />
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
        <div className="modal show d-block" onClick={() => setShowModal(false)}>
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
                      <label className="form-label fw-semibold">📍 Danh sách trạm dừng</label>
                      <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '12px', marginBottom: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                        {tramDungArray.length === 0 ? (
                          <p className="text-muted mb-0">Chưa có trạm dừng nào</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {tramDungArray.map((tram, idx) => (
                              <div key={idx} style={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '10px', backgroundColor: '#f9f9f9' }}>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Tên trạm"
                                    value={tram.name}
                                    onChange={(e) => updateTramDung(idx, 'name', e.target.value)}
                                  />
                                  <input
                                    type="time"
                                    className="form-control form-control-sm"
                                    value={tram.time}
                                    onChange={(e) => updateTramDung(idx, 'time', e.target.value)}
                                    style={{ maxWidth: '120px' }}
                                  />
                                  <select
                                    className="form-select form-select-sm"
                                    value={tram.type}
                                    onChange={(e) => updateTramDung(idx, 'type', e.target.value)}
                                    style={{ maxWidth: '120px' }}
                                  >
                                    <option value="start">Điểm đi</option>
                                    <option value="stop">Trạm dừng</option>
                                    <option value="end">Điểm đến</option>
                                  </select>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-danger"
                                    onClick={() => removeTramDung(idx)}
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div style={{ border: '1px dashed #3b82f6', borderRadius: '4px', padding: '12px', backgroundColor: '#f0f7ff' }}>
                        <label className="form-label fw-semibold mb-2">Thêm trạm mới</label>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Tên trạm"
                            value={newTramDung.name}
                            onChange={(e) => setNewTramDung({...newTramDung, name: e.target.value})}
                          />
                          <input
                            type="time"
                            className="form-control form-control-sm"
                            value={newTramDung.time}
                            onChange={(e) => setNewTramDung({...newTramDung, time: e.target.value})}
                            style={{ maxWidth: '120px' }}
                          />
                          <select
                            className="form-select form-select-sm"
                            value={newTramDung.type}
                            onChange={(e) => setNewTramDung({...newTramDung, type: e.target.value})}
                            style={{ maxWidth: '120px' }}
                          >
                            <option value="start">Điểm đi</option>
                            <option value="stop">Trạm dừng</option>
                            <option value="end">Điểm đến</option>
                          </select>
                        </div>
                        <button type="button" className="btn btn-sm btn-primary w-100" onClick={addTramDung}>
                          + Thêm trạm
                        </button>
                      </div>
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
