import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthUtil, StorageUtil } from '@/utils/helpers';
import { ROLE_MENU } from '@/utils/constants';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopbar from '../components/AdminTopbar';
import axios from 'axios';
import './AdminDashboard.css';

const API = 'http://localhost:5000/api';
const TRANG_THAI_OPTIONS = ['da_len_lich', 'dang_chay', 'hoan_thanh', 'da_huy'];

function SchedulesPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [trips, setTrips] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTrip, setEditTrip] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ maTuyenDuong: '', maPhuongTien: '', maNhanVien: '', thoiGianDi: '', thoiGianDen: '', giaCoBan: '', trangThaiChuyen: 'da_len_lich' });

  useEffect(() => {
    const role = AuthUtil.getCurrentRole();
    const user = AuthUtil.getCurrentUser();
    if (!role) { navigate('/login'); return; }
    setUserRole(role); setUserName(user?.name || 'User');
    fetchAll();
  }, [navigate]);

  const token = () => StorageUtil.getToken();
  const headers = () => ({ Authorization: `Bearer ${token()}` });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [tripsRes, routesRes, vehiclesRes, staffRes] = await Promise.all([
        axios.get(`${API}/admin/trips`, { headers: headers() }),
        axios.get(`${API}/admin/routes`, { headers: headers() }),
        axios.get(`${API}/admin/vehicles`, { headers: headers() }),
        axios.get(`${API}/admin/staff`, { headers: headers() })
      ]);
      setTrips(tripsRes.data);
      setRoutes(routesRes.data);
      setVehicles(vehiclesRes.data);
      setStaff(staffRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditTrip(null);
    setForm({ maTuyenDuong: '', maPhuongTien: '', maNhanVien: '', thoiGianDi: '', thoiGianDen: '', giaCoBan: '', trangThaiChuyen: 'da_len_lich' });
    setFormError(''); setShowModal(true);
  };

  const openEdit = (t) => {
    setEditTrip(t);
    setForm({
      maTuyenDuong: t.maTuyenDuong || '', maPhuongTien: t.maPhuongTien || '',
      maNhanVien: t.maNhanVien || '', thoiGianDi: t.thoiGianDi ? t.thoiGianDi.slice(0, 16) : '',
      thoiGianDen: t.thoiGianDen ? t.thoiGianDen.slice(0, 16) : '',
      giaCoBan: t.giaCoBan || '', trangThaiChuyen: t.trangThaiChuyen || 'da_len_lich'
    });
    setFormError(''); setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormError('');
    const payload = { ...form, maTuyenDuong: Number(form.maTuyenDuong), maPhuongTien: Number(form.maPhuongTien), maNhanVien: form.maNhanVien ? Number(form.maNhanVien) : null, giaCoBan: Number(form.giaCoBan) };
    try {
      setSubmitting(true);
      if (editTrip) {
        await axios.put(`${API}/admin/trips/${editTrip.maChuyenXe}`, payload, { headers: headers() });
        setSuccessMsg('Cập nhật chuyến xe thành công');
      } else {
        await axios.post(`${API}/admin/trips`, payload, { headers: headers() });
        setSuccessMsg('Lên lịch chuyến xe thành công');
      }
      setShowModal(false); fetchAll();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) { setFormError(err.response?.data?.message || 'Lỗi khi lưu'); }
    finally { setSubmitting(false); }
  };

  const statusBadge = (s) => {
    const map = { da_len_lich: ['secondary', 'Đã lên lịch'], dang_chay: ['primary', 'Đang chạy'], hoan_thanh: ['success', 'Hoàn thành'], da_huy: ['danger', 'Đã hủy'] };
    const [color, label] = map[s] || ['secondary', s];
    return <span className={`badge bg-${color}`}>{label}</span>;
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
              <h1 className="page-title mb-0">⏰ Quản lý lịch trình</h1>
              <button className="btn btn-primary" onClick={openAdd}>+ Lên lịch chuyến</button>
            </div>
            {successMsg && <div className="alert alert-success">{successMsg}</div>}
            <div className="card shadow-sm p-4">
              {loading ? <div className="text-center my-5"><div className="spinner-border text-primary" /></div> : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr><th>ID</th><th>Tuyến đường</th><th>Xe</th><th>Tài xế</th><th>Giờ đi</th><th>Giờ đến</th><th>Giá</th><th>Ghế trống</th><th>Trạng thái</th><th>Thao tác</th></tr>
                    </thead>
                    <tbody>
                      {trips.length === 0 ? <tr><td colSpan={10} className="text-center py-4">Chưa có chuyến xe</td></tr>
                        : trips.map(t => (
                          <tr key={t.maChuyenXe}>
                            <td>#{t.maChuyenXe}</td>
                            <td><strong>{t.diemDi}</strong> → {t.diemDen}</td>
                            <td>{t.bienSoXe}</td>
                            <td>{t.tenNhanVien || '-'}</td>
                            <td>{t.thoiGianDi ? new Date(t.thoiGianDi).toLocaleString('vi-VN') : '-'}</td>
                            <td>{t.thoiGianDen ? new Date(t.thoiGianDen).toLocaleString('vi-VN') : '-'}</td>
                            <td>{Number(t.giaCoBan).toLocaleString('vi-VN')}đ</td>
                            <td>{t.soGheConTrong}/{t.tongSoGhe}</td>
                            <td>{statusBadge(t.trangThaiChuyen)}</td>
                            <td>
                              <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(t)}>Sửa</button>
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
                <h5 className="modal-title">{editTrip ? 'Cập nhật chuyến xe' : 'Lên lịch chuyến xe mới'}</h5>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {formError && <div className="alert alert-danger py-2">{formError}</div>}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Tuyến đường *</label>
                      <select className="form-select" value={form.maTuyenDuong} onChange={e => setForm({...form, maTuyenDuong: e.target.value})}>
                        <option value="">-- Chọn tuyến --</option>
                        {routes.map(r => <option key={r.maTuyenDuong} value={r.maTuyenDuong}>{r.diemDi} → {r.diemDen}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Phương tiện *</label>
                      <select className="form-select" value={form.maPhuongTien} onChange={e => setForm({...form, maPhuongTien: e.target.value})}>
                        <option value="">-- Chọn xe --</option>
                        {vehicles.map(v => <option key={v.maPhuongTien} value={v.maPhuongTien}>{v.bienSoXe} ({v.loaiXe})</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Tài xế</label>
                      <select className="form-select" value={form.maNhanVien} onChange={e => setForm({...form, maNhanVien: e.target.value})}>
                        <option value="">-- Chọn tài xế --</option>
                        {staff.filter(s => s.vaiTro === 'DRIVER').map(s => <option key={s.maNguoiDung} value={s.maNguoiDung}>{s.tenNguoiDung}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Giá cơ bản (VNĐ) *</label>
                      <input className="form-control" type="number" value={form.giaCoBan} onChange={e => setForm({...form, giaCoBan: e.target.value})} placeholder="250000" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Thời gian đi *</label>
                      <input className="form-control" type="datetime-local" value={form.thoiGianDi} onChange={e => setForm({...form, thoiGianDi: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Thời gian đến *</label>
                      <input className="form-control" type="datetime-local" value={form.thoiGianDen} onChange={e => setForm({...form, thoiGianDen: e.target.value})} />
                    </div>
                    {editTrip && (
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Trạng thái</label>
                        <select className="form-select" value={form.trangThaiChuyen} onChange={e => setForm({...form, trangThaiChuyen: e.target.value})}>
                          {TRANG_THAI_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    )}
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

export default SchedulesPage;
