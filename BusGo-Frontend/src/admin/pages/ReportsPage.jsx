import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthUtil, StorageUtil } from '@/utils/helpers';
import { ROLE_MENU } from '@/utils/constants';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopbar from '../components/AdminTopbar';
import axios from 'axios';
import './AdminDashboard.css';

// Import custom UI components
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

// Import Lucide icons
import {
  Calendar, Search, DollarSign, TrendingUp, Bus, Star, AlertTriangle,
  MapPin, Clock, User, Users, ChevronRight, X, Inbox, FileText, CheckCircle2
} from 'lucide-react';

const API = 'http://localhost:5000/api';

function ReportsPage() {
  const navigate = useNavigate();
  const location = useLocation();
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

  // Incident states
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveStatus, setResolveStatus] = useState('da_xu_ly');
  const [resolveNotes, setResolveNotes] = useState('');
  const [updateTripStatus, setUpdateTripStatus] = useState('');
  const [zoomImage, setZoomImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab') || 'revenue';

  useEffect(() => {
    const role = AuthUtil.getCurrentRole();
    const user = AuthUtil.getCurrentUser();
    if (!role) { navigate('/login'); return; }
    setUserRole(role); setUserName(user?.name || 'User');
  }, [navigate]);

  useEffect(() => {
    if (['revenue', 'routes', 'ratings', 'incidents'].includes(tabParam)) {
      setActiveTab(tabParam);
      fetchData(tabParam);
    } else {
      setActiveTab('revenue');
      fetchData('revenue');
    }
  }, [tabParam]);

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
      } else if (tab === 'incidents') {
        const res = await axios.get(`${API}/admin/incidents`, { headers: headers() });
        setIncidents(res.data || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSearch = () => fetchData(activeTab);

  const handleTabChange = (tab) => {
    navigate(`/admin/reports?tab=${tab}`);
  };

  const handleOpenResolveModal = (incident) => {
    setSelectedIncident(incident);
    setResolveStatus(incident.trangThaiSuCo || 'da_xu_ly');
    setResolveNotes(incident.ghiChu || '');
    setUpdateTripStatus('');
    setShowResolveModal(true);
  };

  const handleResolveIncident = async (e) => {
    e.preventDefault();
    if (!selectedIncident) return;
    setSubmitting(true);
    try {
      await axios.put(`${API}/admin/incidents/${selectedIncident.maSuCo}/resolve`, {
        trangThaiSuCo: resolveStatus,
        ghiChuGiaiQuyet: resolveNotes,
        tripStatus: resolveStatus === 'da_xu_ly' ? updateTripStatus : undefined
      }, { headers: headers() });
      setShowResolveModal(false);
      fetchData('incidents');
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi xử lý sự cố. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (n) => n ? Number(n).toLocaleString('vi-VN') : '0';

  const menuItems = ROLE_MENU[userRole] || [];

  const filteredIncidents = incidents ? incidents.filter(inc => {
    if (!inc.thoiGianTao) return true;
    const date = new Date(inc.thoiGianTao).toISOString().split('T')[0];
    return date >= dateFrom && date <= dateTo;
  }) : [];

  const TABS = [
    { key: 'revenue', emoji: '💰', label: 'Doanh thu', Icon: DollarSign },
    { key: 'routes', emoji: '🛣️', label: 'Tuyến đường', Icon: MapPin },
    { key: 'ratings', emoji: '⭐', label: 'Đánh giá', Icon: Star },
    { key: 'incidents', emoji: '⚠️', label: 'Sự cố', Icon: AlertTriangle },
  ];

  return (
    <div className="admin-dashboard">
      <AdminSidebar isOpen={sidebarOpen} userRole={userRole} userName={userName} menuItems={menuItems} onClose={() => setSidebarOpen(false)} />
      <div className="admin-main">
        <AdminTopbar userName={userName} userRole={userRole} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="admin-content">
          <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">

            {/* ── Page Header ── */}
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800 flex items-center gap-2.5">
                <TrendingUp className="h-7 w-7 text-[#004b87]" />
                Thống kê &amp; Báo cáo
              </h1>
              <p className="text-slate-400 text-sm font-semibold mt-1">
                Theo dõi doanh thu, tuyến đường, đánh giá và sự cố vận hành
              </p>
            </div>

            {/* ── Date Filter + Search ── */}
            <Card className="border-slate-100 shadow-sm">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex-1 min-w-[160px]">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> Từ ngày
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 focus:border-[#004b87] focus:outline-none focus:ring-2 focus:ring-[#004b87]/10 transition-all"
                      type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 min-w-[160px]">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> Đến ngày
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 focus:border-[#004b87] focus:outline-none focus:ring-2 focus:ring-[#004b87]/10 transition-all"
                      type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleSearch}
                    className="bg-[#004b87] hover:bg-[#003b6b] text-white font-extrabold px-6 h-[42px] rounded-xl shadow-sm border-none flex items-center gap-2 flex-shrink-0"
                  >
                    <Search className="h-4 w-4" /> Xem báo cáo
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* ── Tab Pills ── */}
            <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/70 rounded-2xl border border-slate-200/60 w-fit">
              {TABS.map(({ key, label, Icon }) => {
                const isActive = activeTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleTabChange(key)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-extrabold tracking-wide transition-all border-none cursor-pointer ${
                      isActive
                        ? 'bg-white text-[#004b87] shadow-sm'
                        : 'text-slate-500 bg-transparent hover:text-slate-800 hover:bg-white/60'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-[#004b87]' : 'text-slate-400'}`} />
                    {label}
                  </button>
                );
              })}
            </div>

            {/* ── Loading ── */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-3">
                <div className="h-10 w-10 border-4 border-[#004b87] border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 text-sm font-semibold">Đang tải báo cáo...</p>
              </div>
            ) : (
              <>
                {/* ══════════ TAB: DOANH THU ══════════ */}
                {activeTab === 'revenue' && revenue && (
                  <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                      {[
                        { label: 'Doanh thu bán vé', value: `${fmt(revenue.summary?.tongDoanhThuVe)}đ`, color: 'blue', Icon: DollarSign, bg: 'bg-blue-50', text: 'text-[#004b87]' },
                        { label: 'Doanh thu hàng hóa', value: `${fmt(revenue.summary?.tongDoanhThuHangHoa)}đ`, color: 'emerald', Icon: TrendingUp, bg: 'bg-emerald-50', text: 'text-emerald-600' },
                        { label: 'Tổng doanh thu', value: `${fmt(revenue.summary?.tongDoanhThu)}đ`, color: 'rose', Icon: DollarSign, bg: 'bg-rose-50', text: 'text-rose-600' },
                        { label: 'Tổng số vé bán', value: revenue.summary?.tongSoVe || 0, color: 'amber', Icon: Users, bg: 'bg-amber-50', text: 'text-amber-500' },
                      ].map(({ label, value, Icon, bg, text }) => (
                        <Card key={label} className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-5 flex items-center justify-between gap-4">
                            <div className="space-y-1 min-w-0">
                              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider leading-tight">{label}</p>
                              <p className={`text-xl font-black tracking-tight ${text} truncate`}>{value}</p>
                            </div>
                            <div className={`h-12 w-12 rounded-2xl ${bg} flex items-center justify-center ${text} flex-shrink-0`}>
                              <Icon className="h-6 w-6" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Detail Tables */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                      {/* Daily revenue table */}
                      <Card className="lg:col-span-2 border-slate-100 shadow-sm overflow-hidden">
                        <CardHeader className="pb-0 border-b border-slate-100 px-5 pt-5">
                          <CardTitle className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                            <Calendar className="h-4.5 w-4.5 text-[#004b87]" /> Doanh thu theo ngày
                          </CardTitle>
                        </CardHeader>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader className="bg-slate-50">
                              <TableRow>
                                <TableHead className="font-extrabold text-slate-600 whitespace-nowrap">Ngày</TableHead>
                                <TableHead className="font-extrabold text-slate-600 whitespace-nowrap">Doanh thu vé</TableHead>
                                <TableHead className="font-extrabold text-slate-600 whitespace-nowrap">Hàng hóa</TableHead>
                                <TableHead className="font-extrabold text-slate-600 whitespace-nowrap">Tổng cộng</TableHead>
                                <TableHead className="font-extrabold text-slate-600 text-center whitespace-nowrap">Số vé</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {!revenue.daily?.length ? (
                                <TableRow>
                                  <TableCell colSpan={5} className="text-center py-10 text-slate-400 font-semibold">
                                    <Inbox className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                    Không có dữ liệu
                                  </TableCell>
                                </TableRow>
                              ) : revenue.daily.map((d, i) => (
                                <TableRow key={i} className="hover:bg-slate-50/50">
                                  <TableCell className="font-semibold text-slate-700 whitespace-nowrap">
                                    {new Date(d.ngay).toLocaleDateString('vi-VN')}
                                  </TableCell>
                                  <TableCell className="font-semibold text-slate-600 whitespace-nowrap">{fmt(d.doanhThuVe)}đ</TableCell>
                                  <TableCell className="font-semibold text-slate-600 whitespace-nowrap">{fmt(d.doanhThuHangHoa)}đ</TableCell>
                                  <TableCell className="font-black text-[#004b87] whitespace-nowrap">{fmt(d.tongDoanhThu)}đ</TableCell>
                                  <TableCell className="font-bold text-slate-600 text-center">{d.soVe}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </Card>

                      {/* Payment methods */}
                      <Card className="border-slate-100 shadow-sm">
                        <CardHeader className="pb-0 border-b border-slate-100 px-5 pt-5">
                          <CardTitle className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                            <DollarSign className="h-4.5 w-4.5 text-[#004b87]" /> Phương thức thanh toán
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                          <div className="divide-y divide-slate-100">
                            {!revenue.byPaymentMethod?.length ? (
                              <p className="text-slate-400 font-semibold text-center py-8 text-sm">Không có dữ liệu</p>
                            ) : revenue.byPaymentMethod.map((p, i) => (
                              <div key={i} className="flex justify-between items-center py-3 gap-3">
                                <span className="text-sm font-bold text-slate-600 flex items-center gap-2 min-w-0 truncate">
                                  <span className="h-2 w-2 rounded-full bg-[#004b87] flex-shrink-0" />
                                  {p.tenPhuongThuc}
                                </span>
                                <span className="text-sm font-extrabold text-[#004b87] bg-sky-50 px-3 py-1 rounded-xl flex-shrink-0 whitespace-nowrap">
                                  {fmt(p.tongTien)}đ
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {/* ══════════ TAB: TUYẾN ĐƯỜNG ══════════ */}
                {activeTab === 'routes' && routeStats && (
                  <Card className="border-slate-100 shadow-sm overflow-hidden">
                    <CardHeader className="pb-0 border-b border-slate-100 px-5 pt-5">
                      <CardTitle className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                        <MapPin className="h-4.5 w-4.5 text-[#004b87]" /> Tỷ lệ lấp đầy theo tuyến đường
                      </CardTitle>
                    </CardHeader>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead className="font-extrabold text-slate-600 whitespace-nowrap">Tuyến đường</TableHead>
                            <TableHead className="font-extrabold text-slate-600 whitespace-nowrap">Loại tuyến</TableHead>
                            <TableHead className="font-extrabold text-slate-600 text-center whitespace-nowrap">Số chuyến</TableHead>
                            <TableHead className="font-extrabold text-slate-600 text-center whitespace-nowrap">Ghế đã đặt</TableHead>
                            <TableHead className="font-extrabold text-slate-600 text-center whitespace-nowrap">Tổng ghế</TableHead>
                            <TableHead className="font-extrabold text-slate-600 min-w-[160px]">Tỷ lệ lấp đầy</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {!routeStats.routes?.length ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-10 text-slate-400 font-semibold">
                                <Inbox className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                Không có dữ liệu
                              </TableCell>
                            </TableRow>
                          ) : routeStats.routes.map((r, i) => (
                            <TableRow key={i} className="hover:bg-slate-50/50">
                              <TableCell className="font-semibold text-slate-700 whitespace-nowrap">
                                <span className="font-bold text-[#004b87]">{r.diemDi}</span>
                                <span className="text-slate-400 mx-1.5">→</span>
                                <span className="font-bold text-slate-800">{r.diemDen}</span>
                              </TableCell>
                              <TableCell>
                                <Badge className={`rounded-lg font-bold border-none px-2 py-0.5 text-xs ${
                                  r.loaiDichVu === 'city'
                                    ? 'bg-sky-50 text-sky-700 hover:bg-sky-50'
                                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-50'
                                }`}>
                                  {r.loaiDichVu === 'city' ? 'Nội thành' : 'Ngoại thành'}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-semibold text-slate-600 text-center">{r.soChuyenXe}</TableCell>
                              <TableCell className="font-semibold text-slate-600 text-center">{r.tongGheDat}</TableCell>
                              <TableCell className="font-semibold text-slate-600 text-center">{r.tongGhe}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden min-w-[80px]">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        r.tyLeLapDay >= 75 ? 'bg-emerald-500' :
                                        r.tyLeLapDay >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                                      }`}
                                      style={{ width: `${r.tyLeLapDay}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-extrabold text-slate-700 min-w-[36px] text-right">
                                    {r.tyLeLapDay}%
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                )}

                {/* ══════════ TAB: ĐÁNH GIÁ ══════════ */}
                {activeTab === 'ratings' && ratings && (
                  <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                      {[
                        { label: 'Tổng số đánh giá', value: ratings.summary?.tongSoDanhGia || 0, Icon: Users, bg: 'bg-blue-50', text: 'text-[#004b87]' },
                        { label: 'Điểm trung bình', value: ratings.summary?.diemTrungBinh ? `${ratings.summary.diemTrungBinh}/5` : 'N/A', Icon: Star, bg: 'bg-amber-50', text: 'text-amber-500' },
                        { label: 'Phục vụ TB', value: ratings.summary?.diemPhucVuTrungBinh ? `${ratings.summary.diemPhucVuTrungBinh}/5` : 'N/A', Icon: User, bg: 'bg-emerald-50', text: 'text-emerald-600' },
                        { label: 'Giao tiếp TB', value: ratings.summary?.diemGiaoThiepTrungBinh ? `${ratings.summary.diemGiaoThiepTrungBinh}/5` : 'N/A', Icon: Star, bg: 'bg-indigo-50', text: 'text-indigo-600' },
                      ].map(({ label, value, Icon, bg, text }) => (
                        <Card key={label} className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-5 flex items-center justify-between gap-4">
                            <div className="space-y-1 min-w-0">
                              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider leading-tight">{label}</p>
                              <p className={`text-xl font-black tracking-tight ${text}`}>{value}</p>
                            </div>
                            <div className={`h-12 w-12 rounded-2xl ${bg} flex items-center justify-center ${text} flex-shrink-0`}>
                              <Icon className="h-6 w-6" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Driver ratings + recent reviews */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      <Card className="border-slate-100 shadow-sm">
                        <CardHeader className="pb-0 border-b border-slate-100 px-5 pt-5">
                          <CardTitle className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                            <User className="h-4.5 w-4.5 text-[#004b87]" /> Đánh giá theo tài xế
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                          <div className="divide-y divide-slate-100">
                            {!ratings.byDriver?.length ? (
                              <p className="text-slate-400 font-semibold text-center py-8 text-sm">Chưa có dữ liệu</p>
                            ) : ratings.byDriver.map((d, i) => (
                              <div key={i} className="flex justify-between items-center py-3 gap-3">
                                <span className="text-sm font-bold text-slate-700 truncate">{d.tenTaiXe}</span>
                                <span className="text-xs font-extrabold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl flex items-center gap-1 flex-shrink-0">
                                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                                  {d.diemTrungBinh} <span className="text-slate-400 font-medium">({d.soDanhGia})</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-slate-100 shadow-sm">
                        <CardHeader className="pb-0 border-b border-slate-100 px-5 pt-5">
                          <CardTitle className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                            <Star className="h-4.5 w-4.5 text-[#004b87]" /> Nhận xét gần nhất
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-3">
                          {!ratings.recentReviews?.length ? (
                            <p className="text-slate-400 font-semibold text-center py-8 text-sm">Chưa có nhận xét</p>
                          ) : ratings.recentReviews.map((r, i) => (
                            <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30 hover:bg-slate-50/70 transition-colors">
                              <div className="flex justify-between items-start mb-1.5 gap-2">
                                <span className="font-extrabold text-slate-800 text-sm truncate">{r.tenKhachHang}</span>
                                <div className="flex gap-0.5 flex-shrink-0">
                                  {Array.from({ length: r.diemDanhGia }).map((_, idx) => (
                                    <Star key={idx} className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                                  ))}
                                </div>
                              </div>
                              <div className="text-xs font-semibold text-slate-400 flex items-center gap-1 mb-2">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                {r.diemDi} → {r.diemDen}
                              </div>
                              {r.nhanXet && (
                                <p className="text-xs italic text-slate-600 bg-white border border-slate-100 p-3 rounded-xl font-medium leading-relaxed">
                                  "{r.nhanXet}"
                                </p>
                              )}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {/* ══════════ TAB: SỰ CỐ ══════════ */}
                {activeTab === 'incidents' && (
                  <Card className="border-slate-100 shadow-sm overflow-hidden">
                    <CardHeader className="border-b border-slate-100 px-5 py-4 flex flex-row items-center justify-between gap-4 flex-wrap">
                      <div>
                        <CardTitle className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                          <AlertTriangle className="h-4.5 w-4.5 text-rose-500 animate-pulse" />
                          Nhật ký &amp; Quản lý Sự cố Vận hành
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">Các sự cố báo cáo bởi tài xế dọc đường đi</CardDescription>
                      </div>
                      <Badge className="bg-rose-50 hover:bg-rose-50 text-rose-600 border-none font-extrabold px-3 py-1.5 rounded-xl text-xs">
                        {filteredIncidents.length} báo cáo
                      </Badge>
                    </CardHeader>
                    <div className="overflow-x-auto">
                      <Table className="min-w-[900px]">
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead className="font-extrabold text-slate-600 whitespace-nowrap">Mã SC</TableHead>
                            <TableHead className="font-extrabold text-slate-600 whitespace-nowrap">Chuyến xe</TableHead>
                            <TableHead className="font-extrabold text-slate-600 whitespace-nowrap">Tài xế</TableHead>
                            <TableHead className="font-extrabold text-slate-600 whitespace-nowrap">Phương tiện</TableHead>
                            <TableHead className="font-extrabold text-slate-600 whitespace-nowrap">Sự cố</TableHead>
                            <TableHead className="font-extrabold text-slate-600 text-center whitespace-nowrap">Mức độ</TableHead>
                            <TableHead className="font-extrabold text-slate-600 whitespace-nowrap">Thời gian</TableHead>
                            <TableHead className="font-extrabold text-slate-600 text-center whitespace-nowrap">Ảnh</TableHead>
                            <TableHead className="font-extrabold text-slate-600 text-center whitespace-nowrap">Trạng thái</TableHead>
                            <TableHead className="font-extrabold text-slate-600 text-right whitespace-nowrap">Thao tác</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredIncidents.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={10} className="text-center py-14 text-slate-400 font-semibold">
                                <Inbox className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                                Không tìm thấy báo cáo sự cố nào
                                <p className="text-xs font-medium text-slate-400 mt-1">Vui lòng kiểm tra lại bộ lọc thời gian</p>
                              </TableCell>
                            </TableRow>
                          ) : filteredIncidents.map((inc) => (
                            <TableRow key={inc.maSuCo} className="hover:bg-slate-50/50">
                              <TableCell className="font-bold text-slate-700 whitespace-nowrap">#SC{inc.maSuCo}</TableCell>
                              <TableCell className="whitespace-nowrap">
                                <div className="font-bold text-slate-800 text-sm">{inc.diemDi} → {inc.diemDen}</div>
                                <div className="text-xs text-slate-400 mt-0.5">#{inc.maChuyenXe}</div>
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <div className="font-bold text-slate-800 text-sm">{inc.tenTaiXe}</div>
                                <div className="text-xs text-slate-400 mt-0.5">{inc.soDienThoaiTaiXe}</div>
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <Badge className="bg-slate-100 hover:bg-slate-100 text-slate-700 font-bold border-none rounded-lg px-2 py-0.5 text-xs">
                                  {inc.bienSoXe}
                                </Badge>
                                <div className="text-xs text-slate-400 mt-1">{inc.loaiXe}</div>
                              </TableCell>
                              <TableCell>
                                <div className="font-extrabold text-rose-600 text-sm whitespace-nowrap">{inc.loaiSuCo}</div>
                                <div className="text-xs text-slate-400 max-w-[140px] truncate mt-0.5" title={inc.moTa}>
                                  {inc.moTa || 'Không có mô tả'}
                                </div>
                              </TableCell>
                              <TableCell className="text-center whitespace-nowrap">
                                <Badge className={`font-bold border-none rounded-lg text-xs px-2.5 py-0.5 ${
                                  inc.mucDo === 'Nghiêm trọng' ? 'bg-rose-50 text-rose-700 hover:bg-rose-50' :
                                  inc.mucDo === 'Trung bình' ? 'bg-amber-50 text-amber-700 hover:bg-amber-50' :
                                  'bg-sky-50 text-sky-700 hover:bg-sky-50'
                                }`}>
                                  {inc.mucDo}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                                {new Date(inc.thoiGianTao).toLocaleString('vi-VN')}
                              </TableCell>
                              <TableCell className="text-center">
                                {inc.anhMinhChung ? (
                                  <img
                                    src={inc.anhMinhChung}
                                    alt="Proof"
                                    className="h-10 w-10 rounded-xl object-cover cursor-zoom-in mx-auto border border-slate-200 hover:border-[#004b87] hover:scale-105 transition-all"
                                    onClick={() => setZoomImage(inc.anhMinhChung)}
                                  />
                                ) : (
                                  <span className="text-xs font-semibold text-slate-400">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center whitespace-nowrap">
                                <Badge className={`font-bold border-none rounded-lg text-xs px-2.5 py-0.5 ${
                                  inc.trangThaiSuCo === 'da_xu_ly' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50' :
                                  inc.trangThaiSuCo === 'dang_xu_ly' ? 'bg-amber-50 text-amber-700 hover:bg-amber-50' :
                                  'bg-rose-50 text-rose-700 hover:bg-rose-50'
                                }`}>
                                  {inc.trangThaiSuCo === 'da_xu_ly' ? 'Đã xử lý' :
                                   inc.trangThaiSuCo === 'dang_xu_ly' ? 'Đang xử lý' : 'Chờ xử lý'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  onClick={() => handleOpenResolveModal(inc)}
                                  className="bg-[#004b87] hover:bg-[#003b6b] text-white font-extrabold h-8 rounded-lg text-xs px-3 shadow-sm border-none"
                                >
                                  Xử lý
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* ══════════ RESOLVE DIALOG ══════════ */}
      <Dialog open={showResolveModal} onOpenChange={setShowResolveModal}>
        <DialogContent className="max-w-2xl rounded-2xl bg-white border border-slate-200 p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="bg-slate-900 text-white p-6 pb-4">
            <DialogTitle className="text-base font-black tracking-tight flex items-center gap-2 text-white">
              <AlertTriangle className="h-5 w-5 text-rose-400" />
              Giải quyết sự cố · Báo cáo #SC{selectedIncident?.maSuCo}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs font-semibold mt-0.5">
              Cập nhật tiến trình và giải pháp khắc phục sự cố vận hành
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResolveIncident}>
            <div className="p-6 max-h-[65vh] overflow-y-auto space-y-5">
              {/* Trip + Driver info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-sm">
                  <h6 className="font-extrabold text-slate-500 uppercase text-[10px] tracking-wider mb-2">Thông tin chuyến xe</h6>
                  <p className="font-semibold text-slate-700"><strong>Chuyến:</strong> {selectedIncident?.diemDi} → {selectedIncident?.diemDen}</p>
                  <p className="font-semibold text-slate-700"><strong>Mã:</strong> {selectedIncident?.maChuyenXe}</p>
                  <p className="font-semibold text-slate-700"><strong>Biển số:</strong> {selectedIncident?.bienSoXe}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-sm">
                  <h6 className="font-extrabold text-slate-500 uppercase text-[10px] tracking-wider mb-2">Tài xế báo cáo</h6>
                  <p className="font-semibold text-slate-700"><strong>Họ tên:</strong> {selectedIncident?.tenTaiXe}</p>
                  <p className="font-semibold text-slate-700"><strong>SĐT:</strong> {selectedIncident?.soDienThoaiTaiXe}</p>
                  <p className="font-semibold text-slate-700"><strong>Thời gian:</strong> {selectedIncident ? new Date(selectedIncident.thoiGianTao).toLocaleString('vi-VN') : ''}</p>
                </div>
              </div>

              {/* Incident details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-3">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Loại sự cố &amp; Mức độ</p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge className="bg-slate-100 hover:bg-slate-100 text-slate-700 font-extrabold border-none px-3 py-1.5 rounded-lg text-xs">{selectedIncident?.loaiSuCo}</Badge>
                      <Badge className={`font-extrabold border-none px-3 py-1.5 rounded-lg text-xs ${
                        selectedIncident?.mucDo === 'Nghiêm trọng' ? 'bg-rose-50 text-rose-700 hover:bg-rose-50' :
                        selectedIncident?.mucDo === 'Trung bình' ? 'bg-amber-50 text-amber-700 hover:bg-amber-50' :
                        'bg-sky-50 text-sky-700 hover:bg-sky-50'
                      }`}>{selectedIncident?.mucDo}</Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Vị trí</p>
                    <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-sm font-semibold text-slate-700">
                      📍 {selectedIncident?.viTri}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Mô tả chi tiết</p>
                    <div className="p-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 font-medium whitespace-pre-wrap min-h-[70px]">
                      {selectedIncident?.moTa || 'Không có mô tả chi tiết'}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Ảnh minh chứng</p>
                  {selectedIncident?.anhMinhChung ? (
                    <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 text-center">
                      <img
                        src={selectedIncident.anhMinhChung}
                        alt="Proof"
                        className="rounded-lg shadow-sm max-h-[140px] cursor-zoom-in mx-auto object-contain hover:scale-[1.02] transition-transform"
                        onClick={() => setZoomImage(selectedIncident.anhMinhChung)}
                      />
                      <p className="text-[10px] font-bold text-slate-400 mt-1.5">Nhấp để phóng to</p>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-xs font-bold text-slate-400 bg-slate-50/50 h-full flex items-center justify-center">
                      Không có ảnh
                    </div>
                  )}
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Resolution form */}
              <div className="space-y-4">
                <h5 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-[#004b87]" /> Thông tin xử lý
                </h5>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Trạng thái sự cố</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-[#004b87] focus:outline-none focus:ring-2 focus:ring-[#004b87]/10 transition-all"
                    value={resolveStatus} onChange={e => setResolveStatus(e.target.value)} required
                  >
                    <option value="cho_xu_ly">Chờ xử lý</option>
                    <option value="dang_xu_ly">Đang xử lý</option>
                    <option value="da_xu_ly">Đã xử lý (Hoàn thành)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Ghi chú giải quyết</label>
                  <textarea
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 focus:border-[#004b87] focus:outline-none focus:ring-2 focus:ring-[#004b87]/10 transition-all resize-none"
                    rows="3"
                    placeholder="Ghi nhận phương án xử lý..."
                    value={resolveNotes} onChange={e => setResolveNotes(e.target.value)} required
                  />
                </div>
                {resolveStatus === 'da_xu_ly' && (
                  <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-xl space-y-2">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-amber-700">Cập nhật trạng thái chuyến xe</label>
                    <select
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-[#004b87] focus:outline-none focus:ring-2 focus:ring-[#004b87]/10 transition-all"
                      value={updateTripStatus} onChange={e => setUpdateTripStatus(e.target.value)}
                    >
                      <option value="">(Mặc định: Cho xe chạy tiếp)</option>
                      <option value="DEPARTED">✅ Cho xe chạy tiếp</option>
                      <option value="COMPLETED">🏁 Xác nhận hoàn thành chuyến</option>
                      <option value="CANCELLED">❌ Hủy chuyến xe</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowResolveModal(false)} className="rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-100 h-10 px-5 shadow-none">
                Hủy bỏ
              </Button>
              <Button type="submit" disabled={submitting} className="bg-[#004b87] hover:bg-[#003b6b] text-white font-extrabold h-10 px-5 rounded-xl border-none">
                {submitting ? 'Đang lưu...' : 'Xác nhận xử lý'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ══════════ ZOOM IMAGE LIGHTBOX ══════════ */}
      <Dialog open={!!zoomImage} onOpenChange={() => setZoomImage(null)}>
        <DialogContent className="max-w-4xl rounded-2xl bg-black/95 border border-white/10 p-0 overflow-hidden flex items-center justify-center relative min-h-[300px]">
          <Button
            type="button" variant="ghost"
            onClick={() => setZoomImage(null)}
            className="absolute top-4 right-4 text-white hover:text-slate-200 hover:bg-white/10 p-2 rounded-full h-10 w-10 border-none"
          >
            <X className="h-6 w-6" />
          </Button>
          {zoomImage && (
            <img src={zoomImage} alt="Zoomed" className="max-h-[85vh] max-w-[90vw] object-contain shadow-2xl" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ReportsPage;
