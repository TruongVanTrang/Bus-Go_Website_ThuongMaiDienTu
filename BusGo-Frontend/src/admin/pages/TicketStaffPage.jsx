import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Bus,
  Camera,
  CameraOff,
  Check,
  CheckCircle,
  ClipboardList,
  Clock,
  Download,
  Info,
  Keyboard,
  LogOut,
  QrCode,
  Search,
  Users,
  X,
  XCircle,
  Menu,
  ChevronRight,
  MapPin,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  Bell,
  Calendar
} from 'lucide-react'

// Import helpers & constants
import { AuthUtil } from '@/utils/helpers'
import { USER_ROLES } from '@/utils/constants'

// Import custom UI components
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'

const PATH_VIEWS = {
  '/admin/dashboard': 'dashboard',
  '/admin/staff/scan': 'scan',
  '/admin/staff/passengers': 'passengers'
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Soát vé', icon: ClipboardList, path: '/admin/dashboard' },
  { id: 'scan', label: 'Quét mã QR soát vé', icon: QrCode, path: '/admin/staff/scan' },
  { id: 'passengers', label: 'Danh sách hành khách', icon: Users, path: '/admin/staff/passengers' }
]

const INITIAL_PASSENGERS = [
  // HN → HP 08:00 (6 passengers, 3 boarded)
  { id: 'BG-001', name: 'Nguyễn Văn A', phone: '0912 345 678', seat: 'A01', trip: 'HN → HP', time: '08:00', status: 'boarded' },
  { id: 'BG-002', name: 'Trần Thị B', phone: '0923 456 789', seat: 'A02', trip: 'HN → HP', time: '08:00', status: 'boarded' },
  { id: 'BG-003', name: 'Lê Văn C', phone: '0934 567 890', seat: 'B01', trip: 'HN → HP', time: '08:00', status: 'not_boarded' },
  { id: 'BG-004', name: 'Phạm Thị D', phone: '0945 678 901', seat: 'B02', trip: 'HN → HP', time: '08:00', status: 'not_boarded' },
  { id: 'BG-005', name: 'Hoàng Văn E', phone: '0956 789 012', seat: 'C01', trip: 'HN → HP', time: '08:00', status: 'boarded' },
  { id: 'BG-006', name: 'Vũ Thị F', phone: '0967 890 123', seat: 'C02', trip: 'HN → HP', time: '08:00', status: 'not_boarded' },

  // HN → HCM 10:30 (5 passengers, 2 boarded)
  { id: 'BG-101', name: 'Trần Văn G', phone: '0988 111 222', seat: 'A01', trip: 'HN → HCM', time: '10:30', status: 'boarded' },
  { id: 'BG-102', name: 'Lê Thị H', phone: '0988 333 444', seat: 'A02', trip: 'HN → HCM', time: '10:30', status: 'boarded' },
  { id: 'BG-103', name: 'Phạm Văn I', phone: '0988 555 666', seat: 'B01', trip: 'HN → HCM', time: '10:30', status: 'not_boarded' },
  { id: 'BG-104', name: 'Nguyễn Thị K', phone: '0988 777 888', seat: 'B02', trip: 'HN → HCM', time: '10:30', status: 'not_boarded' },
  { id: 'BG-105', name: 'Vũ Văn L', phone: '0988 999 000', seat: 'C01', trip: 'HN → HCM', time: '10:30', status: 'not_boarded' },

  // HN → DN 14:00 (4 passengers, 1 boarded)
  { id: 'BG-201', name: 'Đặng Thị M', phone: '0977 111 222', seat: 'A01', trip: 'HN → DN', time: '14:00', status: 'boarded' },
  { id: 'BG-202', name: 'Bùi Văn N', phone: '0977 333 444', seat: 'A02', trip: 'HN → DN', time: '14:00', status: 'not_boarded' },
  { id: 'BG-203', name: 'Ngô Thị O', phone: '0977 555 666', seat: 'B01', trip: 'HN → DN', time: '14:00', status: 'not_boarded' },
  { id: 'BG-204', name: 'Đỗ Văn P', phone: '0977 777 888', seat: 'B02', trip: 'HN → DN', time: '14:00', status: 'not_boarded' }
]

const TRIPS = [
  { id: 'trip-1', code: 'HN → HP', routeName: 'Hà Nội → Hải Phòng', time: '08:00', dateLabel: 'Hôm nay' },
  { id: 'trip-2', code: 'HN → HCM', routeName: 'Hà Nội → TP. Hồ Chí Minh', time: '10:30', dateLabel: 'Hôm nay' },
  { id: 'trip-3', code: 'HN → DN', routeName: 'Hà Nội → Đà Nẵng', time: '14:00', dateLabel: 'Hôm nay' }
]

const INITIAL_SCAN_RESULTS = []


function getViewFromPath(pathname) {
  return PATH_VIEWS[pathname] || 'dashboard'
}

function formatTime() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

export default function TicketStaffPage() {
  const navigate = useNavigate()
  const location = useLocation()

  // Layout states (matching Driver style)
  const [isSidebarPinned, setIsSidebarPinned] = useState(false)
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)
  const isSidebarCollapsed = !isSidebarPinned && !isSidebarHovered

  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [passengers, setPassengers] = useState(INITIAL_PASSENGERS)

  const activeView = getViewFromPath(location.pathname)

  useEffect(() => {
    const role = AuthUtil.getCurrentRole()
    const user = AuthUtil.getCurrentUser()
    if (!role) {
      navigate('/login')
      return
    }
    if (role !== USER_ROLES.TICKET_STAFF) {
      navigate('/unauthorized')
      return
    }
    setUserName(user?.name || 'Nhân viên soát vé')
    setLoading(false)
  }, [navigate])

  const handleNav = (path) => {
    navigate(path)
  }

  // Sync searchQuery with local views
  const handleSearchChange = (val) => {
    setSearchQuery(val)
  }

  // Clear search on view change
  useEffect(() => {
    setSearchQuery('')
  }, [activeView])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#004b87] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-x-hidden antialiased">
      {/* Custom Scoped Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scanSweep {
          0%, 100% { top: 10%; }
          50% { top: 90%; }
        }
        .animate-scanSweep {
          animation: scanSweep 2s ease-in-out infinite;
        }
      `}} />

      {/* ==================== LEFT SIDEBAR ==================== */}
      <aside
        onMouseEnter={() => !isSidebarPinned && setIsSidebarHovered(true)}
        onMouseLeave={() => !isSidebarPinned && setIsSidebarHovered(false)}
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-slate-105 flex flex-col justify-between py-6 px-4 transition-all duration-300 ${
          isSidebarCollapsed ? 'w-20' : 'w-64 shadow-[10px_0_30px_-15px_rgba(0,0,0,0.03)]'
        }`}
      >
        <div className="space-y-6">
          {/* Header Info */}
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between px-2'}`}>
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 bg-[#004b87] rounded-xl flex items-center justify-center shadow-lg shadow-[#004b87]/20 text-white font-black text-sm uppercase flex-shrink-0">
                {userName.charAt(0)}
              </div>
              {!isSidebarCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-black text-slate-800 truncate leading-tight">
                    {userName}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                    Nhân viên Soát vé
                  </span>
                </div>
              )}
            </div>
            
            {!isSidebarCollapsed && (
              <button 
                onClick={() => setIsSidebarPinned(prev => !prev)}
                className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-[#004b87] transition-all bg-transparent border-none cursor-pointer"
                title={isSidebarPinned ? 'Thu gọn sidebar' : 'Ghim sidebar'}
              >
                <ChevronRight className={`h-4.5 w-4.5 transition-transform duration-300 ${isSidebarPinned ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>

          <div className="h-px bg-slate-100 mx-2" />

          {/* Navigation links */}
          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = activeView === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.path)}
                  className={`flex items-center w-full rounded-xl py-3.5 text-sm font-extrabold tracking-wide transition-all group duration-200 border-none bg-transparent cursor-pointer ${
                    isSidebarCollapsed ? 'justify-center px-0' : 'px-4'
                  } ${
                    isActive 
                      ? 'bg-sky-50 text-[#004b87]' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                    <Icon className={`h-5 w-5 ${isActive ? 'text-[#004b87]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  </div>
                  {!isSidebarCollapsed && (
                    <span className="ml-3 truncate">{item.label}</span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="space-y-4">
          {isSidebarCollapsed && (
            <button
              onClick={() => setIsSidebarPinned(prev => !prev)}
              className="flex items-center justify-center w-full h-11 hover:bg-slate-50 text-slate-400 hover:text-[#004b87] rounded-xl border-none bg-transparent cursor-pointer"
              title="Ghim sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          
          <button
            onClick={() => {
              AuthUtil.logout()
              navigate('/login')
            }}
            className={`flex items-center rounded-xl py-3.5 text-sm font-extrabold text-red-500 hover:bg-red-50 w-full transition-all border-none bg-transparent cursor-pointer ${
              isSidebarCollapsed ? 'justify-center px-0' : 'px-4'
            }`}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!isSidebarCollapsed && (
              <span className="ml-3">Đăng xuất</span>
            )}
          </button>
        </div>
      </aside>

      {/* ==================== MAIN CONTENT WRAPPER ==================== */}
      <div 
        className="flex-1 flex flex-col transition-all duration-300 h-screen overflow-hidden"
        style={{ paddingLeft: isSidebarPinned ? '260px' : '80px' }}
      >
        {/* ==================== TOPBAR ==================== */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 h-16 flex items-center justify-between px-6 md:px-8 flex-shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={activeView === 'passengers' ? 'Tìm theo họ tên, SĐT, mã vé...' : 'Tìm kiếm nhanh...'}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-full bg-slate-50/50 text-slate-700 font-semibold text-sm focus:outline-none focus:border-[#004b87] focus:ring-4 focus:ring-[#004b87]/5 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2.5 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-full border-none bg-transparent cursor-pointer transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#004b87] to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
              {userName.charAt(0)}
            </div>
          </div>
        </header>

        {/* ==================== VIEW CONTENT ==================== */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50">
          {activeView === 'dashboard' && <DashboardView onNavigate={handleNav} />}
          {activeView === 'scan' && (
            <ScanView 
              passengers={passengers} 
              setPassengers={setPassengers} 
              onGoPassengers={() => handleNav('/admin/staff/passengers')} 
            />
          )}
          {activeView === 'passengers' && (
            <PassengersView 
              passengers={passengers} 
              setPassengers={setPassengers} 
              searchQuery={searchQuery} 
            />
          )}
        </main>
      </div>
    </div>
  )
}

function DashboardView({ onNavigate }) {
  const stats = [
    { icon: ClipboardList, label: 'Vé cần soát', value: '42', color: 'blue', desc: 'Chưa soát trên chuyến' },
    { icon: CheckCircle, label: 'Vé đã soát', value: '156', color: 'green', desc: 'Hoàn thành check-in' },
    { icon: Bus, label: 'Chuyến hôm nay', value: '8', color: 'orange', desc: 'Lịch chạy trong ngày' },
    { icon: Users, label: 'Hành khách', value: '892', color: 'purple', desc: 'Tổng số lượng khách' }
  ]

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <Card className="border-none bg-gradient-to-r from-[#004b87] to-sky-700 text-white relative overflow-hidden shadow-lg shadow-[#004b87]/15">
        <div className="absolute top-[-50%] right-[-10%] w-96 h-96 bg-white/5 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-40%] left-[20%] w-60 h-60 bg-sky-400/10 rounded-full blur-[60px]" />
        
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <span className="text-sky-200 text-xs font-black tracking-widest uppercase">Hệ thống kiểm soát vé</span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Chào mừng đến BusGo Dashboard</h1>
            <p className="text-sky-100 text-sm font-semibold flex items-center gap-1.5">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              Nhân viên soát vé - Quản lý và kiểm tra hành khách vận hành an toàn.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md p-4 px-5 rounded-2xl border border-white/10 shadow-inner w-full md:w-auto text-left">
            <p className="text-[10px] font-black text-sky-200 uppercase tracking-wider">Tiến độ soát vé</p>
            <span className="text-lg font-black mt-0.5 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
              Đã soát 156 vé hôm nay
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => {
          const colorClass = {
            blue: 'bg-blue-50 text-[#004b87] border-blue-100',
            green: 'bg-green-50 text-green-600 border-green-100',
            orange: 'bg-orange-50 text-orange-600 border-orange-100',
            purple: 'bg-purple-50 text-purple-600 border-purple-100'
          }[stat.color]

          return (
            <Card key={stat.label} className="hover:shadow-md border-slate-100/80 transition-shadow">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                  <h3 className="text-2xl font-black text-slate-800">{stat.value}</h3>
                  <p className="text-[11px] font-semibold text-slate-400 mt-1">{stat.desc}</p>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Actions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card 
          onClick={() => onNavigate('/admin/staff/scan')}
          className="bg-gradient-to-br from-blue-50/50 to-blue-50 border border-blue-100 hover:border-blue-250 rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all group"
        >
          <CardContent className="p-0 flex items-start justify-between">
            <div className="space-y-4 flex-1">
              <div className="w-14 h-14 bg-gradient-to-br from-[#004b87] to-blue-600 rounded-2xl flex items-center justify-center shadow-md shadow-[#004b87]/15 group-hover:scale-105 transition-transform duration-300">
                <QrCode className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-lg">Quét mã QR soát vé</h3>
                <p className="text-slate-500 font-semibold text-xs mt-1">Sử dụng Camera thiết bị quét mã QR trên vé khách hàng để kiểm tra tính hợp lệ và tự động check-in hành khách.</p>
              </div>
              <span className="text-xs font-black text-[#004b87] inline-flex items-center gap-1.5 group-hover:underline">
                Bật trình quét ngay <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => onNavigate('/admin/staff/passengers')}
          className="bg-gradient-to-br from-purple-50/50 to-purple-50 border border-purple-100 hover:border-purple-250 rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all group"
        >
          <CardContent className="p-0 flex items-start justify-between">
            <div className="space-y-4 flex-1">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-md shadow-purple-500/15 group-hover:scale-105 transition-transform duration-300">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-lg">Danh sách hành khách</h3>
                <p className="text-slate-500 font-semibold text-xs mt-1">Theo dõi danh sách khách hàng lên xe chi tiết cho từng chặng bay, hỗ trợ lọc trạng thái và xuất file báo cáo.</p>
              </div>
              <span className="text-xs font-black text-purple-600 inline-flex items-center gap-1.5 group-hover:underline">
                Xem danh sách <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <Card className="border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black flex items-center gap-2 text-slate-800">
            <Info className="w-4 h-4 text-[#004b87]" /> Thông tin kỹ thuật hệ thống
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-500 font-semibold">
            <li className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-100">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Phiên bản hệ thống: BusGo v1.0.0
            </li>
            <li className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-100">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              API Gateway: Kết nối ổn định (v1)
            </li>
            <li className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-100">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Trạng thái máy chủ: Sẵn sàng hoạt động
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function ScanView({ passengers, setPassengers, onGoPassengers }) {
  const [selectedTrip, setSelectedTrip] = useState(null)
  const [cameraOn, setCameraOn] = useState(true)
  const [scanning, setScanning] = useState(true)
  const [showManualModal, setShowManualModal] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [scanMessage, setScanMessage] = useState(null)

  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraOn(true)
      setScanning(true)
    } catch {
      setCameraOn(false)
      setScanning(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraOn(false)
    setScanning(false)
  }

  useEffect(() => {
    if (selectedTrip) {
      startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [selectedTrip])

  const handleScanOrInput = (code) => {
    if (!selectedTrip) return
    const cleanCode = code.trim().toUpperCase()

    // Find passenger in this trip
    const passengerIdx = passengers.findIndex(
      (p) =>
        p.trip === selectedTrip.code &&
        p.time === selectedTrip.time &&
        p.id.toUpperCase() === cleanCode
    )

    if (passengerIdx !== -1) {
      const passenger = passengers[passengerIdx]
      if (passenger.status === 'boarded') {
        setScanMessage({
          type: 'info',
          text: `Vé #${passenger.id} (${passenger.name}) đã soát trước đó.`
        })
      } else {
        const updated = [...passengers]
        updated[passengerIdx] = { ...passenger, status: 'boarded' }
        setPassengers(updated)
        setScanMessage({
          type: 'success',
          text: `Thành công: ${passenger.name} (${passenger.seat}) đã lên xe.`
        })
      }
    } else {
      setScanMessage({
        type: 'error',
        text: `Mã vé "${code}" không hợp lệ cho chuyến xe này.`
      })
    }

    setTimeout(() => {
      setScanMessage(null)
    }, 4500)
    setScanning(true)
  }

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (!manualCode.trim()) return
    handleScanOrInput(manualCode.trim())
    setManualCode('')
    setShowManualModal(false)
  }

  const toggleCamera = () => {
    if (cameraOn) {
      stopCamera()
    } else {
      startCamera()
    }
  }

  const tripPassengers = useMemo(() => {
    if (!selectedTrip) return []
    return passengers.filter((p) => p.trip === selectedTrip.code && p.time === selectedTrip.time)
  }, [passengers, selectedTrip])

  const boardedCount = useMemo(() => {
    return tripPassengers.filter((p) => p.status === 'boarded').length
  }, [tripPassengers])

  const notBoardedCount = useMemo(() => {
    return tripPassengers.filter((p) => p.status === 'not_boarded').length
  }, [tripPassengers])

  const filteredPassengers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return tripPassengers.filter((p) => {
      return (
        !q ||
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
        p.seat.toLowerCase().includes(q)
      )
    })
  }, [tripPassengers, searchQuery])

  if (!selectedTrip) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div>
          <h1 className="text-2xl font-black text-slate-800 animate-slideDown">Quét mã QR soát vé</h1>
          <p className="text-slate-400 text-xs font-semibold mt-1">Chọn chuyến xe bạn muốn soát vé</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
          {TRIPS.map((trip) => {
            const currentTripPassengers = passengers.filter(
              (p) => p.trip === trip.code && p.time === trip.time
            )
            const totalCount = currentTripPassengers.length
            const boarded = currentTripPassengers.filter((p) => p.status === 'boarded').length

            return (
              <Card
                key={trip.id}
                onClick={() => setSelectedTrip(trip)}
                className="hover:shadow-md border-slate-100 hover:border-slate-200 transition-all cursor-pointer bg-white relative group"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-sky-50 text-[#004b87] hover:bg-sky-50 font-extrabold text-xs px-3 py-1 border-none rounded-lg">
                      {trip.code}
                    </Badge>
                    <ChevronRight className="h-5 w-5 text-slate-350 group-hover:text-[#004b87] group-hover:translate-x-0.5 transition-all" />
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-slate-650 font-bold text-xs">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span>{trip.routeName}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-650 font-bold text-xs">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span>{trip.time} • {trip.dateLabel}</span>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 my-4" />

                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span>{totalCount} hành khách</span>
                    </div>
                    <span className="text-green-600 font-extrabold">{boarded} đã lên xe</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title block with back btn */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSelectedTrip(null)}
          className="w-10 h-10 bg-white hover:bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center shadow-sm cursor-pointer transition-all"
        >
          <ArrowLeft className="h-5 w-5 text-slate-650" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-800">Quét mã QR soát vé</h1>
            <Badge className="bg-sky-50 text-[#004b87] hover:bg-sky-50 font-black text-xs px-2.5 py-0.5 border-none rounded-lg">
              {selectedTrip.code}
            </Badge>
          </div>
          <p className="text-slate-400 text-xs font-semibold mt-1">
            {selectedTrip.routeName} • {selectedTrip.time} {selectedTrip.dateLabel}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fadeIn">
        {/* Left Side: Camera viewport */}
        <Card className="lg:col-span-2 border-slate-100 shadow-sm overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between py-4 bg-slate-50/20">
            <CardTitle className="text-sm font-black text-slate-850">Khung quét</CardTitle>
            <Badge className={`text-[9px] font-black py-0.5 border-none ${
              cameraOn ? 'bg-green-50 text-green-650' : 'bg-slate-100 text-slate-450'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${cameraOn ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
              {cameraOn ? 'CAMERA ĐANG BẬT' : 'CAMERA ĐANG TẮT'}
            </Badge>
          </CardHeader>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            {/* Viewport Frame */}
            <div className="relative w-full aspect-square max-w-[420px] bg-[#0f172a] rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center shadow-inner animate-pulseFast">
              {cameraOn && (
                <video ref={videoRef} playsInline muted className="w-full h-full object-cover" aria-label="Camera quét QR" />
              )}
              {/* Target Scan Box Overlay */}
              <div className="absolute inset-8 pointer-events-none">
                <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
                <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
                <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
                <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />
                
                {cameraOn && scanning && (
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-lg shadow-cyan-400/55 animate-scanSweep" />
                )}
              </div>

              {cameraOn && scanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-white text-xs font-bold tracking-wide">Đang quét...</span>
                </div>
              )}

              {!cameraOn && (
                <div className="text-center text-slate-500 space-y-2 select-none">
                  <CameraOff size={36} className="mx-auto opacity-30" />
                  <p className="text-xs font-bold">Hình ảnh camera đã tắt</p>
                </div>
              )}

              {/* Success/Error scan feedback overlay */}
              {scanMessage && (
                <div className={`absolute bottom-4 left-4 right-4 backdrop-blur-md px-3.5 py-2.5 rounded-xl border text-[11px] font-black flex items-center gap-2 animate-fadeIn z-10 ${
                  scanMessage.type === 'success'
                    ? 'bg-emerald-950/85 border-emerald-500 text-emerald-300'
                    : scanMessage.type === 'info'
                    ? 'bg-blue-950/85 border-blue-500 text-blue-300'
                    : 'bg-red-950/85 border-red-500 text-red-300'
                }`}>
                  {scanMessage.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : scanMessage.type === 'info' ? (
                    <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  )}
                  <span className="truncate">{scanMessage.text}</span>
                </div>
              )}
            </div>

            {/* Actions panel */}
            <div className="flex gap-4 w-full max-w-[420px] mt-6">
              <Button
                variant="outline"
                onClick={toggleCamera}
                className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs h-10 rounded-xl"
              >
                {cameraOn ? <CameraOff className="h-4 w-4 mr-1.5" /> : <Camera className="h-4 w-4 mr-1.5" />}
                {cameraOn ? 'Tắt camera' : 'Bật camera'}
              </Button>
              <Button
                onClick={() => setShowManualModal(true)}
                className="flex-1 bg-[#004b87] hover:bg-[#003d70] text-white font-black text-xs h-10 rounded-xl border-none cursor-pointer"
              >
                <Keyboard className="h-4 w-4 mr-1.5" />
                Nhập mã thủ công
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Side: Passengers Registered list */}
        <Card className="border-slate-100 shadow-sm flex flex-col max-h-[580px] bg-white">
          <CardHeader className="border-b border-slate-100 bg-slate-50/20 py-4">
            <CardTitle className="text-sm font-black flex items-center gap-2 text-slate-800">
              <Users className="w-4 h-4 text-[#004b87]" /> Hành khách đăng ký
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex flex-col flex-1 overflow-hidden space-y-4">
            {/* Stats summary boxes */}
            <div className="grid grid-cols-2 gap-3 flex-shrink-0">
              <div className="bg-green-50/50 border border-green-100 p-3 rounded-xl text-center">
                <p className="text-[10px] text-green-650 font-bold">Đã lên xe</p>
                <p className="text-xl font-black text-green-650 mt-0.5">{boardedCount}</p>
              </div>
              <div className="bg-orange-50/50 border border-orange-100 p-3 rounded-xl text-center">
                <p className="text-[10px] text-orange-600 font-bold">Chưa lên xe</p>
                <p className="text-xl font-black text-orange-600 mt-0.5">{notBoardedCount}</p>
              </div>
            </div>

            {/* Search Input Box */}
            <div className="relative flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên, SĐT, mã vé, ghế..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-700 font-semibold text-xs focus:outline-none focus:border-[#004b87] focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 bg-transparent border-none cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Passengers lists container */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 scrollbar-thin max-h-[350px]">
              {filteredPassengers.map((passenger) => {
                const isBoarded = passenger.status === 'boarded'
                return (
                  <div
                    key={passenger.id}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all bg-gradient-to-br from-white to-slate-50/20 ${
                      isBoarded ? 'border-green-100 hover:border-green-200' : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Status Circle Icon */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
                        isBoarded ? 'bg-green-50 border-green-100 text-green-600' : 'bg-slate-50 border-slate-100 text-slate-400'
                      }`}>
                        {isBoarded ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                          <span className="truncate">{passenger.name}</span>
                          <span className="bg-sky-50 text-[#004b87] px-1.5 py-0.5 rounded text-[9px] font-black flex-shrink-0">
                            {passenger.seat}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold truncate mt-1">
                          {passenger.id} • {passenger.phone}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded flex-shrink-0 ${
                      isBoarded ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {isBoarded ? 'Đã lên xe' : 'Chưa lên'}
                    </span>
                  </div>
                )
              })}

              {filteredPassengers.length === 0 && (
                <div className="p-12 text-center text-slate-400 space-y-2 select-none">
                  <Info className="h-10 w-10 text-slate-350 mx-auto" />
                  <p className="font-bold text-xs">Không tìm thấy hành khách nào khớp</p>
                </div>
              )}
            </div>

            <button
              onClick={onGoPassengers}
              className="text-xs font-black text-[#004b87] hover:underline flex items-center gap-1 bg-transparent border-none cursor-pointer self-start flex-shrink-0 pt-2"
            >
              Xem danh sách hành khách đi xe <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Manual Input Dialog */}
      {showManualModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowManualModal(false)}
        >
          <Card 
            className="w-full max-w-sm border-slate-100 shadow-xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-wider">Nhập mã vé thủ công</CardTitle>
              <CardDescription className="text-xs font-semibold">Nhập chính xác ký tự mã vé in trên hóa đơn của hành khách.</CardDescription>
            </CardHeader>
            <form onSubmit={handleManualSubmit}>
              <CardContent className="space-y-4">
                <input
                  type="text"
                  placeholder="Ví dụ: BG-003"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#004b87] focus:ring-4 focus:ring-[#004b87]/5"
                  autoFocus
                  required
                />
              </CardContent>
              <CardFooter className="flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowManualModal(false)}
                  className="border-slate-200 font-bold text-xs h-9"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="bg-[#004b87] hover:bg-[#003d70] text-white font-black text-xs h-9 border-none cursor-pointer"
                >
                  Kiểm tra vé
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}

function PassengersView({ passengers, setPassengers, searchQuery }) {
  const [search, setSearch] = useState('')
  const [tripFilter, setTripFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedPassenger, setSelectedPassenger] = useState(null)

  const trips = useMemo(() => {
    const set = new Set(passengers.map((p) => `${p.trip} ${p.time}`))
    return ['all', ...set]
  }, [passengers])

  // Combine local search and topbar search
  const activeSearch = searchQuery || search

  const filtered = useMemo(() => {
    return passengers.filter((p) => {
      const q = activeSearch.toLowerCase().trim()
      const matchSearch =
        !q ||
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.phone.replace(/\s/g, '').includes(q.replace(/\s/g, ''))
      const tripKey = `${p.trip} ${p.time}`
      const matchTrip = tripFilter === 'all' || tripKey === tripFilter
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'boarded' && p.status === 'boarded') ||
        (statusFilter === 'not_boarded' && p.status === 'not_boarded')
      return matchSearch && matchTrip && matchStatus
    })
  }, [passengers, activeSearch, tripFilter, statusFilter])

  const boarded = filtered.filter((p) => p.status === 'boarded').length
  const notBoarded = filtered.filter((p) => p.status === 'not_boarded').length

  const handleExport = () => {
    const header = 'Mã vé,Họ tên,SĐT,Ghế,Chuyến,Trạng thái\n'
    const rows = filtered
      .map(
        (p) =>
          `${p.id},${p.name},${p.phone},${p.seat},"${p.trip} ${p.time}",${p.status === 'boarded' ? 'Đã lên xe' : 'Chưa lên xe'}`
      )
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'danh-sach-hanh-khach.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Danh sách soát vé hành khách</h1>
          <p className="text-slate-400 text-xs font-semibold mt-1">Danh sách hành khách check-in lên xe chi tiết theo từng chuyến chạy.</p>
        </div>
      </div>

      {/* Toolbar Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2.5 flex-wrap flex-1 max-w-lg">
          {/* Trip Select filter */}
          <select 
            value={tripFilter} 
            onChange={(e) => setTripFilter(e.target.value)}
            className="border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#004b87] focus:ring-4 focus:ring-[#004b87]/5"
          >
            <option value="all">Tất cả chuyến xe</option>
            {trips.slice(1).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Status filter select */}
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#004b87] focus:ring-4 focus:ring-[#004b87]/5"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="boarded">Đã lên xe</option>
            <option value="not_boarded">Chưa lên xe</option>
          </select>

          {/* Local search if topbar not used */}
          {!searchQuery && (
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-450" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-xs font-semibold focus:outline-none focus:border-[#004b87]"
              />
            </div>
          )}
        </div>

        <Button
          onClick={handleExport}
          className="bg-[#004b87] hover:bg-[#003d70] text-white font-black text-xs h-9 rounded-xl border-none cursor-pointer flex items-center gap-1.5 px-4"
        >
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Summary stats line */}
      <div className="flex gap-4 text-xs font-extrabold text-slate-450">
        <span>Tổng khách: <strong className="text-slate-800">{filtered.length}</strong></span>
        <span className="text-green-650 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Đã lên xe: {boarded}</span>
        <span className="text-amber-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Chưa lên xe: {notBoarded}</span>
      </div>

      {/* Table grid */}
      <Card className="border-slate-100 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/70 text-xs uppercase text-slate-400">
              <TableRow>
                <TableHead className="w-24">Mã vé</TableHead>
                <TableHead>Hành khách</TableHead>
                <TableHead>Số điện thoại</TableHead>
                <TableHead>Ghế ngồi</TableHead>
                <TableHead>Chuyến đi</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} className="hover:bg-slate-50/50 text-xs font-semibold text-slate-650">
                  <TableCell className="font-extrabold text-[#004b87]">#{p.id}</TableCell>
                  <TableCell className="font-extrabold text-slate-800 text-sm">{p.name}</TableCell>
                  <TableCell className="text-slate-550 font-bold">{p.phone}</TableCell>
                  <TableCell>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-extrabold rounded-lg">
                      {p.seat}
                    </span>
                  </TableCell>
                  <TableCell className="font-bold text-slate-700">{p.trip} ({p.time})</TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] font-black border-none ${
                      p.status === 'boarded' ? 'bg-green-50 text-green-700' : 'bg-amber-50/80 text-amber-600'
                    }`}>
                      {p.status === 'boarded' ? '✓ Đã lên xe' : 'Chưa lên xe'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPassenger(p)}
                      className="border-slate-200 text-[#004b87] hover:bg-sky-50/20 text-[10px] font-bold px-2.5 h-7 rounded-lg"
                    >
                      Chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <div className="p-12 text-center text-slate-400 space-y-2 select-none">
              <Info className="h-10 w-10 text-slate-350 mx-auto" />
              <p className="font-bold">Không tìm thấy dữ liệu hành khách nào khớp</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Slide-down Panel */}
      {selectedPassenger && (
        <Card className="border-[#004b87]/30 border-2 bg-gradient-to-br from-white to-slate-50/30 shadow-md">
          <CardHeader className="border-b border-slate-100 py-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-black uppercase text-slate-800 tracking-wider">Thông tin chi tiết hành khách — #{selectedPassenger.id}</CardTitle>
            <button 
              onClick={() => setSelectedPassenger(null)} 
              className="text-slate-400 hover:text-slate-650 bg-transparent border-none cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs font-bold text-slate-650">
              <div className="bg-white p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-extrabold block">HỌ TÊN KHÁCH</span>
                <span className="text-slate-800 text-sm font-black mt-1 block">{selectedPassenger.name}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-extrabold block">SỐ ĐIỆN THOẠI</span>
                <span className="text-slate-700 font-black mt-1 block">{selectedPassenger.phone}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-extrabold block">VỊ TRÍ GHẾ</span>
                <span className="text-[#004b87] text-sm font-black mt-1 block">{selectedPassenger.seat}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-extrabold block">CHUYẾN XE</span>
                <span className="text-slate-700 font-black mt-1 block">{selectedPassenger.trip} ({selectedPassenger.time})</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-extrabold block">TRẠNG THÁI</span>
                <Badge className={`text-[10px] font-black border-none mt-1 ${
                  selectedPassenger.status === 'boarded' ? 'bg-green-50 text-green-700' : 'bg-amber-50/80 text-amber-600'
                }`}>
                  {selectedPassenger.status === 'boarded' ? 'Đã lên xe' : 'Chưa lên xe'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
