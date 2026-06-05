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
import { Bus, Plus, Pencil, Trash2, Inbox, X, CheckCircle2 } from 'lucide-react';

const API = 'http://localhost:5000/api';
const TRANG_THAI_OPTIONS = ['san_sang', 'maintenance', 'inactive'];
const LOAI_XE_OPTIONS = ['16-seater', '35-seater'];

const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 shadow-sm focus:border-[#004b87] focus:outline-none focus:ring-2 focus:ring-[#004b87]/15 transition-all disabled:opacity-60 disabled:cursor-not-allowed";
const selectCls = inputCls;

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
  const [form, setForm] = useState({
    bienSoXe: '', nhanHieu: '', mauSac: '', namSanXuat: '', tongSoGhe: '',
    loaiXe: '16-seater', trangThaiXe: 'san_sang', ngayMuaVao: '', ngayBaoTriLanSau: ''
  });

  useEffect(() => {
    const role = AuthUtil.getCurrentRole();
    const user = AuthUtil.getCurrentUser();
    if (!role) { navigate('/login'); return; }
    setUserRole(role); setUserName(user?.name || 'User');
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
    setForm({
      bienSoXe: v.bienSoXe, nhanHieu: v.nhanHieu || '', mauSac: v.mauSac || '',
      namSanXuat: v.namSanXuat || '', tongSoGhe: v.tongSoGhe, loaiXe: v.loaiXe,
      trangThaiXe: v.trangThaiXe,
      ngayMuaVao: v.ngayMuaVao ? v.ngayMuaVao.split('T')[0] : '',
      ngayBaoTriLanSau: v.ngayBaoTriLanSau ? v.ngayBaoTriLanSau.split('T')[0] : ''
    });
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

  const statusBadgeClass = (s) => {
    const map = {
      san_sang: 'bg-emerald-50 text-emerald-700',
      maintenance: 'bg-amber-50 text-amber-700',
      inactive: 'bg-slate-100 text-slate-600',
      active: 'bg-emerald-50 text-emerald-700'
    };
    return map[s] || 'bg-slate-100 text-slate-600';
  };
  const statusLabel = (s) => ({ san_sang: 'Sẵn sàng', maintenance: 'Bảo trì', inactive: 'Ngừng HĐ', active: 'Hoạt động' }[s] || s);


  const menuItems = ROLE_MENU[userRole] || [];

  return (
    <div className="admin-dashboard">
      <AdminSidebar isOpen={sidebarOpen} userRole={userRole} userName={userName} menuItems={menuItems} onClose={() => setSidebarOpen(false)} />
      <div className="admin-main">
        <AdminTopbar userName={userName} userRole={userRole} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="admin-content">
          <div className="p-6 max-w-7xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800 flex items-center gap-2">
                  <Bus className="h-8 w-8 text-[#004b87]" /> Quản lý đội xe
                </h1>
                <p className="text-slate-500 text-sm font-semibold mt-1">Quản lý danh sách phương tiện vận chuyển</p>
              </div>
              <Button onClick={openAdd} className="bg-[#004b87] hover:bg-[#003b6b] text-white font-extrabold h-10 rounded-xl px-5 border-none flex items-center gap-2 shadow-sm">
                <Plus className="h-4 w-4" /> Thêm xe
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
                        <TableHead className="font-extrabold text-slate-600">Biển số</TableHead>
                        <TableHead className="font-extrabold text-slate-600">Nhãn hiệu</TableHead>
                        <TableHead className="font-extrabold text-slate-600">Màu</TableHead>
                        <TableHead className="font-extrabold text-slate-600">Năm SX</TableHead>
                        <TableHead className="font-extrabold text-slate-600">Loại xe</TableHead>
                        <TableHead className="font-extrabold text-slate-600 text-center">Số ghế</TableHead>
                        <TableHead className="font-extrabold text-slate-600 text-center">Trạng thái</TableHead>
                        <TableHead className="font-extrabold text-slate-600">Bảo trì tiếp</TableHead>
                        <TableHead className="font-extrabold text-slate-600 text-end">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehicles.length === 0 ? (
                        <TableRow><TableCell colSpan={10} className="text-center py-10 text-slate-400">
                          <Inbox className="h-8 w-8 mx-auto mb-2 text-slate-300" />Chưa có phương tiện
                        </TableCell></TableRow>
                      ) : vehicles.map(v => (
                        <TableRow key={v.maPhuongTien} className="hover:bg-slate-50/50">
                          <TableCell className="font-bold text-slate-500">#{v.maPhuongTien}</TableCell>
                          <TableCell className="font-extrabold text-slate-800">{v.bienSoXe}</TableCell>
                          <TableCell className="font-semibold text-slate-600">{v.nhanHieu}</TableCell>
                          <TableCell className="font-semibold text-slate-600">{v.mauSac}</TableCell>
                          <TableCell className="font-semibold text-slate-600">{v.namSanXuat}</TableCell>
                          <TableCell>
                            <Badge variant="info" className="font-bold rounded-lg text-xs px-2.5">{v.loaiXe}</Badge>
                          </TableCell>
                          <TableCell className="font-bold text-slate-700 text-center">{v.tongSoGhe}</TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={v.trangThaiXe === 'san_sang' || v.trangThaiXe === 'active' ? 'success' : v.trangThaiXe === 'maintenance' ? 'warning' : 'secondary'}
                              className="font-bold rounded-lg text-xs px-2.5"
                            >
                              {statusLabel(v.trangThaiXe)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-slate-500 text-sm">
                            {v.ngayBaoTriLanSau ? new Date(v.ngayBaoTriLanSau).toLocaleDateString('vi-VN') : '-'}
                          </TableCell>
                          <TableCell className="text-end">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openEdit(v)}
                                style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb' }}
                                className="h-8 w-8 p-0 rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:bg-blue-100"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(v.maPhuongTien)}
                                style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#e11d48' }}
                                className="h-8 w-8 p-0 rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:bg-rose-100"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
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

      {/* Add/Edit Vehicle Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl rounded-2xl bg-white border border-slate-200 p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="bg-slate-900 text-white p-6 pb-4">
            <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
              <Bus className="h-5 w-5 text-sky-400" />
              {editVehicle ? 'Cập nhật phương tiện' : 'Thêm phương tiện mới'}
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
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Biển số xe *</label>
                  <input className={inputCls} value={form.bienSoXe} onChange={e => setForm({...form, bienSoXe: e.target.value})} placeholder="51B-12345" disabled={!!editVehicle} />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Loại xe *</label>
                  <select className={selectCls} value={form.loaiXe} onChange={e => setForm({...form, loaiXe: e.target.value, tongSoGhe: e.target.value === '16-seater' ? 16 : 35})}>
                    {LOAI_XE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Nhãn hiệu</label>
                  <input className={inputCls} value={form.nhanHieu} onChange={e => setForm({...form, nhanHieu: e.target.value})} placeholder="Hyundai" />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Màu sắc</label>
                  <input className={inputCls} value={form.mauSac} onChange={e => setForm({...form, mauSac: e.target.value})} placeholder="Trắng" />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Năm sản xuất</label>
                  <input className={inputCls} type="number" value={form.namSanXuat} onChange={e => setForm({...form, namSanXuat: e.target.value})} placeholder="2022" />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Số ghế *</label>
                  <input className={inputCls} type="number" value={form.tongSoGhe} onChange={e => setForm({...form, tongSoGhe: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Trạng thái</label>
                  <select className={selectCls} value={form.trangThaiXe} onChange={e => setForm({...form, trangThaiXe: e.target.value})}>
                    {TRANG_THAI_OPTIONS.map(o => <option key={o} value={o}>{statusLabel(o)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Ngày mua vào</label>
                  <input className={inputCls} type="date" value={form.ngayMuaVao} onChange={e => setForm({...form, ngayMuaVao: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Bảo trì lần sau</label>
                  <input className={inputCls} type="date" value={form.ngayBaoTriLanSau} onChange={e => setForm({...form, ngayBaoTriLanSau: e.target.value})} />
                </div>
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

export default VehiclesPage;
