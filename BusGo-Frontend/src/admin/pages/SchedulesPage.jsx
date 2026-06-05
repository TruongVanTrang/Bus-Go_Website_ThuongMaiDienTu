import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthUtil, StorageUtil } from '@/utils/helpers';
import { ROLE_MENU } from '@/utils/constants';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopbar from '../components/AdminTopbar';
import axios from 'axios';
import './AdminDashboard.css';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Clock, Plus, Pencil, Inbox, X, CheckCircle2 } from 'lucide-react';

const API = 'http://localhost:5000/api';
const TRANG_THAI_OPTIONS = ['da_len_lich', 'dang_chay', 'hoan_thanh', 'da_huy'];

const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 shadow-sm focus:border-[#004b87] focus:outline-none focus:ring-2 focus:ring-[#004b87]/15 transition-all";
const selectCls = inputCls;

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
      setTrips(tripsRes.data); setRoutes(routesRes.data);
      setVehicles(vehiclesRes.data); setStaff(staffRes.data);
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
      setShowModal(false); fetchAll(); setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) { setFormError(err.response?.data?.message || 'Lỗi khi lưu'); }
    finally { setSubmitting(false); }
  };

  const statusBadgeClass = (s) => ({
    da_len_lich: 'bg-slate-100 text-slate-600',
    dang_chay: 'bg-sky-50 text-sky-700',
    hoan_thanh: 'bg-emerald-50 text-emerald-700',
    da_huy: 'bg-rose-50 text-rose-700'
  })[s] || 'bg-slate-100 text-slate-600';

  const statusLabel = (s) => ({ da_len_lich: 'Đã lên lịch', dang_chay: 'Đang chạy', hoan_thanh: 'Hoàn thành', da_huy: 'Đã hủy' })[s] || s;

  const menuItems = ROLE_MENU[userRole] || [];

  return (
    <div className="admin-dashboard">
      <AdminSidebar isOpen={sidebarOpen} userRole={userRole} userName={userName} menuItems={menuItems} onClose={() => setSidebarOpen(false)} />
      <div className="admin-main">
        <AdminTopbar userName={userName} userRole={userRole} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="admin-content">
          <div className="p-6 max-w-7xl mx-auto space-y-6">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800 flex items-center gap-2">
                  <Clock className="h-8 w-8 text-[#004b87]" /> Quản lý lịch trình
                </h1>
                <p className="text-slate-500 text-sm font-semibold mt-1">Lên lịch và quản lý các chuyến xe vận hành</p>
              </div>
              <Button onClick={openAdd} className="bg-[#004b87] hover:bg-[#003b6b] text-white font-extrabold h-10 rounded-xl px-5 border-none flex items-center gap-2 shadow-sm">
                <Plus className="h-4 w-4" /> Lên lịch chuyến
              </Button>
            </div>

            {successMsg && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm">
                <CheckCircle2 className="h-4 w-4" />{successMsg}
              </div>
            )}

            <Card className="border-slate-100 shadow-sm">
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center py-16">
                    <div className="h-8 w-8 border-4 border-[#004b87] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-extrabold text-slate-600">ID</TableHead>
                        <TableHead className="font-extrabold text-slate-600">Tuyến đường</TableHead>
                        <TableHead className="font-extrabold text-slate-600">Xe</TableHead>
                        <TableHead className="font-extrabold text-slate-600">Tài xế</TableHead>
                        <TableHead className="font-extrabold text-slate-600">Giờ đi</TableHead>
                        <TableHead className="font-extrabold text-slate-600">Giờ đến</TableHead>
                        <TableHead className="font-extrabold text-slate-600">Giá vé</TableHead>
                        <TableHead className="font-extrabold text-slate-600 text-center">Ghế trống</TableHead>
                        <TableHead className="font-extrabold text-slate-600 text-center">Trạng thái</TableHead>
                        <TableHead className="font-extrabold text-slate-600 text-end">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trips.length === 0 ? (
                        <TableRow><TableCell colSpan={10} className="text-center py-10 text-slate-400">
                          <Inbox className="h-8 w-8 mx-auto mb-2 text-slate-300" />Chưa có chuyến xe
                        </TableCell></TableRow>
                      ) : trips.map(t => (
                        <TableRow key={t.maChuyenXe} className="hover:bg-slate-50/50">
                          <TableCell className="font-bold text-slate-500">#{t.maChuyenXe}</TableCell>
                          <TableCell>
                            <span className="font-bold text-[#004b87]">{t.diemDi}</span>
                            <span className="text-slate-400 mx-1">→</span>
                            <span className="font-bold text-slate-700">{t.diemDen}</span>
                          </TableCell>
                          <TableCell className="font-semibold text-slate-600">{t.bienSoXe}</TableCell>
                          <TableCell className="font-semibold text-slate-600">{t.tenNhanVien || '-'}</TableCell>
                          <TableCell className="font-semibold text-slate-600 text-sm">{t.thoiGianDi ? new Date(t.thoiGianDi).toLocaleString('vi-VN') : '-'}</TableCell>
                          <TableCell className="font-semibold text-slate-600 text-sm">{t.thoiGianDen ? new Date(t.thoiGianDen).toLocaleString('vi-VN') : '-'}</TableCell>
                          <TableCell className="font-bold text-[#004b87]">{Number(t.giaCoBan).toLocaleString('vi-VN')}đ</TableCell>
                          <TableCell className="font-bold text-slate-700 text-center">{t.soGheConTrong}/{t.tongSoGhe}</TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                t.trangThaiChuyen === 'hoan_thanh' ? 'success' :
                                t.trangThaiChuyen === 'dang_chay' ? 'info' :
                                t.trangThaiChuyen === 'da_huy' ? 'destructive' : 'secondary'
                              }
                              className="font-bold rounded-lg text-xs px-2.5"
                            >
                              {statusLabel(t.trangThaiChuyen)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-end">
                            <button
                              onClick={() => openEdit(t)}
                              style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb' }}
                              className="h-8 w-8 p-0 rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:bg-blue-100"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Add/Edit Schedule Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl rounded-2xl bg-white border border-slate-200 p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="bg-slate-900 text-white p-6 pb-4">
            <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-sky-400" />
              {editTrip ? 'Cập nhật chuyến xe' : 'Lên lịch chuyến xe mới'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
              {formError && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-sm">
                  <X className="h-4 w-4" />{formError}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Tuyến đường *</label>
                  <select className={selectCls} value={form.maTuyenDuong} onChange={e => setForm({...form, maTuyenDuong: e.target.value})}>
                    <option value="">-- Chọn tuyến --</option>
                    {routes.map(r => <option key={r.maTuyenDuong} value={r.maTuyenDuong}>{r.diemDi} → {r.diemDen}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Phương tiện *</label>
                  <select className={selectCls} value={form.maPhuongTien} onChange={e => setForm({...form, maPhuongTien: e.target.value})}>
                    <option value="">-- Chọn xe --</option>
                    {vehicles.map(v => <option key={v.maPhuongTien} value={v.maPhuongTien}>{v.bienSoXe} ({v.loaiXe})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Tài xế</label>
                  <select className={selectCls} value={form.maNhanVien} onChange={e => setForm({...form, maNhanVien: e.target.value})}>
                    <option value="">-- Chọn tài xế --</option>
                    {staff.filter(s => s.vaiTro === 'DRIVER').map(s => <option key={s.maNguoiDung} value={s.maNguoiDung}>{s.tenNguoiDung}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Giá cơ bản (VNĐ) *</label>
                  <input className={inputCls} type="number" value={form.giaCoBan} onChange={e => setForm({...form, giaCoBan: e.target.value})} placeholder="250000" />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Thời gian đi *</label>
                  <input className={inputCls} type="datetime-local" value={form.thoiGianDi} onChange={e => setForm({...form, thoiGianDi: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Thời gian đến *</label>
                  <input className={inputCls} type="datetime-local" value={form.thoiGianDen} onChange={e => setForm({...form, thoiGianDen: e.target.value})} />
                </div>
                {editTrip && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Trạng thái</label>
                    <select className={selectCls} value={form.trangThaiChuyen} onChange={e => setForm({...form, trangThaiChuyen: e.target.value})}>
                      {TRANG_THAI_OPTIONS.map(o => <option key={o} value={o}>{statusLabel(o)}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-100 h-10 px-5 shadow-none">Hủy</Button>
              <Button type="submit" disabled={submitting} className="bg-[#004b87] hover:bg-[#003b6b] text-white font-extrabold h-10 px-5 rounded-xl border-none">
                {submitting ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SchedulesPage;
