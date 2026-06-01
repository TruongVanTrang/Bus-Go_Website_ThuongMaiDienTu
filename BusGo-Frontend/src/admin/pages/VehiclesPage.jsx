import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthUtil, StorageUtil } from '@/utils/helpers';
import { ROLE_MENU } from '@/utils/constants';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopbar from '../components/AdminTopbar';
import axios from 'axios';
import './AdminDashboard.css';

const API = 'http://localhost:5000/api';
const TRANG_THAI_OPTIONS = ['san_sang', 'maintenance', 'inactive'];
const LOAI_XE_OPTIONS = ['16-seater', '35-seater'];

function VehiclesPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ bienSoXe: '', nhanHieu: '', mauSac: '', namSanXuat: '', tongSoGhe: '', loaiXe: '16-seater', trangThaiXe: 'san_sang', ngayMuaVao: '', ngayBaoTriLanSau: '' });

  useEffect(() => {
    const role = AuthUtil.getCurrentRole();
    const user = AuthUtil.getCurrentUser();
    if (!role) { navigate('/login'); return; }
    setUserRole(role);
    setUserName(user?.name || 'User');
    fetchVehicles();
  }, [navigate]);

  const token = () => StorageUtil.getToken();

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/admin/vehicles`, { headers: { Authorization: `Bearer ${token()}` } });
      setVehicles(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditVehicle(null);
    setForm({ bienSoXe: '', nhanHieu: '', mauSac: '', namSanXuat: '', tongSoGhe: '', loaiXe: '16-seater', trangThaiXe: 'san_sang', ngayMuaVao: '', ngayBaoTriLanSau: '' });
    setFormError(''); setShowModal(true);
  };

  const openEdit = (v) => {
    setEditVehicle(v);
    setForm({ bienSoXe: v.bienSoXe, nhanHieu: v.nhanHieu || '', mauSac: v.mauSac || '', namSanXuat: v.namSanXuat || '', tongSoGhe: v.tongSoGhe, loaiXe: v.loaiXe, trangThaiXe: v.trangThaiXe, ngayMuaVao: v.ngayMuaVao ? v.ngayMuaVao.split('T')[0] : '', ngayBaoTriLanSau: v.ngayBaoTriLanSau ? v.ngayBaoTriLanSau.split('T')[0] : '' });
    setFormError(''); setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormError('');
    try {
      setSubmitting(true);
      const payload = { ...form, tongSoGhe: Number(form.tongSoGhe), namSanXuat: Number(form.namSanXuat) };
      if (editVehicle) {
        await axios.put(`${API}/admin/vehicles/${editVehicle.maPhuongTien}`, payload, { headers: { Authorization: `Bearer ${token()}` } });
        setSuccessMsg('Cập nhật phương tiện thành công');
      } else {
        await axios.post(`${API}/admin/vehicles`, payload, { headers: { Authorization: `Bearer ${token()}` } });
        setSuccessMsg('Thêm phương tiện thành công');
      }
      setShowModal(false); fetchVehicles();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) { setFormError(err.response?.data?.message || 'Lỗi khi lưu'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xác nhận xóa phương tiện này?')) return;
    try {
      await axios.delete(`${API}/admin/vehicles/${id}`, { headers: { Authorization: `Bearer ${token()}` } });
      setSuccessMsg('Xóa phương tiện thành công');
      fetchVehicles();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) { alert(err.response?.data?.message || 'Lỗi khi xóa'); }
  };

  const statusBadge = (s) => {
    const map = { san_sang: ['success', 'Sẵn sàng'], maintenance: ['warning', 'Bảo trì'], inactive: ['secondary', 'Ngừng HĐ'], active: ['success', 'Hoạt động'] };
    const [color, label] = map[s] || ['secondary', s];
    return <span className={`badge bg-${color}`}>{label}</span>;
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
              <h1 className="page-title mb-0">🚌 Quản lý đội xe</h1>
              <button className="btn btn-primary" onClick={openAdd}>+ Thêm xe</button>
            </div>
            {successMsg && <div className="alert alert-success">{successMsg}</div>}
            <div className="card shadow-sm p-4">
              {loading ? <div className="text-center my-5"><div className="spinner-border text-primary" /></div> : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr><th>ID</th><th>Biển số</th><th>Nhãn hiệu</th><th>Màu</th><th>Năm SX</th><th>Loại xe</th><th>Số ghế</th><th>Trạng thái</th><th>Bảo trì tiếp</th><th>Thao tác</th></tr>
                    </thead>
                    <tbody>
                      {vehicles.length === 0 ? <tr><td colSpan={10} className="text-center py-4">Chưa có phương tiện</td></tr>
                        : vehicles.map(v => (
                          <tr key={v.maPhuongTien}>
                            <td>#{v.maPhuongTien}</td>
                            <td className="fw-bold">{v.bienSoXe}</td>
                            <td>{v.nhanHieu}</td>
                            <td>{v.mauSac}</td>
                            <td>{v.namSanXuat}</td>
                            <td><span className="badge bg-info text-dark">{v.loaiXe}</span></td>
                            <td>{v.tongSoGhe}</td>
                            <td>{statusBadge(v.trangThaiXe)}</td>
                            <td>{v.ngayBaoTriLanSau ? new Date(v.ngayBaoTriLanSau).toLocaleDateString('vi-VN') : '-'}</td>
                            <td>
                              <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(v)}>Sửa</button>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(v.maPhuongTien)}>Xóa</button>
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
                <h5 className="modal-title">{editVehicle ? 'Cập nhật phương tiện' : 'Thêm phương tiện mới'}</h5>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {formError && <div className="alert alert-danger py-2">{formError}</div>}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Biển số xe *</label>
                      <input className="form-control" value={form.bienSoXe} onChange={e => setForm({...form, bienSoXe: e.target.value})} placeholder="51B-12345" disabled={!!editVehicle} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Loại xe *</label>
                      <select className="form-select" value={form.loaiXe} onChange={e => setForm({...form, loaiXe: e.target.value, tongSoGhe: e.target.value === '16-seater' ? 16 : 35})}>
                        {LOAI_XE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Nhãn hiệu</label>
                      <input className="form-control" value={form.nhanHieu} onChange={e => setForm({...form, nhanHieu: e.target.value})} placeholder="Hyundai" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Màu sắc</label>
                      <input className="form-control" value={form.mauSac} onChange={e => setForm({...form, mauSac: e.target.value})} placeholder="Trắng" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Năm sản xuất</label>
                      <input className="form-control" type="number" value={form.namSanXuat} onChange={e => setForm({...form, namSanXuat: e.target.value})} placeholder="2022" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Số ghế *</label>
                      <input className="form-control" type="number" value={form.tongSoGhe} onChange={e => setForm({...form, tongSoGhe: e.target.value})} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Trạng thái</label>
                      <select className="form-select" value={form.trangThaiXe} onChange={e => setForm({...form, trangThaiXe: e.target.value})}>
                        {TRANG_THAI_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Ngày mua vào</label>
                      <input className="form-control" type="date" value={form.ngayMuaVao} onChange={e => setForm({...form, ngayMuaVao: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Bảo trì lần sau</label>
                      <input className="form-control" type="date" value={form.ngayBaoTriLanSau} onChange={e => setForm({...form, ngayBaoTriLanSau: e.target.value})} />
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

export default VehiclesPage;
