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
import { MapPin, Plus, Pencil, Trash2, Inbox, X, CheckCircle2 } from 'lucide-react';

const API = 'http://localhost:5000/api';

const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 shadow-sm focus:border-[#004b87] focus:outline-none focus:ring-2 focus:ring-[#004b87]/15 transition-all";
const selectCls = inputCls;
const inputSmCls = "flex-1 min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-800 focus:border-[#004b87] focus:outline-none focus:ring-1 focus:ring-[#004b87]/15 transition-all";

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
    setTramDungArray([]); setNewTramDung({ name: '', time: '', type: 'stop' });
    setFormError(''); setShowModal(true);
  };

  const openEdit = (r) => {
    setEditRoute(r);
    setForm({ diemDi: r.diemDi, diemDen: r.diemDen, loaiDichVu: r.loaiDichVu, khoangCach: r.khoangCach || '' });
    const tramDung = r.danhSachTramDung ? JSON.parse(r.danhSachTramDung) : [];
    setTramDungArray(tramDung); setNewTramDung({ name: '', time: '', type: 'stop' });
    setFormError(''); setShowModal(true);
  };

  const addTramDung = () => {
    if (!newTramDung.name || !newTramDung.time) { setFormError('Vui lòng nhập tên trạm và giờ'); return; }
    setTramDungArray([...tramDungArray, newTramDung]);
    setNewTramDung({ name: '', time: '', type: 'stop' }); setFormError('');
  };

  const removeTramDung = (index) => setTramDungArray(tramDungArray.filter((_, i) => i !== index));

  const updateTramDung = (index, field, value) => {
    const updated = [...tramDungArray]; updated[index] = { ...updated[index], [field]: value }; setTramDungArray(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormError('');
    if (!form.diemDi || !form.diemDen) { setFormError('Vui lòng nhập điểm đi và điểm đến'); return; }
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
      setShowModal(false); fetchRoutes(); setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) { setFormError(err.response?.data?.message || 'Lỗi khi lưu'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xác nhận xóa tuyến đường này?')) return;
    try {
      await axios.delete(`${API}/admin/routes/${id}`, { headers: { Authorization: `Bearer ${token()}` } });
      setSuccessMsg('Xóa tuyến đường thành công'); fetchRoutes(); setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) { alert(err.response?.data?.message || 'Lỗi khi xóa'); }
  };

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
                  <MapPin className="h-8 w-8 text-[#004b87]" /> Quản lý tuyến đường
                </h1>
                <p className="text-slate-500 text-sm font-semibold mt-1">Quản lý các tuyến vận chuyển nội thành và ngoại thành</p>
              </div>
              <Button onClick={openAdd} className="bg-[#004b87] hover:bg-[#003b6b] text-white font-extrabold h-10 rounded-xl px-5 border-none flex items-center gap-2 shadow-sm">
                <Plus className="h-4 w-4" /> Thêm tuyến
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
                        <TableHead className="font-extrabold text-slate-600">Điểm đi</TableHead>
                        <TableHead className="font-extrabold text-slate-600">Điểm đến</TableHead>
                        <TableHead className="font-extrabold text-slate-600">Loại tuyến</TableHead>
                        <TableHead className="font-extrabold text-slate-600">Khoảng cách</TableHead>
                        <TableHead className="font-extrabold text-slate-600">Trạm dừng</TableHead>
                        <TableHead className="font-extrabold text-slate-600">Ngày tạo</TableHead>
                        <TableHead className="font-extrabold text-slate-600 text-end">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {routes.length === 0 ? (
                        <TableRow><TableCell colSpan={8} className="text-center py-10 text-slate-400">
                          <Inbox className="h-8 w-8 mx-auto mb-2 text-slate-300" />Chưa có tuyến đường
                        </TableCell></TableRow>
                      ) : routes.map(r => (
                        <TableRow key={r.maTuyenDuong} className="hover:bg-slate-50/50">
                          <TableCell className="font-bold text-slate-500">#{r.maTuyenDuong}</TableCell>
                          <TableCell className="font-extrabold text-[#004b87]">{r.diemDi}</TableCell>
                          <TableCell className="font-extrabold text-slate-800">{r.diemDen}</TableCell>
                          <TableCell>
                            <Badge
                              variant={r.loaiDichVu === 'city' ? 'info' : 'default'}
                              className="font-bold rounded-lg text-xs px-2.5"
                            >
                              {r.loaiDichVu === 'city' ? 'Nội thành' : 'Ngoại thành'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-slate-600">{r.khoangCach ? `${r.khoangCach} km` : '-'}</TableCell>
                          <TableCell className="font-semibold text-slate-600">
                            {r.danhSachTramDung ? `${JSON.parse(r.danhSachTramDung).length} trạm` : '-'}
                          </TableCell>
                          <TableCell className="font-semibold text-slate-500 text-sm">
                            {r.ngayTao ? new Date(r.ngayTao).toLocaleDateString('vi-VN') : '-'}
                          </TableCell>
                          <TableCell className="text-end">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openEdit(r)}
                                style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb' }}
                                className="h-8 w-8 p-0 rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:bg-blue-100"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(r.maTuyenDuong)}
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

      {/* Add/Edit Route Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl rounded-2xl bg-white border border-slate-200 p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="bg-slate-900 text-white p-6 pb-4">
            <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
              <MapPin className="h-5 w-5 text-sky-400" />
              {editRoute ? 'Cập nhật tuyến đường' : 'Thêm tuyến đường mới'}
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
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Điểm đi *</label>
                  <input className={inputCls} value={form.diemDi} onChange={e => setForm({...form, diemDi: e.target.value})} placeholder="TP. Hồ Chí Minh" />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Điểm đến *</label>
                  <input className={inputCls} value={form.diemDen} onChange={e => setForm({...form, diemDen: e.target.value})} placeholder="Đà Lạt" />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Loại dịch vụ *</label>
                  <select className={selectCls} value={form.loaiDichVu} onChange={e => setForm({...form, loaiDichVu: e.target.value})}>
                    <option value="city">Nội thành (city)</option>
                    <option value="interCity">Ngoại thành (interCity)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Khoảng cách (km)</label>
                  <input className={inputCls} type="number" value={form.khoangCach} onChange={e => setForm({...form, khoangCach: e.target.value})} placeholder="300" />
                </div>
              </div>

              {/* Tram Dung */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Danh sách trạm dừng
                </label>
                <div className="border border-slate-200 rounded-xl p-3 max-h-[200px] overflow-y-auto space-y-2 bg-slate-50/50">
                  {tramDungArray.length === 0 ? (
                    <p className="text-slate-400 font-medium text-sm text-center py-2">Chưa có trạm dừng nào</p>
                  ) : tramDungArray.map((tram, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100">
                      <input type="text" className={inputSmCls} placeholder="Tên trạm" value={tram.name} onChange={e => updateTramDung(idx, 'name', e.target.value)} />
                      <input type="time" className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium text-slate-800 w-28 focus:outline-none focus:border-[#004b87]" value={tram.time} onChange={e => updateTramDung(idx, 'time', e.target.value)} />
                      <select className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium text-slate-800 w-32 focus:outline-none focus:border-[#004b87]" value={tram.type} onChange={e => updateTramDung(idx, 'type', e.target.value)}>
                        <option value="start">Điểm đi</option>
                        <option value="stop">Trạm dừng</option>
                        <option value="end">Điểm đến</option>
                      </select>
                      <Button type="button" onClick={() => removeTramDung(idx)} className="h-8 w-8 p-0 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 shadow-none flex-shrink-0">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
                {/* Add new stop */}
                <div className="mt-3 border border-dashed border-sky-300 rounded-xl p-3 bg-sky-50/30 space-y-2">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-sky-600 mb-2">Thêm trạm mới</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input type="text" className={inputSmCls} placeholder="Tên trạm" value={newTramDung.name} onChange={e => setNewTramDung({...newTramDung, name: e.target.value})} />
                    <input type="time" className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium text-slate-800 w-28 focus:outline-none focus:border-[#004b87]" value={newTramDung.time} onChange={e => setNewTramDung({...newTramDung, time: e.target.value})} />
                    <select className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium text-slate-800 w-32 focus:outline-none focus:border-[#004b87]" value={newTramDung.type} onChange={e => setNewTramDung({...newTramDung, type: e.target.value})}>
                      <option value="start">Điểm đi</option>
                      <option value="stop">Trạm dừng</option>
                      <option value="end">Điểm đến</option>
                    </select>
                    <Button type="button" onClick={addTramDung} className="bg-[#004b87] hover:bg-[#003b6b] text-white font-extrabold h-9 rounded-lg px-4 border-none text-sm flex-shrink-0">
                      + Thêm
                    </Button>
                  </div>
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

export default RoutesPage;
