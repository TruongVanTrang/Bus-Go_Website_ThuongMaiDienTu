import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthUtil, StorageUtil } from '@/utils/helpers';
import { ROLE_MENU } from '@/utils/constants';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopbar from '../components/AdminTopbar';
import axios from 'axios';
import './AdminDashboard.css';

const API = 'http://localhost:5000/api';
const VALID_ROLES = ['Driver', 'Ticket-Staff', 'Support-Staff'];

function UsersPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('customers');

  // Customers
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Staff
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', role: 'Driver' });

  useEffect(() => {
    const role = AuthUtil.getCurrentRole();
    const user = AuthUtil.getCurrentUser();
    if (!role) { navigate('/login'); return; }
    setUserRole(role);
    setUserName(user?.name || 'User');
    setLoading(false);
    fetchUsers();
  }, [navigate]);

  useEffect(() => {
    if (activeTab === 'staff') fetchStaff();
  }, [activeTab]);

  const token = () => StorageUtil.getToken();
  const headers = () => ({ Authorization: `Bearer ${token()}` });

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await axios.get(`${API}/admin/users`, { headers: headers() });
      setUsers(res.data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách người dùng:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchStaff = async () => {
    try {
      setLoadingStaff(true);
      const res = await axios.get(`${API}/admin/staff`, { headers: headers() });
      setStaffList(res.data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách nhân sự:', err);
    } finally {
      setLoadingStaff(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'locked' : 'active';
    try {
      await axios.put(`${API}/admin/users/${userId}`,
        { trangThaiTaiKhoan: newStatus },
        { headers: headers() }
      );
      setUsers(users.map(u => u.maNguoiDung === userId ? { ...u, trangThaiTaiKhoan: newStatus } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  const toggleStaffStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'locked' : 'active';
    try {
      await axios.put(`${API}/admin/users/${id}`,
        { trangThaiTaiKhoan: newStatus },
        { headers: headers() }
      );
      setStaffList(staffList.map(s => s.maNguoiDung === id ? { ...s, trangThaiTaiKhoan: newStatus } : s));
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.fullName || !form.email || !form.phone || !form.password) {
      setFormError('Vui lòng điền đầy đủ thông tin'); return;
    }
    try {
      setSubmitting(true);
      await axios.post(`${API}/admin/staff`, form, { headers: headers() });
      setSuccessMsg('Tạo tài khoản nhân sự thành công');
      setShowModal(false);
      setForm({ fullName: '', email: '', phone: '', password: '', role: 'Driver' });
      fetchStaff();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Lỗi khi tạo tài khoản');
    } finally {
      setSubmitting(false);
    }
  };

  const roleBadge = (role) => {
    const map = { ADMIN: 'danger', CUSTOMER: 'success', Driver: 'primary', 'Ticket-Staff': 'info', 'Support-Staff': 'warning' };
    return <span className={`badge bg-${map[role] || 'secondary'}`}>{role}</span>;
  };

  if (loading) return (
    <div className="admin-loading">
      <div className="spinner-border text-primary" role="status" />
    </div>
  );

  const menuItems = ROLE_MENU[userRole] || [];

  return (
    <div className="admin-dashboard">
      <AdminSidebar isOpen={sidebarOpen} userRole={userRole} menuItems={menuItems} onClose={() => setSidebarOpen(false)} />
      <div className="admin-main">
        <AdminTopbar userName={userName} userRole={userRole} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="admin-content">
          <div className="dashboard-content">
            <h1 className="page-title mb-4">👥 Quản lý người dùng & Nhân sự</h1>

            {successMsg && <div className="alert alert-success">{successMsg}</div>}

            {/* Tabs */}
            <ul className="nav nav-tabs mb-4">
              <li className="nav-item">
                <button className={`nav-link ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveTab('customers')}>
                  👤 Khách hàng
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link ${activeTab === 'staff' ? 'active' : ''}`} onClick={() => setActiveTab('staff')}>
                  👨‍💼 Nhân sự
                </button>
              </li>
            </ul>

            {/* Tab Khách hàng */}
            {activeTab === 'customers' && (
              <div className="card shadow-sm p-4">
                {loadingUsers ? (
                  <div className="text-center my-5"><div className="spinner-border text-primary" /></div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr><th>ID</th><th>Họ tên</th><th>Email</th><th>Số điện thoại</th><th>Trạng thái</th><th>Hành động</th></tr>
                      </thead>
                      <tbody>
                        {users.length === 0 ? (
                          <tr><td colSpan={6} className="text-center py-4">Không có dữ liệu người dùng</td></tr>
                        ) : users.filter(u => u.role === 'CUSTOMER').map(user => (
                          <tr key={user.maNguoiDung}>
                            <td>#{user.maNguoiDung}</td>
                            <td className="fw-bold">{user.tenNguoiDung}</td>
                            <td>{user.email}</td>
                            <td>{user.soDienThoai}</td>
                            <td>
                              <span className={`badge bg-${user.trangThaiTaiKhoan === 'active' ? 'success' : 'secondary'}`}>
                                {user.trangThaiTaiKhoan === 'active' ? 'Hoạt động' : 'Đã khóa'}
                              </span>
                            </td>
                            <td>
                              <button
                                className={`btn btn-sm ${user.trangThaiTaiKhoan === 'active' ? 'btn-outline-danger' : 'btn-outline-success'}`}
                                onClick={() => toggleUserStatus(user.maNguoiDung, user.trangThaiTaiKhoan)}
                              >
                                {user.trangThaiTaiKhoan === 'active' ? 'Khóa' : 'Mở khóa'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab Nhân sự */}
            {activeTab === 'staff' && (
              <div className="card shadow-sm p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <p className="mb-0 text-muted">Danh sách Driver, Ticket-Staff, Support-Staff</p>
                  <button className="btn btn-primary btn-sm" onClick={() => { setFormError(''); setShowModal(true); }}>
                    + Thêm nhân sự
                  </button>
                </div>
                {loadingStaff ? (
                  <div className="text-center my-5"><div className="spinner-border text-primary" /></div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr><th>ID</th><th>Họ tên</th><th>Email</th><th>Số điện thoại</th><th>Vai trò</th><th>Trạng thái</th><th>Ngày tạo</th><th>Hành động</th></tr>
                      </thead>
                      <tbody>
                        {staffList.length === 0 ? (
                          <tr><td colSpan={8} className="text-center py-4">Chưa có nhân sự nào</td></tr>
                        ) : staffList.map(s => (
                          <tr key={s.maNguoiDung}>
                            <td>#{s.maNguoiDung}</td>
                            <td className="fw-bold">{s.tenNguoiDung}</td>
                            <td>{s.email}</td>
                            <td>{s.soDienThoai}</td>
                            <td>{roleBadge(s.vaiTro)}</td>
                            <td>
                              <span className={`badge bg-${s.trangThaiTaiKhoan === 'active' ? 'success' : 'secondary'}`}>
                                {s.trangThaiTaiKhoan === 'active' ? 'Hoạt động' : 'Đã khóa'}
                              </span>
                            </td>
                            <td>{s.ngayTaoTaiKhoan ? new Date(s.ngayTaoTaiKhoan).toLocaleDateString('vi-VN') : '-'}</td>
                            <td>
                              <button
                                className={`btn btn-sm ${s.trangThaiTaiKhoan === 'active' ? 'btn-outline-danger' : 'btn-outline-success'}`}
                                onClick={() => toggleStaffStatus(s.maNguoiDung, s.trangThaiTaiKhoan)}
                              >
                                {s.trangThaiTaiKhoan === 'active' ? 'Khóa' : 'Mở khóa'}
                              </button>
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

      {/* Modal thêm nhân sự */}
      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Thêm nhân sự mới</h5>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleCreateStaff}>
                <div className="modal-body">
                  {formError && <div className="alert alert-danger py-2">{formError}</div>}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Họ tên *</label>
                    <input className="form-control" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} placeholder="Nguyễn Văn A" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Email *</label>
                    <input className="form-control" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@busgo.vn" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Số điện thoại *</label>
                    <input className="form-control" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="0901234567" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Mật khẩu *</label>
                    <input className="form-control" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Tối thiểu 6 ký tự" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Vai trò *</label>
                    <select className="form-select" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                      {VALID_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Đang tạo...' : 'Tạo tài khoản'}
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

export default UsersPage;
