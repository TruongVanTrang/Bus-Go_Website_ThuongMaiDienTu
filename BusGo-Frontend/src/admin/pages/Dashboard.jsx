import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthUtil, StorageUtil } from '@/utils/helpers'
import { ROLE_MENU, USER_ROLES } from '@/utils/constants'
import AdminSidebar from '../components/AdminSidebar'
import AdminTopbar from '../components/AdminTopbar'
import TicketStaffPage from './TicketStaffPage'
import axios from 'axios'
import '../pages/AdminDashboard.css'

// Import custom UI components
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// Import Lucide icons
import {
  Calendar, Clock, Bus, Users, TrendingUp, ChevronRight, Play, ArrowRight,
  Info, AlertTriangle, Phone, Wrench, ShieldAlert, BarChart3, MapPin, QrCode,
  Search, Undo, Grid, Star, DollarSign, Activity
} from 'lucide-react'

/**
 * AdminDashboard - Giao diện chính theo style hình minh họa BusGo
 */
function AdminDashboard() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userRole, setUserRole] = useState(null)
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)
  const [incidents, setIncidents] = useState([])
  const [revenueData, setRevenueData] = useState(null)
  const [routeData, setRouteData] = useState(null)
  const [ratingsData, setRatingsData] = useState(null)

  const fetchIncidents = async () => {
    try {
      const token = StorageUtil.getToken()
      const res = await axios.get('http://localhost:5000/api/admin/incidents', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setIncidents(res.data || [])
    } catch (e) {
      console.error('Error fetching incidents on dashboard:', e)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const token = StorageUtil.getToken()
      const authHeaders = { headers: { Authorization: `Bearer ${token}` } }
      
      const [revRes, routeRes, ratingRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/analytics/revenue', authHeaders).catch(() => null),
        axios.get('http://localhost:5000/api/admin/analytics/routes', authHeaders).catch(() => null),
        axios.get('http://localhost:5000/api/admin/analytics/ratings', authHeaders).catch(() => null)
      ])

      if (revRes) setRevenueData(revRes.data)
      if (routeRes) setRouteData(routeRes.data)
      if (ratingRes) setRatingsData(ratingRes.data)
    } catch (e) {
      console.error('Error fetching analytics on dashboard:', e)
    }
  }

  useEffect(() => {
    const role = AuthUtil.getCurrentRole()
    const user = AuthUtil.getCurrentUser()
    if (!role) { navigate('/login'); return }
    setUserRole(role)
    setUserName(user?.name || 'User')

    const loadData = async () => {
      setLoading(true)
      if (role === 'ADMIN') {
        await Promise.all([fetchIncidents(), fetchAnalytics()])
      }
      setLoading(false)
    }
    loadData()
  }, [navigate])

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner" />
        <p style={{ color: '#9ca3af', fontSize: '13px' }}>Đang tải...</p>
      </div>
    )
  }

  if (userRole === USER_ROLES.TICKET_STAFF) {
    return <TicketStaffPage />
  }

  const menuItems = ROLE_MENU[userRole] || []

  return (
    <div className="admin-dashboard">
      <AdminSidebar
        isOpen={sidebarOpen}
        userRole={userRole}
        userName={userName}
        menuItems={menuItems}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="admin-main">
        <AdminTopbar
          userName={userName}
          userRole={userRole}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="admin-content">
          <DashboardContent 
            userRole={userRole} 
            menuItems={menuItems} 
            userName={userName} 
            navigate={navigate} 
            incidents={incidents}
            revenueData={revenueData}
            routeData={routeData}
            ratingsData={ratingsData}
          />
        </main>
      </div>
    </div>
  )
}

/**
 * DashboardContent
 */
function DashboardContent({ 
  userRole, 
  menuItems, 
  userName, 
  navigate, 
  incidents,
  revenueData,
  routeData,
  ratingsData
}) {
  const stats = getRoleStats(userRole, revenueData, ratingsData)
  const steps = getOperationSteps(userRole)
  const tripData = getDemoTrip(userRole)
  const weeklyRevenue = getWeeklyRevenuePoints(revenueData)
  const routeChartData = getRouteChartData(routeData)

  // Filter pending incidents if admin
  const activeIncidents = incidents ? incidents.filter(i => i.trangThaiSuCo !== 'da_xu_ly') : []

  return (
    <div className="dashboard-content space-y-6">

      {/* ── Stats and Sparklines Row ──────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </div>

      {/* ── Active Incidents Alert (For Admin Role only) ── */}
      {userRole === USER_ROLES.ADMIN && activeIncidents.length > 0 && (
        <Card className="border-red-200 bg-rose-50/50 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-600 animate-bounce" />
              <h3 className="text-sm font-black text-rose-800">CẢNH BÁO SỰ CỐ KHẨN CẤP ({activeIncidents.length})</h3>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/admin/reports?tab=incidents')}
              className="border-rose-200 hover:bg-rose-100 text-rose-700 font-extrabold text-xs h-8 rounded-lg"
            >
              Xem nhật ký sự cố <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeIncidents.slice(0, 2).map((inc) => (
              <div key={inc.maSuCo} className="p-3 bg-white border border-rose-100 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 shadow-sm">
                <div>
                  <span className="text-[10px] font-black text-rose-500 uppercase">Sự cố #{inc.maSuCo} • {inc.loaiSuCo} ({inc.mucDo})</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{inc.moTa}</p>
                  <p className="text-xs font-semibold text-slate-450 mt-1">📍 Vị trí: {inc.viTri} | Tài xế: {inc.tenTaiXe} ({inc.soDienThoaiTaiXe})</p>
                </div>
                <Badge variant="destructive" className="font-extrabold text-[10px] rounded-lg">
                  {inc.trangThaiSuCo === 'dang_xu_ly' ? 'Đang xử lý' : 'Chờ xử lý'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Asymmetric Analysis Grid (For Admin Role only) ────────────────── */}
      {userRole === USER_ROLES.ADMIN && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Left Column (3/5 cols) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Unified Sales & Distribution Channel Tabs */}
            <UnifiedSalesChannelCard weeklyRevenue={weeklyRevenue} />

            {/* Ratings Feedback & Live Feed */}
            <RatingsFeedbackCard ratingsData={ratingsData} />

          </div>

          {/* Right Column (2/5 cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Route Popularity */}
            <RouteBarChart data={routeChartData} />

            {/* Service Performance */}
            <ServicePerformanceCard />

            {/* Payment Methods */}
            <PaymentDonutChart data={revenueData?.byPaymentMethod} />

          </div>

        </div>
      )}

      {/* ── Bottom Section for Non-Admin Roles ───────────────────────── */}
      {userRole !== USER_ROLES.ADMIN && (
        /* Non-admin roles fallback layout (original grid) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <Grid className="h-5 w-5 text-[#004b87]" />
                  Chức năng của bạn
                </h2>
              </div>
              {menuItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {menuItems.map(item => (
                    <MenuCard key={item.id} {...item} navigate={navigate} />
                  ))}
                </div>
              ) : (
                <Card className="border-slate-100 p-8 text-center text-slate-400 font-semibold text-sm">
                  Không có chức năng cho vai trò này
                </Card>
              )}
            </div>
          </div>
          <div className="space-y-6">
            <Card className="border-slate-100/80 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/20">
                <CardTitle className="text-sm font-black text-slate-855">Quy trình vận hành</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <ul className="space-y-3 text-xs text-slate-650 font-semibold leading-relaxed">
                  {steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-50 text-[#004b87] flex items-center justify-center flex-shrink-0 text-[10px] font-black">{i + 1}</span>
                      <span className="mt-0.5">{step}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

    </div>
  )
}

/**
 * StatCard - Card thống kê
 */
function StatCard({ label, value, icon, sub, trend, isPositive, sparklinePath, sparklineColor, colorClass }) {
  const gradId = `grad-${label ? label.replace(/[^a-zA-Z0-9]/g, '') : 'default'}`
  const fillPath = sparklinePath ? `${sparklinePath} L 100 40 L 0 40 Z` : ''
  const isCancel = label && (label.includes('hủy') || label.toLowerCase().includes('churn'))
  const endY = isCancel ? 35 : 5

  return (
    <Card className="hover:shadow-md border-slate-100/80 transition-all duration-300 rounded-2xl shadow-sm bg-white overflow-hidden flex flex-col justify-between h-full group hover:border-[#004b87]/25">
      <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-1.5">
          <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider leading-relaxed whitespace-normal break-words flex-1 min-w-0 pr-1">
            {label}
          </span>
          {!sparklinePath && (
            <div className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center text-xs shadow-inner flex-shrink-0 transition-transform duration-300 group-hover:scale-105 ${colorClass || 'bg-blue-50 text-[#004b87]'}`}>
              {icon}
            </div>
          )}
        </div>

        {/* Value and Trend row */}
        <div className="flex items-baseline justify-between gap-1 flex-wrap">
          <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none">{value}</h3>
          {trend && (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black ${
              isPositive 
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                : 'bg-rose-50 text-rose-600 border border-rose-100'
            }`}>
              {trend}
            </span>
          )}
        </div>

        {/* SVG Sparkline if available */}
        {sparklinePath ? (
          <div className="w-full h-8 pt-1.5 relative overflow-visible">
            <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparklineColor || '#64748b'} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={sparklineColor || '#64748b'} stopOpacity="0.00" />
                </linearGradient>
              </defs>
              {/* Area path */}
              <path d={fillPath} fill={`url(#${gradId})`} />
              {/* Stroke path */}
              <path 
                d={sparklinePath} 
                fill="none" 
                stroke={sparklineColor || '#64748b'} 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              {/* Glowing Indicator Dot at the end of the line */}
              <circle 
                cx="100" 
                cy={endY} 
                r="3.5" 
                fill={sparklineColor || '#64748b'} 
                className="animate-pulse"
              />
            </svg>
          </div>
        ) : (
          /* Subtext */
          sub && (
            <p className="text-[10px] font-semibold text-slate-400 truncate">
              {sub}
            </p>
          )
        )}
      </CardContent>
    </Card>
  )
}

/**
 * TripCard - Hiển thị chuyến sắp khởi hành
 */
function TripCard({ trip }) {
  return (
    <Card className="border-[#004b87]/30 border-2 shadow-md relative overflow-hidden bg-white/70">
      <div className="absolute top-0 right-0 bg-[#004b87] text-white text-[10px] font-black uppercase tracking-wider py-1 px-4 rounded-bl-xl">
        KHUYẾN CHẠY
      </div>
      <CardContent className="p-6 space-y-6">
        
        {/* Route details */}
        <div className="flex items-center gap-4 justify-between">
          <div className="space-y-1 flex-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hành trình</span>
            <div className="flex items-center gap-2.5">
              <span className="text-lg font-black text-slate-800">{trip.from}</span>
              <ArrowRight className="h-4 w-4 text-[#004b87] flex-shrink-0" />
              <span className="text-lg font-black text-slate-800">{trip.to}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái</span>
            <div>
              <Badge variant="success" className="mt-1 font-extrabold border-none">
                Đã lên lịch
              </Badge>
            </div>
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        {/* Info grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock className="h-3 w-3 text-slate-400" /> Giờ đi</span>
            <p className="text-sm font-extrabold text-slate-700">{trip.departTime}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock className="h-3 w-3 text-slate-400" /> Giờ đến</span>
            <p className="text-sm font-extrabold text-slate-700">{trip.arriveTime}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Bus className="h-3 w-3 text-slate-400" /> Xe & Biển số</span>
            <p className="text-sm font-extrabold text-slate-700">{trip.plate}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Users className="h-3 w-3 text-slate-400" /> Số khách</span>
            <p className="text-sm font-extrabold text-slate-700">{trip.passengers}/{trip.capacity} người</p>
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
            <Info className="h-4 w-4 text-sky-600 flex-shrink-0" />
            Vui lòng làm thủ tục check-in cho khách trước giờ khởi hành 15 phút.
          </div>
          <div className="flex gap-2.5 w-full sm:w-auto">
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none border-[#004b87]/30 text-[#004b87] hover:bg-[#004b87]/5 h-9 text-xs rounded-xl font-bold">
              Xem chi tiết
            </Button>
            <Button variant="default" size="sm" className="flex-1 sm:flex-none bg-[#004b87] hover:bg-[#003c6c] h-9 text-xs rounded-xl border-none">
              <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
              Bắt đầu chuyến
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * MenuCard
 */
function MenuCard({ label, icon, path, navigate }) {
  return (
    <Card 
      onClick={() => navigate(path)}
      className="bg-slate-50/50 border border-slate-150 hover:border-[#004b87]/30 rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all group flex flex-col items-center text-center justify-center gap-3"
      id={`menu-${path.replace(/\//g, '-').replace(/^-/, '')}`}
    >
      <div className="w-12 h-12 bg-gradient-to-br from-[#004b87] to-sky-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-[#004b87]/15 group-hover:scale-105 transition-transform duration-300">
        {getMenuIcon(icon)}
      </div>
      <div>
        <h4 className="font-extrabold text-slate-800 text-sm leading-tight">{label}</h4>
      </div>
      <span className="text-xs font-black text-[#004b87] inline-flex items-center gap-1 group-hover:underline">
        Truy cập <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
      </span>
    </Card>
  )
}

/**
 * Interactive SVG Line Chart
 */
function InteractiveLineChart({ data, noWrapper }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  
  const width = 500
  const height = 220
  const paddingLeft = 55
  const paddingRight = 20
  const paddingTop = 30
  const paddingBottom = 40

  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom

  const maxVal = Math.max(...data.map(d => d.amount)) * 1.15 || 10000000
  const minVal = 0

  const getCoordinates = () => {
    return data.map((d, i) => {
      const x = paddingLeft + (i * (chartWidth / (data.length - 1)))
      const y = paddingTop + chartHeight - ((d.amount - minVal) / (maxVal - minVal)) * chartHeight
      return { x, y, ...d }
    })
  }

  const coords = getCoordinates()

  // Generate smooth cubic Bezier path instead of linear segments
  const getBezierPath = (points) => {
    if (points.length === 0) return ''
    let d = `M ${points[0].x} ${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i]
      const p1 = points[i + 1]
      // Control points for horizontal smooth interpolation
      const cpX1 = p0.x + (p1.x - p0.x) / 2
      const cpY1 = p0.y
      const cpX2 = p0.x + (p1.x - p0.x) / 2
      const cpY2 = p1.y
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`
    }
    return d
  }

  const pathD = getBezierPath(coords)
  const areaD = coords.length > 0 
    ? `${pathD} L ${coords[coords.length - 1].x} ${paddingTop + chartHeight} L ${coords[0].x} ${paddingTop + chartHeight} Z`
    : ''

  const ticks = [0, 0.25, 0.5, 0.75, 1]

  const fmtCurrencyAbbr = (val) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`
    return val
  }

  const content = (
    <>
      {!noWrapper && (
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm">Doanh thu bán vé & hàng hóa</h4>
            <p className="text-[11px] font-semibold text-slate-450 mt-0.5">Biểu đồ doanh thu tuần qua</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#004b87] inline-block" /> Realtime
            </span>
          </div>
        </div>
      )}
      <div className="w-full overflow-x-auto select-none">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[450px] overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#004b87" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#004b87" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {ticks.map((t, idx) => {
            const y = paddingTop + chartHeight - t * chartHeight
            const val = minVal + t * (maxVal - minVal)
            return (
              <g key={idx} className="opacity-40">
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={width - paddingRight} 
                  y2={y} 
                  stroke="#e2e8f0" 
                  strokeDasharray="4 4" 
                  strokeWidth="1"
                />
                <text 
                  x={paddingLeft - 8} 
                  y={y + 4} 
                  textAnchor="end" 
                  className="text-[10px] font-bold fill-slate-400"
                >
                  {fmtCurrencyAbbr(val)}
                </text>
              </g>
            )
          })}

          {/* Area under the line */}
          {areaD && (
            <path d={areaD} fill="url(#chartGradient)" />
          )}

          {/* The line itself */}
          {pathD && (
            <path 
              d={pathD} 
              fill="none" 
              stroke="#004b87" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          )}

          {/* Dot Markers and interactive triggers */}
          {coords.map((c, idx) => {
            const isHovered = hoveredIdx === idx
            return (
              <g key={idx}>
                {isHovered && (
                  <line 
                    x1={c.x} 
                    y1={paddingTop} 
                    x2={c.x} 
                    y2={paddingTop + chartHeight} 
                    stroke="#004b87" 
                    strokeWidth="1.5" 
                    strokeDasharray="3 3"
                    className="opacity-40"
                  />
                )}
                
                <circle 
                  cx={c.x} 
                  cy={c.y} 
                  r={isHovered ? 6 : 4} 
                  fill={isHovered ? '#004b87' : '#ffffff'} 
                  stroke="#004b87" 
                  strokeWidth={isHovered ? 3 : 2} 
                  className="transition-all duration-150 cursor-pointer"
                />

                <text 
                  x={c.x} 
                  y={height - 15} 
                  textAnchor="middle" 
                  className={`text-[10px] font-bold transition-colors ${
                    isHovered ? 'fill-slate-800 font-extrabold' : 'fill-slate-400'
                  }`}
                >
                  {c.label}
                </text>

                <rect 
                  x={c.x - (chartWidth / (data.length - 1)) / 2} 
                  y={paddingTop} 
                  width={chartWidth / (data.length - 1)} 
                  height={chartHeight + 20} 
                  fill="transparent" 
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              </g>
            )
          })}
        </svg>
      </div>

      {hoveredIdx !== null && coords[hoveredIdx] && (
        <div 
          className="absolute bg-slate-900 text-white rounded-xl p-2.5 px-3.5 shadow-xl text-xs font-semibold z-10 pointer-events-none transition-all duration-150 border border-slate-800/80"
          style={{
            left: `${coords[hoveredIdx].x - 60}px`,
            top: `${coords[hoveredIdx].y - 65}px`
          }}
        >
          <p className="text-[10px] font-extrabold text-sky-300 uppercase tracking-wide">{coords[hoveredIdx].label}</p>
          <p className="text-sm font-black mt-0.5">{Number(coords[hoveredIdx].rawValue).toLocaleString('vi-VN')}đ</p>
        </div>
      )}
    </>
  )

  if (noWrapper) {
    return <div className="relative">{content}</div>
  }

  return (
    <div className="relative bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
      {content}
    </div>
  )
}

/**
 * RouteBarChart - Modern horizontal bar chart for route booking volumes
 */
function RouteBarChart({ data }) {
  const maxVal = Math.max(...data.map(d => d.value)) || 100

  return (
    <div className="bg-white/50 backdrop-blur border border-slate-100 rounded-2xl p-5 shadow-sm">
      <div className="mb-4">
        <h4 className="font-extrabold text-slate-800 text-sm">Lượt đặt vé theo tuyến</h4>
        <p className="text-[11px] font-semibold text-slate-450 mt-0.5">Top 5 tuyến xe phổ biến nhất</p>
      </div>

      <div className="space-y-3.5">
        {data.map((r, i) => {
          const widthPercent = (r.value / maxVal) * 100
          return (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span className="truncate max-w-[200px]">{r.name}</span>
                <span className="text-[#004b87]">{r.value} khách <span className="text-slate-400 font-medium">({r.ratio}%)</span></span>
              </div>
              <div className="w-full h-3 bg-slate-150/40 rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-r from-[#004b87] to-sky-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * PaymentDonutChart - Interactive SVG donut chart for payment method revenue share
 */
function PaymentDonutChart({ data }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  
  // Standardize payment methods
  const rawMethods = data && data.length > 0 ? data : [
    { tenPhuongThuc: 'momo', tongTien: 8200000 },
    { tenPhuongThuc: 'vnpay', tongTien: 6400000 },
    { tenPhuongThuc: 'tien_mat', tongTien: 3850000 }
  ]

  const total = rawMethods.reduce((sum, m) => sum + (m.tongTien || 0), 0)

  const methods = rawMethods.map(m => {
    let displayName = 'Khác'
    let color = '#64748b' // slate-500
    let hoverColor = '#475569'
    
    const name = m.tenPhuongThuc?.toLowerCase() || ''
    if (name.includes('momo')) {
      displayName = 'Ví MoMo'
      color = '#a21caf' // fuchsia-700
      hoverColor = '#86198f'
    } else if (name.includes('vnpay') || name.includes('vn_pay')) {
      displayName = 'Cổng VNPAY'
      color = '#0284c7' // sky-650
      hoverColor = '#0369a1'
    } else if (name.includes('tien_mat') || name.includes('cash') || name.includes('tiền mặt') || name.includes('offline')) {
      displayName = 'Tiền mặt'
      color = '#059669' // emerald-600
      hoverColor = '#047857'
    }
    
    return {
      name: displayName,
      value: m.tongTien || 0,
      percentage: total > 0 ? ((m.tongTien || 0) / total) * 100 : 0,
      color,
      hoverColor
    }
  })

  // SVG parameters
  const size = 160
  const radius = 50
  const strokeWidth = 16
  const circ = 2 * Math.PI * radius // ~314.159
  const center = size / 2

  let currentOffset = 0

  return (
    <div className="bg-white/50 backdrop-blur border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
      <div>
        <h4 className="font-extrabold text-slate-800 text-sm">Cơ cấu thanh toán</h4>
        <p className="text-[11px] font-semibold text-slate-450 mt-0.5">Phân tích theo doanh thu</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-4">
        {/* SVG Donut */}
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 select-none">
            {/* Background track */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
            />

            {methods.map((m, idx) => {
              const dashArray = `${(m.percentage / 100) * circ} ${circ}`
              const dashOffset = circ - currentOffset
              currentOffset += (m.percentage / 100) * circ

              const isHovered = hoveredIdx === idx

              return (
                <circle
                  key={idx}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={isHovered ? m.hoverColor : m.color}
                  strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  className="transition-all duration-205 cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              )
            })}
          </svg>

          {/* Center Info text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-center max-w-[80px] truncate">
              {hoveredIdx !== null ? methods[hoveredIdx].name : 'Tổng chi'}
            </span>
            <span className="text-sm font-black text-slate-800 mt-0.5">
              {hoveredIdx !== null 
                ? `${methods[hoveredIdx].percentage.toFixed(1)}%` 
                : `${(total / 1000000).toFixed(1)}Mđ`
              }
            </span>
            {hoveredIdx !== null && (
              <span className="text-[10px] font-bold text-slate-500">
                {Number(methods[hoveredIdx].value).toLocaleString('vi-VN')}đ
              </span>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2 w-full">
          {methods.map((m, idx) => (
            <div 
              key={idx} 
              className={`flex items-center justify-between p-1.5 px-2.5 rounded-xl border transition-all cursor-pointer ${
                hoveredIdx === idx 
                  ? 'bg-slate-50 border-slate-200 shadow-sm scale-[1.02]' 
                  : 'border-transparent hover:bg-slate-50/50'
              }`}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                <span className="text-xs font-bold text-slate-750">{m.name}</span>
              </div>
              <span className="text-xs font-black text-slate-800">
                {m.percentage.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * RatingsBreakdownChart - Customer rating feedback details
 */
function RatingsBreakdownChart({ data }) {
  const summary = data?.summary || {
    tongSoDanhGia: 156,
    diemTrungBinh: 4.8,
    diemPhucVuTrungBinh: 4.75,
    diemGiaoThiepTrungBinh: 4.85,
    so5Sao: 110,
    so4Sao: 32,
    so3Sao: 10,
    so2Sao: 3,
    so1Sao: 1
  }

  const total = summary.tongSoDanhGia || 1

  const starsBreakdown = [
    { stars: 5, count: summary.so5Sao || 0, color: 'bg-amber-400' },
    { stars: 4, count: summary.so4Sao || 0, color: 'bg-amber-400' },
    { stars: 3, count: summary.so3Sao || 0, color: 'bg-amber-400' },
    { stars: 2, count: summary.so2Sao || 0, color: 'bg-amber-400' },
    { stars: 1, count: summary.so1Sao || 0, color: 'bg-rose-400' }
  ]

  return (
    <div className="bg-white/50 backdrop-blur border border-slate-100 rounded-2xl p-5 shadow-sm h-full flex flex-col justify-between">
      <div>
        <h4 className="font-extrabold text-slate-800 text-sm">Đánh giá chất lượng dịch vụ</h4>
        <p className="text-[11px] font-semibold text-slate-450 mt-0.5">Phân bổ nhận xét khách hàng</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 my-3">
        {/* Rating Score column */}
        <div className="md:col-span-2 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-4 text-center">
          <h2 className="text-4xl font-black text-slate-800 leading-none">{summary.diemTrungBinh || '4.8'}</h2>
          <div className="flex gap-0.5 my-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star 
                key={s} 
                className={`h-4.5 w-4.5 ${
                  s <= Math.round(summary.diemTrungBinh || 5) 
                    ? 'text-amber-500 fill-amber-400' 
                    : 'text-slate-200 fill-slate-100'
                }`} 
              />
            ))}
          </div>
          <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wide">
            {total} lượt đánh giá
          </p>

          {/* Sub-ratings detail */}
          <div className="w-full mt-4 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-500">Phục vụ xe:</span>
              <span className="font-extrabold text-slate-700">{summary.diemPhucVuTrungBinh || '4.7'}/5.0</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-500">Giao tiếp tài xế:</span>
              <span className="font-extrabold text-slate-700">{summary.diemGiaoThiepTrungBinh || '4.8'}/5.0</span>
            </div>
          </div>
        </div>

        {/* Stars Bars column */}
        <div className="md:col-span-3 space-y-2 flex flex-col justify-center">
          {starsBreakdown.map((s, idx) => {
            const percentage = (s.count / total) * 100
            return (
              <div key={idx} className="flex items-center gap-2.5 text-xs">
                <span className="w-3.5 font-bold text-slate-650 text-right">{s.stars}</span>
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400 flex-shrink-0" />
                <div className="flex-1 h-2 bg-slate-150/40 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${s.color} rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-9 text-right font-extrabold text-slate-500 text-[10px]">
                  {percentage.toFixed(0)}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/**
 * UnifiedSalesChannelCard - A custom tabbed interface for Revenue and Booking channels
 */
function UnifiedSalesChannelCard({ weeklyRevenue }) {
  const [activeTab, setActiveTab] = useState('revenue') // 'revenue' | 'funnel'

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Card Header with tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-3">
        <div className="space-y-1">
          <h4 className="font-extrabold text-slate-800 text-sm">Phân tích kinh doanh & phân phối</h4>
          <p className="text-[11px] font-semibold text-slate-450">Báo cáo doanh số tuần và phân bổ kênh đặt vé</p>
        </div>
        <div className="flex bg-slate-100 p-0.5 rounded-lg flex-shrink-0">
          <button 
            onClick={() => setActiveTab('revenue')} 
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
              activeTab === 'revenue' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Doanh thu tuần
          </button>
          <button 
            onClick={() => setActiveTab('funnel')} 
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
              activeTab === 'funnel' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Kênh đặt vé
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'revenue' ? (
          <InteractiveLineChart data={weeklyRevenue} noWrapper={true} />
        ) : (
          <BookingFunnelChart noWrapper={true} />
        )}
      </div>
    </div>
  )
}

/**
 * RatingsFeedbackCard - Integrates customer ratings with a live feed of recent review text
 */
function RatingsFeedbackCard({ ratingsData }) {
  const summary = ratingsData?.summary || {
    tongSoDanhGia: 156,
    diemTrungBinh: 4.8,
    diemPhucVuTrungBinh: 4.75,
    diemGiaoThiepTrungBinh: 4.85,
    so5Sao: 110,
    so4Sao: 32,
    so3Sao: 10,
    so2Sao: 3,
    so1Sao: 1
  }

  const recentReviews = ratingsData?.recentReviews || [
    { tenKhachHang: 'Lê Hoàng M.', diemDanhGia: 5, diemDi: 'Đà Nẵng', diemDen: 'Huế', nhanXet: 'Xe chạy đúng giờ, ghế nằm êm ái, bác tài vui tính.' },
    { tenKhachHang: 'Phạm Thị N.', diemDanhGia: 4, diemDi: 'Đà Nẵng', diemDen: 'Hội An', nhanXet: 'Dịch vụ soát vé nhanh chóng, xe sạch sẽ.' }
  ]

  const total = summary.tongSoDanhGia || 1

  const starsBreakdown = [
    { stars: 5, count: summary.so5Sao || 0, color: 'bg-amber-400' },
    { stars: 4, count: summary.so4Sao || 0, color: 'bg-amber-400' },
    { stars: 3, count: summary.so3Sao || 0, color: 'bg-amber-400' },
    { stars: 2, count: summary.so2Sao || 0, color: 'bg-amber-400' },
    { stars: 1, count: summary.so1Sao || 0, color: 'bg-rose-400' }
  ]

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
      <div>
        <h4 className="font-extrabold text-slate-800 text-sm">Đánh giá chất lượng & phản hồi hành khách</h4>
        <p className="text-[11px] font-semibold text-slate-450 mt-0.5">Phân bổ chất lượng và các bình luận thực tế mới nhất</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 border-b border-slate-100 pb-4">
        {/* Rating Score column */}
        <div className="md:col-span-2 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-4 text-center">
          <h2 className="text-4xl font-black text-slate-800 leading-none">{summary.diemTrungBinh || '4.8'}</h2>
          <div className="flex gap-0.5 my-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star 
                key={s} 
                className={`h-4.5 w-4.5 ${
                  s <= Math.round(summary.diemTrungBinh || 5) 
                    ? 'text-amber-500 fill-amber-400' 
                    : 'text-slate-200 fill-slate-100'
                }`} 
              />
            ))}
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">
            {total} lượt đánh giá
          </p>

          {/* Sub-ratings detail */}
          <div className="w-full mt-4 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-500">Phục vụ xe:</span>
              <span className="font-extrabold text-slate-700">{summary.diemPhucVuTrungBinh || '4.7'}/5.0</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-500">Giao tiếp tài xế:</span>
              <span className="font-extrabold text-slate-700">{summary.diemGiaoThiepTrungBinh || '4.8'}/5.0</span>
            </div>
          </div>
        </div>

        {/* Stars Bars column */}
        <div className="md:col-span-3 space-y-2 flex flex-col justify-center">
          {starsBreakdown.map((s, idx) => {
            const percentage = (s.count / total) * 100
            return (
              <div key={idx} className="flex items-center gap-2.5 text-xs">
                <span className="w-3.5 font-bold text-slate-650 text-right">{s.stars}</span>
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400 flex-shrink-0" />
                <div className="flex-1 h-2 bg-slate-150/40 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${s.color} rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-9 text-right font-extrabold text-slate-500 text-[10px]">
                  {percentage.toFixed(0)}%
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Live Comment Feed */}
      <div className="space-y-3 pt-1">
        <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-wider font-extrabold">Phản hồi gần đây từ hành khách</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentReviews.slice(0, 2).map((rev, i) => (
            <div key={i} className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl space-y-1.5 hover:bg-slate-50 transition-colors">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-slate-750">{rev.tenKhachHang}</span>
                <div className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 text-amber-500 fill-amber-400" />
                  <span className="text-[10px] font-extrabold text-slate-650">{rev.diemDanhGia}</span>
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400">Tuyến: {rev.diemDi} → {rev.diemDen}</p>
              <p className="text-xs text-slate-600 font-semibold italic line-clamp-2">"{rev.nhanXet || 'Không có nhận xét chi tiết'}"</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

/**
 * BookingFunnelChart - Interactive stacked vertical bar chart for distribution channels
 */
function BookingFunnelChart({ noWrapper }) {
  const [hoveredDay, setHoveredDay] = useState(null)

  const data = [
    { label: 'Thứ 2', app: 120, web: 80, counter: 40 },
    { label: 'Thứ 3', app: 140, web: 95, counter: 45 },
    { label: 'Thứ 4', app: 130, web: 90, counter: 50 },
    { label: 'Thứ 5', app: 160, web: 110, counter: 55 },
    { label: 'Thứ 6', app: 210, web: 150, counter: 80 },
    { label: 'Thứ 7', app: 250, web: 180, counter: 120 },
    { label: 'Chủ Nhật', app: 280, web: 210, counter: 140 }
  ]

  const maxTotal = 650 // max height bounds
  const chartHeight = 160

  const content = (
    <>
      {!noWrapper && (
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm">Phân tích kênh đặt vé</h4>
            <p className="text-[11px] font-semibold text-slate-450 mt-0.5">Lượng đặt vé theo kênh phân phối</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500" /> App</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Web</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-400" /> Quầy vé</span>
          </div>
        </div>
      )}

      <div className="relative w-full h-[180px] mt-2 flex items-end justify-between px-2">
        {data.map((d, idx) => {
          const total = d.app + d.web + d.counter
          const hApp = (d.app / maxTotal) * chartHeight
          const hWeb = (d.web / maxTotal) * chartHeight
          const hCounter = (d.counter / maxTotal) * chartHeight

          const isHovered = hoveredDay === idx

          return (
            <div 
              key={idx} 
              className="flex flex-col items-center flex-1 group relative cursor-pointer"
              onMouseEnter={() => setHoveredDay(idx)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute bottom-[100%] mb-2 bg-slate-900 text-white rounded-xl p-2 px-3 text-[10px] font-semibold z-10 w-28 shadow-xl pointer-events-none">
                  <p className="font-black text-sky-300 border-b border-slate-700 pb-0.5 mb-1">{d.label}</p>
                  <p>📱 App: {d.app}</p>
                  <p>💻 Web: {d.web}</p>
                  <p>🎟️ Quầy: {d.counter}</p>
                  <p className="font-black mt-0.5 text-white">Tổng: {total}</p>
                </div>
              )}

              {/* Stacked columns */}
              <div className="w-6 sm:w-8 flex flex-col justify-end rounded-t-lg overflow-hidden transition-transform duration-200 group-hover:scale-y-105 animate-fade-in" style={{ height: chartHeight }}>
                <div style={{ height: hApp }} className="bg-sky-500 w-full" />
                <div style={{ height: hWeb }} className="bg-indigo-500 w-full" />
                <div style={{ height: hCounter }} className="bg-violet-400 w-full" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 mt-2">{d.label}</span>
            </div>
          )
        })}
      </div>
    </>
  )

  if (noWrapper) {
    return <div className="flex flex-col justify-between h-full">{content}</div>
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm h-full flex flex-col justify-between">
      {content}
    </div>
  )
}

/**
 * ServicePerformanceCard - Service type product metrics and tabbed daily stats
 */
function ServicePerformanceCard() {
  const [activeTab, setActiveTab] = useState('intercity') // 'intercity' | 'city' | 'cargo'

  const tabData = {
    intercity: {
      type1Label: 'Vé Giường nằm',
      type1Val: '790 vé',
      type2Label: 'Vé Ghế ngồi',
      type2Val: '572 vé',
      avgLabel: 'Doanh thu trung bình ngày',
      avgVal: '34.8Mđ',
      trend: '-0.52%',
      isPositive: false,
      bars: [30, 45, 38, 55, 60, 48, 65]
    },
    city: {
      type1Label: 'Vé Buýt thường',
      type1Val: '1,250 vé',
      type2Label: 'Vé Buýt nhanh',
      type2Val: '840 vé',
      avgLabel: 'Doanh thu trung bình ngày',
      avgVal: '12.5Mđ',
      trend: '+1.8%',
      isPositive: true,
      bars: [50, 58, 62, 70, 75, 68, 80]
    },
    cargo: {
      type1Label: 'Ký gửi Xe máy',
      type1Val: '142 xe',
      type2Label: 'Ký gửi Hàng hóa',
      type2Val: '389 kiện',
      avgLabel: 'Doanh thu trung bình ngày',
      avgVal: '22.4Mđ',
      trend: '+2.5%',
      isPositive: true,
      bars: [25, 32, 28, 42, 48, 38, 52]
    }
  }

  const current = tabData[activeTab]

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-extrabold text-slate-800 text-sm">Hiệu suất dịch vụ</h4>
        <div className="flex bg-slate-100 p-0.5 rounded-lg">
          <button 
            onClick={() => setActiveTab('intercity')} 
            className={`px-2.5 py-1 text-[10px] font-black rounded-md transition-all ${
              activeTab === 'intercity' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Liên tỉnh
          </button>
          <button 
            onClick={() => setActiveTab('city')} 
            className={`px-2.5 py-1 text-[10px] font-black rounded-md transition-all ${
              activeTab === 'city' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Nội thành
          </button>
          <button 
            onClick={() => setActiveTab('cargo')} 
            className={`px-2.5 py-1 text-[10px] font-black rounded-md transition-all ${
              activeTab === 'cargo' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Ký gửi
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3.5 my-2">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400">{current.type1Label}</p>
          <p className="text-base font-black text-slate-800">{current.type1Val}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400">{current.type2Label}</p>
          <p className="text-base font-black text-slate-800">{current.type2Val}</p>
        </div>
      </div>

      <div className="my-2 flex justify-between items-baseline">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400">{current.avgLabel}</p>
          <p className="text-lg font-black text-[#004b87]">{current.avgVal}</p>
        </div>
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black ${
          current.isPositive 
            ? 'bg-emerald-50 text-emerald-600' 
            : 'bg-rose-50 text-rose-600'
        }`}>
          {current.trend}
        </span>
      </div>

      {/* Mini bar chart */}
      <div className="h-14 flex items-end justify-between gap-1.5 px-1 mt-4">
        {current.bars.map((b, i) => (
          <div 
            key={i} 
            className="flex-1 bg-slate-100 rounded-t-sm relative group cursor-pointer"
            style={{ height: '100%' }}
          >
            <div 
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#004b87] to-sky-500 rounded-t-sm transition-all duration-500 ease-out" 
              style={{ height: `${b}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Helper functions ──────────────────────────────────────────────

function getRoleStats(role, revenueData, ratingsData) {
  const map = {
    [USER_ROLES.ADMIN]: [
      { 
        label: 'Doanh thu tổng',       
        value: revenueData?.summary?.tongDoanhThu ? `${Number(revenueData.summary.tongDoanhThu).toLocaleString('vi-VN')}đ` : '184.5Mđ',    
        icon: <DollarSign className="h-5 w-5" />, 
        sub: 'So với tuần trước',          
        trend: '+5.4%',
        isPositive: true,
        colorClass: 'text-[#004b87] bg-blue-50' 
      },
      { 
        label: 'Tổng vé bán',      
        value: revenueData?.summary?.tongSoVe ? `${revenueData.summary.tongSoVe} vé` : '1,428 vé',    
        icon: <Users className="h-5 w-5" />, 
        sub: 'Lượt khách di chuyển',           
        trend: '+12.8%',
        isPositive: true,
        colorClass: 'text-emerald-600 bg-emerald-50'
      },
      { 
        label: 'Đánh giá dịch vụ',       
        value: ratingsData?.summary?.diemTrungBinh ? `${ratingsData.summary.diemTrungBinh}/5` : '4.8/5', 
        icon: <Star className="h-5 w-5 text-amber-500 fill-amber-400" />, 
        sub: `Tổng ${ratingsData?.summary?.tongSoDanhGia || 156} nhận xét`,       
        trend: '+0.4%',
        isPositive: true,
        colorClass: 'text-amber-600 bg-amber-50'
      },
      { 
        label: 'Hiệu suất đội xe',
        value: '90.5%', 
        icon: <Bus className="h-5 w-5" />, 
        sub: '38/42 xe vận hành',       
        trend: '+1.5%',
        isPositive: true,
        colorClass: 'text-indigo-650 bg-indigo-50'
      },
      {
        label: 'Tỷ lệ hủy vé (Churn Rate)',
        value: '4.26%',
        sub: 'Yêu cầu hoàn hủy chuyến',
        trend: '-0.31%',
        isPositive: false,
        sparklinePath: 'M 0 25 Q 20 10, 40 30 T 80 20 T 100 35',
        sparklineColor: '#ef4444',
        colorClass: 'text-rose-600 bg-rose-50'
      },
      {
        label: 'Tăng trưởng khách hàng',
        value: '3,768',
        sub: 'Đăng ký mới',
        trend: '+3.85%',
        isPositive: true,
        sparklinePath: 'M 0 35 Q 25 30, 50 15 T 75 22 T 100 5',
        sparklineColor: '#10b981',
        colorClass: 'text-emerald-600 bg-emerald-50'
      }
    ],
    [USER_ROLES.DRIVER]: [
      { label: 'Chuyến hôm nay',    value: '5 Chuyến', icon: <Calendar className="h-6 w-6" />, sub: 'Lịch trình cố định',                subType: 'arrow-up' },
      { label: 'Chuyến đang chạy', value: '0 Chuyến', icon: <Bus className="h-6 w-6" />, sub: 'Đang di chuyển trên tuyến',         subType: 'dot-orange' },
      { label: 'Khách chuyến chọn',value: '4 Khách',  icon: <Users className="h-6 w-6" />, sub: 'Chọn tuyến Đà Nẵng → Huế',         subType: '' },
      { label: 'Hàng hóa cần giao',value: '2 Kiện',   icon: <TrendingUp className="h-6 w-6" />, sub: 'Chờ xác nhận & vận chuyển',        subType: '' }
    ],
    [USER_ROLES.TICKET_STAFF]: [
      { label: 'Vé cần soát',      value: '42', icon: <Clock className="h-6 w-6" />, sub: 'Chờ xử lý hôm nay',    subType: '' },
      { label: 'Vé đã soát',       value: '156', icon: <TrendingUp className="h-6 w-6" />, sub: 'Đã xử lý hôm nay',     subType: 'arrow-up' },
      { label: 'Chuyến hôm nay',   value: '8',  icon: <Bus className="h-6 w-6" />, sub: 'Đang vận hành',         subType: 'dot-orange' },
      { label: 'Hành khách',       value: '892',icon: <Users className="h-6 w-6" />, sub: 'Tổng hành khách hôm nay',subType: '' }
    ],
    [USER_ROLES.SUPPORT_STAFF]: [
      { label: 'Yêu cầu hoàn/hủy',  value: '7',  icon: <Clock className="h-6 w-6" />, sub: 'Cần xử lý hôm nay',    subType: '' },
      { label: 'Đang xử lý',         value: '3',  icon: <TrendingUp className="h-6 w-6" />, sub: 'Trong hàng đợi',        subType: 'dot-orange' },
      { label: 'Hoàn thành hôm nay', value: '12', icon: <Bus className="h-6 w-6" />, sub: 'Đã giải quyết',         subType: 'arrow-up' },
      { label: 'Thỏa mãn khách',     value: '98%',icon: <Users className="h-6 w-6" />, sub: 'Đánh giá hài lòng',     subType: '' }
    ]
  }
  return map[role] || []
}

function getRoleName(role) {
  return {
    [USER_ROLES.ADMIN]: 'Quản trị viên',
    [USER_ROLES.DRIVER]: 'Tài xế',
    [USER_ROLES.TICKET_STAFF]: 'Nhân viên soát vé',
    [USER_ROLES.SUPPORT_STAFF]: 'Nhân viên hỗ trợ'
  }[role] || 'Người dùng'
}

function getWeeklyRevenuePoints(revenueData) {
  const points = []
  const today = new Date()
  
  // Create an array of the last 7 dates chronologically
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(today.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    
    // Find if we have real data for this date
    const realDay = revenueData?.daily?.find(item => {
      if (!item.ngay) return false
      const itemDate = new Date(item.ngay).toISOString().split('T')[0]
      return itemDate === dateStr
    })
    
    points.push({
      label: d.toLocaleDateString('vi-VN', { weekday: 'short' }),
      amount: realDay ? (realDay.tongDoanhThu || 0) : 0,
      rawValue: realDay ? (realDay.tongDoanhThu || 0) : 0
    })
  }
  
  return points
}

function getRouteChartData(routeData) {
  if (routeData && routeData.routes && routeData.routes.length > 0) {
    const sortedRoutes = [...routeData.routes]
      .sort((a, b) => b.tongGheDat - a.tongGheDat)
      .slice(0, 5)
    return sortedRoutes.map(r => ({
      name: `${r.diemDi} → ${r.diemDen}`,
      value: r.tongGheDat || 0,
      ratio: r.tyLeLapDay || 0
    }))
  }
  return [
    { name: 'Đà Nẵng → Huế', value: 340, ratio: 82 },
    { name: 'Đà Nẵng → Hội An', value: 290, ratio: 78 },
    { name: 'Đà Nẵng → Q.Nam', value: 210, ratio: 65 },
    { name: 'Đà Nẵng → Q.Ngãi', value: 180, ratio: 54 },
    { name: 'Đà Nẵng → Q.Trị', value: 120, ratio: 45 }
  ]
}

function getRecentActivities(incidents) {
  const list = []
  if (incidents && incidents.length > 0) {
    incidents.slice(0, 2).forEach(inc => {
      list.push({
        type: 'incident',
        title: `Sự cố SC${inc.maSuCo}: ${inc.loaiSuCo}`,
        desc: `Tài xế ${inc.tenTaiXe} báo cáo tại ${inc.vi_tri}. Mức độ: ${inc.muc_do}.`,
        time: inc.thoiGianTao ? new Date(inc.thoiGianTao) : new Date(),
        badgeColor: 'bg-rose-50 text-rose-700 border-rose-100',
        badgeText: inc.trangThaiSuCo === 'da_xu_ly' ? 'Đã xử lý' : 'Mới'
      })
    })
  }

  list.push({
    type: 'ticket',
    title: 'Đặt vé thành công #VE8932',
    desc: 'Hành khách Nguyễn Văn B đã đặt vé tuyến Đà Nẵng → Huế.',
    time: new Date(Date.now() - 15 * 60 * 1000),
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    badgeText: 'Thành công'
  })
  
  list.push({
    type: 'cargo',
    title: 'Ký gửi mới #KG0429',
    desc: 'Đã phân phối xe tải 29A-54321 cho đơn hàng cồng kềnh.',
    time: new Date(Date.now() - 45 * 60 * 1000),
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-100',
    badgeText: 'Phân phối'
  })

  list.push({
    type: 'refund',
    title: 'Yêu cầu hoàn hủy #YC382',
    desc: 'Hành khách Trần Thị C yêu cầu hủy vé do đổi lịch trình.',
    time: new Date(Date.now() - 120 * 60 * 1000),
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-100',
    badgeText: 'Chờ duyệt'
  })

  return list
}

function getDemoTrip(role) {
  if (role === USER_ROLES.DRIVER) {
    return {
      from: 'Đà Nẵng',
      to: 'Huế',
      departTime: '13:00',
      arriveTime: '15:00',
      plate: '29A-54321 (35 chỗ)',
      passengers: 4,
      capacity: 35
    }
  }
  return null
}

function getOperationSteps(role) {
  const map = {
    [USER_ROLES.ADMIN]: [
      'Kiểm tra tổng quan hệ thống và các thống kê hàng ngày.',
      'Xem xét và phê duyệt thay đổi tuyến đường, lịch trình.',
      'Quản lý người dùng, phân quyền và xử lý báo cáo.',
      'Kiểm tra doanh thu và xuất file thống kê cuối ngày.'
    ],
    [USER_ROLES.DRIVER]: [
      'Kiểm tra phương tiện kỹ thuật và nhiên liệu trước khi xuất phát.',
      'Mở điều hòa và dọn dẹp vệ sinh buồng lái & khoang hành khách.',
      'Soát vé và kiểm tra hành lý/hàng hóa đi kèm trước khi lên xe.',
      'Cập nhật trạng thái hành trình đầy đủ trên hệ thống ứng dụng.'
    ],
    [USER_ROLES.TICKET_STAFF]: [
      'Kiểm tra danh sách hành khách trên chuyến xe đã phân công.',
      'Quét mã QR vé điện tử của từng hành khách khi lên xe.',
      'Xử lý các trường hợp vé không hợp lệ hoặc cần hỗ trợ.',
      'Báo cáo kết quả soát vé sau khi chuyến xe khởi hành.'
    ],
    [USER_ROLES.SUPPORT_STAFF]: [
      'Kiểm tra danh sách yêu cầu hoàn/hủy vé mới trong ngày.',
      'Tra cứu thông tin vé và xác minh yêu cầu của khách hàng.',
      'Xử lý hoàn tiền hoặc đổi vé theo quy trình quy định.',
      'Cập nhật trạng thái xử lý và thông báo cho khách hàng.'
    ]
  }
  return map[role] || [
    'Đăng nhập và kiểm tra thông tin tài khoản.',
    'Thực hiện các chức năng được phân quyền.',
    'Báo cáo sự cố (nếu có) cho bộ phận quản lý.'
  ]
}

function getMenuIcon(iconName) {
  const map = {
    dashboard: <Grid className="h-5 w-5" />,
    bus: <Bus className="h-5 w-5" />,
    route: <MapPin className="h-5 w-5" />,
    clock: <Clock className="h-5 w-5" />,
    users: <Users className="h-5 w-5" />,
    staff: <ShieldAlert className="h-5 w-5" />,
    chart: <BarChart3 className="h-5 w-5" />,
    calendar: <Calendar className="h-5 w-5" />,
    road: <MapPin className="h-5 w-5" />,
    qrcode: <QrCode className="h-5 w-5" />,
    search: <Search className="h-5 w-5" />,
    undo: <Undo className="h-5 w-5" />
  }
  return map[iconName] || <ChevronRight className="h-5 w-5" />
}

export default AdminDashboard
