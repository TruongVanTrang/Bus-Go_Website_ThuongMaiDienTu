import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthUtil, StorageUtil } from '@/utils/helpers';
import { ROLE_MENU } from '@/utils/constants';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopbar from '../components/AdminTopbar';
import axios from 'axios';
import './AdminDashboard.css';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Users, User, UserCheck, Plus, Inbox, CheckCircle2, Lock, X } from 'lucide-react';

const API = 'http://localhost:5000/api';
const VALID_ROLES = ['Driver', 'Ticket-Staff', 'Support-Staff'];

function UsersPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('customers');

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

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
    } catch (err) { console.error(err); }
    finally { setLoadingUsers(false); }
  };

  const fetchStaff = async () => {
    try {
      setLoadingStaff(true);
      const res = await axios.get(`${API}/admin/staff`, { headers: headers() });
      setStaffList(res.data);
    } catch (err) { console.error(err); }
    finally { setLoadingStaff(false); }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'locked' : 'active';
    try {
      await axios.put(`${API}/admin/users/${userId}`, { trangThaiTaiKhoan: newStatus }, { headers: headers() });
      setUsers(users.map(u => u.maNguoiDung === userId ? { ...u, trangThaiTaiKhoan: newStatus } : u));
    } catch (err) { alert(err.response?.data?.message || 'Có lỗi xảy ra'); }
  };

  const toggleStaffStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'locked' : 'active';
    try {
      await axios.put(`${API}/admin/users/${id}`, { trangThaiTaiKhoan: newStatus }, { headers: headers() });
      setStaffList(staffList.map(s => s.maNguoiDung === id ? { ...s, trangThaiTaiKhoan: newStatus } : s));
    } catch (err) { alert(err.response?.data?.message || 'Có lỗi xảy ra'); }
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
    } finally { setSubmitting(false); }
  };

  const roleBadgeClass = (role) => {
    const map = {
      ADMIN: 'bg-rose-50 text-rose-700',
      CUSTOMER: 'bg-emerald-50 text-emerald-700',
      Driver: 'bg-sky-50 text-sky-700',
      'Ticket-Staff': 'bg-indigo-50 text-indigo-700',
      'Support-Staff': 'bg-amber-50 text-amber-700'
    };
    return map[role] || 'bg-slate-100 text-slate-600';
  };

  const roleBadgeVariant = (role) => {
    const map = {
      ADMIN: 'destructive',
      CUSTOMER: 'success',
      Driver: 'info',
      'Ticket-Staff': 'info',
      'Support-Staff': 'warning'
    };
    return map[role] || 'secondary';
  };

  // Also fix staff toggle button inline style
  const staffToggleBtnStyle = (status) => status === 'active'
    ? { background: '#fff1f2', border: '1px solid #fecdd3', color: '#e11d48' }
    : { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' };

  if (loading) return (
    <div className="admin-loading">
      <div className="loading-spinner" />
    </div>
  );

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
                <Users className="h-8 w-8 text-[#004b87]" />
                Quản lý người dùng & Nhân sự
              </h1>
              <p className="text-slate-500 text-sm font-semibold mt-1">Quản lý tài khoản khách hàng và nhân sự vận hành</p>
            </div>

            {/* Success banner */}
            {successMsg && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm">
                <CheckCircle2 className="h-4 w-4" />
                {successMsg}
              </div>
            )}

            {/* Tab Pills */}
            <div className="flex gap-2 p-1 bg-slate-100/80 rounded-2xl w-fit border border-slate-200/50">
              {[['customers', '👤 Khách hàng', User], ['staff', '👨‍💼 Nhân sự', UserCheck]].map(([key, label, Icon]) => {
                const isActive = activeTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-extrabold transition-all border-none ${
                      isActive ? 'bg-white text-[#004b87] shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-[#004b87]' : 'text-slate-400'}`} />
                    {label.substring(2)}
                  </button>
                );
              })}
            </div>

            {/* Customers Tab */}
            {activeTab === 'customers' && (
              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                    <User className="h-5 w-5 text-[#004b87]" /> Danh sách khách hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingUsers ? (
                    <div className="flex justify-center py-16">
                      <div className="h-8 w-8 border-4 border-[#004b87] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="font-extrabold text-slate-600">ID</TableHead>
                          <TableHead className="font-extrabold text-slate-600">Họ tên</TableHead>
                          <TableHead className="font-extrabold text-slate-600">Email</TableHead>
                          <TableHead className="font-extrabold text-slate-600">Số điện thoại</TableHead>
                          <TableHead className="font-extrabold text-slate-600 text-center">Trạng thái</TableHead>
                          <TableHead className="font-extrabold text-slate-600 text-end">Hành động</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.filter(u => u.role === 'CUSTOMER').length === 0 ? (
                          <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-400">
                            <Inbox className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                            Không có dữ liệu người dùng
                          </TableCell></TableRow>
                        ) : users.filter(u => u.role === 'CUSTOMER').map(user => (
                          <TableRow key={user.maNguoiDung} className="hover:bg-slate-50/50">
                            <TableCell className="font-bold text-slate-500">#{user.maNguoiDung}</TableCell>
                            <TableCell className="font-bold text-slate-800">{user.tenNguoiDung}</TableCell>
                            <TableCell className="text-slate-600 font-medium">{user.email}</TableCell>
                            <TableCell className="text-slate-600 font-medium">{user.soDienThoai}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={user.trangThaiTaiKhoan === 'active' ? 'success' : 'secondary'} className="font-bold rounded-lg text-xs px-2.5 py-0.5">
                                {user.trangThaiTaiKhoan === 'active' ? 'Hoạt động' : 'Đã khóa'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-end">
                              <button
                                onClick={() => toggleUserStatus(user.maNguoiDung, user.trangThaiTaiKhoan)}
                                style={user.trangThaiTaiKhoan === 'active'
                                  ? { background: '#fff1f2', border: '1px solid #fecdd3', color: '#e11d48' }
                                  : { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }
                                }
                                className="h-8 rounded-lg text-xs font-extrabold px-3 cursor-pointer transition-colors"
                              >
                                {user.trangThaiTaiKhoan === 'active' ? 'Khóa' : 'Mở khóa'}
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Staff Tab */}
            {activeTab === 'staff' && (
              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-[#004b87]" /> Danh sách nhân sự
                    </CardTitle>
                    <CardDescription>Driver, Ticket-Staff, Support-Staff trong hệ thống</CardDescription>
                  </div>
                  <Button
                    onClick={() => { setFormError(''); setShowModal(true); }}
                    className="bg-[#004b87] hover:bg-[#003b6b] text-white font-extrabold h-9 rounded-xl px-4 border-none flex items-center gap-2 shadow-sm"
                  >
                    <Plus className="h-4 w-4" /> Thêm nhân sự
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingStaff ? (
                    <div className="flex justify-center py-16">
                      <div className="h-8 w-8 border-4 border-[#004b87] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="font-extrabold text-slate-600">ID</TableHead>
                          <TableHead className="font-extrabold text-slate-600">Họ tên</TableHead>
                          <TableHead className="font-extrabold text-slate-600">Email</TableHead>
                          <TableHead className="font-extrabold text-slate-600">Số điện thoại</TableHead>
                          <TableHead className="font-extrabold text-slate-600">Vai trò</TableHead>
                          <TableHead className="font-extrabold text-slate-600 text-center">Trạng thái</TableHead>
                          <TableHead className="font-extrabold text-slate-600">Ngày tạo</TableHead>
                          <TableHead className="font-extrabold text-slate-600 text-end">Hành động</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {staffList.length === 0 ? (
                          <TableRow><TableCell colSpan={8} className="text-center py-10 text-slate-400">
                            <Inbox className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                            Chưa có nhân sự nào
                          </TableCell></TableRow>
                        ) : staffList.map(s => (
                          <TableRow key={s.maNguoiDung} className="hover:bg-slate-50/50">
                            <TableCell className="font-bold text-slate-500">#{s.maNguoiDung}</TableCell>
                            <TableCell className="font-bold text-slate-800">{s.tenNguoiDung}</TableCell>
                            <TableCell className="text-slate-600 font-medium">{s.email}</TableCell>
                            <TableCell className="text-slate-600 font-medium">{s.soDienThoai}</TableCell>
                            <TableCell>
                              <Badge variant={roleBadgeVariant(s.vaiTro)} className="font-bold rounded-lg text-xs px-2.5 py-0.5">
                                {s.vaiTro}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={s.trangThaiTaiKhoan === 'active' ? 'success' : 'secondary'} className="font-bold rounded-lg text-xs px-2.5 py-0.5">
                                {s.trangThaiTaiKhoan === 'active' ? 'Hoạt động' : 'Đã khóa'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm font-semibold text-slate-500">
                              {s.ngayTaoTaiKhoan ? new Date(s.ngayTaoTaiKhoan).toLocaleDateString('vi-VN') : '-'}
                            </TableCell>
                            <TableCell className="text-end">
                              <button
                                onClick={() => toggleStaffStatus(s.maNguoiDung, s.trangThaiTaiKhoan)}
                                style={staffToggleBtnStyle(s.trangThaiTaiKhoan)}
                                className="h-8 rounded-lg text-xs font-extrabold px-3 cursor-pointer transition-colors"
                              >
                                {s.trangThaiTaiKhoan === 'active' ? 'Khóa' : 'Mở khóa'}
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* Create Staff Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg rounded-2xl bg-white border border-slate-200 p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="bg-slate-900 text-white p-6 pb-4">
            <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-sky-400" /> Thêm nhân sự mới
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs font-semibold">
              Tạo tài khoản mới cho Driver, Ticket-Staff hoặc Support-Staff
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateStaff}>
            <div className="p-6 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-sm">
                  <X className="h-4 w-4" />{formError}
                </div>
              )}
              {[
                { label: 'Họ tên *', field: 'fullName', type: 'text', placeholder: 'Nguyễn Văn A' },
                { label: 'Email *', field: 'email', type: 'email', placeholder: 'email@busgo.vn' },
                { label: 'Số điện thoại *', field: 'phone', type: 'text', placeholder: '0901234567' },
                { label: 'Mật khẩu *', field: 'password', type: 'password', placeholder: 'Tối thiểu 6 ký tự' },
              ].map(({ label, field, type, placeholder }) => (
                <div key={field}>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">{label}</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 shadow-sm focus:border-[#004b87] focus:outline-none focus:ring-2 focus:ring-[#004b87]/15 transition-all"
                    type={type} placeholder={placeholder}
                    value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Vai trò *</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 shadow-sm focus:border-[#004b87] focus:outline-none focus:ring-2 focus:ring-[#004b87]/15 transition-all"
                  value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                >
                  {VALID_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <DialogFooter className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-100 h-10 px-5 shadow-none">
                Hủy
              </Button>
              <Button type="submit" disabled={submitting} className="bg-[#004b87] hover:bg-[#003b6b] text-white font-extrabold h-10 px-5 rounded-xl border-none">
                {submitting ? 'Đang tạo...' : 'Tạo tài khoản'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default UsersPage;
