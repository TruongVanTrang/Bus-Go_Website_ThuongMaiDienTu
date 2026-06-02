import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Bus, User, Calendar, MapPin, Clock, AlertTriangle, CheckCircle, 
  Search, Bell, LogOut, Menu, Grid, Users, Package, ShieldAlert,
  Play, Check, Truck, Info, ChevronRight, X, Phone, Plus, ListFilter,
  CheckCircle2, RefreshCw, Moon, Sun, ArrowRight, UserCheck, TrendingUp, Camera
} from 'lucide-react'

// Import custom UI components (shadcn/ui style)
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'

// Import utilities & toast services
import { AuthUtil, FormatUtil } from '@/utils/helpers'
import { toast } from '@/utils/toastService'

// Import API services
import { 
  getDriverTripsAPI, 
  updateTripStatusAPI, 
  getTripPassengersAPI, 
  checkInPassengerAPI, 
  getTripCargoAPI, 
  getTruckCargoAPI,
  updateCargoStatusAPI 
} from '@/services/driverService'

export default function DriverDashboard() {
  const navigate = useNavigate()

  // Layout states
  const [isSidebarPinned, setIsSidebarPinned] = useState(true)
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)
  const isSidebarCollapsed = !isSidebarPinned && !isSidebarHovered

  // Active Menu Tab state
  // 1. overview (Tổng quan)
  // 2. trips (Chuyến xe của tôi)
  // 3. passengers (Hành khách)
  // 4. cargo (Hàng hóa)
  // 5. notifications (Thông báo)
  // 6. profile (Hồ sơ cá nhân)
  const [activeTab, setActiveTab] = useState('overview')

  // Search query state
  const [searchQuery, setSearchQuery] = useState('')

  // Shift working status
  const [onShift, setOnShift] = useState(() => AuthUtil.getCurrentUser()?.role === 'TRUCK_DRIVER')

  // Loading skeleton state
  const [isLoading, setIsLoading] = useState(true)

  // Current selected trip for Passenger & Cargo details
  const [selectedTripId, setSelectedTripId] = useState(null)

  // ==================== DATABASE STATES ====================

  // 1. Trips Data (fetched from DB)
  const [trips, setTrips] = useState([])

  // 2. Passengers Data (fetched from DB)
  const [passengers, setPassengers] = useState([])

  // 3. Cargo/Goods Data (fetched from DB)
  const [cargo, setCargo] = useState([])

  // 4. Notifications Data
  const [notifications, setNotifications] = useState([])

  // Dialog State
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [dialogTrip, setDialogTrip] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [incidentType, setIncidentType] = useState('Hỏng xe')
  const [incidentDesc, setIncidentDesc] = useState('')
  const [incidentLoc, setIncidentLoc] = useState('')

  // Fetch functions
  const fetchTrips = async (shouldLoadSilence = false) => {
    if (!shouldLoadSilence) setIsLoading(true)
    try {
      const data = await getDriverTripsAPI()
      setTrips(data || [])
      
      // Auto-select the first trip if not already set or invalid
      if (data && data.length > 0) {
        setSelectedTripId(prev => {
          const exists = data.some(t => t.id === prev)
          return exists ? prev : data[0].id
        })
      } else {
        setSelectedTripId(null)
      }
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Lỗi khi tải danh sách chuyến xe')
    } finally {
      if (!shouldLoadSilence) setIsLoading(false)
    }
  }

  const fetchPassengersAndCargo = async (tripId) => {
    if (!tripId) return
    try {
      const [passengerData, cargoData] = await Promise.all([
        getTripPassengersAPI(tripId),
        getTripCargoAPI(tripId)
      ])
      
      // Update our cache/store for this specific tripId
      setPassengers(prev => {
        const filtered = prev.filter(p => p.tripId !== tripId)
        return [...filtered, ...passengerData]
      })
      setCargo(prev => {
        const filtered = prev.filter(c => c.tripId !== tripId)
        return [...filtered, ...cargoData]
      })
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Lỗi khi tải thông tin hành khách/hàng hóa')
    }
  }

  // Load trips on mount
  useEffect(() => {
    if (currentUser.role === 'TRUCK_DRIVER') {
      const fetchTruckCargo = async () => {
        try {
          const data = await getTruckCargoAPI()
          setCargo(data || [])
        } catch (err) {
          console.error('Lỗi khi lấy đơn vận tải:', err)
        }
      }
      fetchTruckCargo()
    } else {
      fetchTrips()
    }
  }, [])

  // Load passengers and cargo when selected trip changes
  useEffect(() => {
    if (selectedTripId) {
      fetchPassengersAndCargo(selectedTripId)
    }
  }, [selectedTripId])

  const activeTripForCargo = trips.find(t => t.id === selectedTripId)
  const isTripStarted = activeTripForCargo && (activeTripForCargo.status === 'DEPARTED' || activeTripForCargo.status === 'IN_TRANSIT')

  // Handle active tab loading transition
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [activeTab])

  // Get current user (driver information)
  const currentUser = useMemo(() => {
    const user = AuthUtil.getCurrentUser()
    return {
      id: user?.id || '',
      name: user?.name || user?.fullName || 'Tài xế',
      email: user?.email || '',
      phone: user?.phone || '',
      role: user?.role || ''
    }
  }, [])

  // KPI Calculations
  const stats = useMemo(() => {
    const todayTrips = trips.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length
    const runningTrips = trips.filter(t => t.status === 'DEPARTED').length
    const totalPassengers = passengers.filter(p => p.tripId === selectedTripId && p.status !== 'CANCELLED').length
    const pendingCargo = cargo.filter(c => c.status !== 'DELIVERED' && c.status !== 'FAILED').length

    return {
      todayTrips,
      runningTrips,
      totalPassengers,
      pendingCargo
    }
  }, [trips, passengers, cargo, selectedTripId])

  // Get current active/upcoming trip (The highlighted trip)
  const upcomingTrip = useMemo(() => {
    if (!trips || trips.length === 0) return null
    // Find the active running trip first
    const running = trips.find(t => t.status === 'DEPARTED')
    if (running) return running
    // Otherwise find the next scheduled trip
    const scheduled = trips.find(t => t.status === 'SCHEDULED')
    if (scheduled) return scheduled
    // Default to the first trip
    return trips[0]
  }, [trips])

  // Filter passengers based on selected trip & search query
  const filteredPassengers = useMemo(() => {
    return passengers.filter(p => {
      const matchTrip = p.tripId === selectedTripId
      const matchSearch = searchQuery ? (
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone.includes(searchQuery) ||
        p.seat.toLowerCase().includes(searchQuery.toLowerCase())
      ) : true
      return matchTrip && matchSearch
    })
  }, [passengers, selectedTripId, searchQuery])

  // Filter cargo based on selected trip & search query
  const filteredCargo = useMemo(() => {
    return cargo.filter(c => {
      const matchTrip = currentUser.role === 'TRUCK_DRIVER' ? true : c.tripId === selectedTripId
      const matchSearch = searchQuery ? (
        c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.receiver.toLowerCase().includes(searchQuery.toLowerCase())
      ) : true
      return matchTrip && matchSearch
    })
  }, [cargo, selectedTripId, searchQuery, currentUser.role])

  // Filter trips based on search query
  const filteredTrips = useMemo(() => {
    return trips.filter(t => {
      if (!searchQuery) return true
      return (
        t.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.licensePlate.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })
  }, [trips, searchQuery])

  // Handle shift status toggle
  const handleShiftToggle = () => {
    const willStartShift = !onShift
    setOnShift(willStartShift)
    
    if (willStartShift) {
      if (currentUser.role === 'TRUCK_DRIVER') {
        toast.success('Chuyển trạng thái sang: Sẵn sàng nhận đơn!')
      } else {
        toast.success('Bắt đầu ca làm việc thành công! Hệ thống sẵn sàng tiếp nhận lịch trình.')
      }
    } else {
      if (currentUser.role === 'TRUCK_DRIVER') {
        toast.error('Chuyển trạng thái sang: Đang bận.')
      }
    }
  }

  // Handle start trip action
  const handleStartTrip = async (tripId) => {
    if (!onShift) {
      toast.error('Vui lòng kích hoạt "Bắt đầu ca làm" trước khi khởi hành!')
      return
    }

    try {
      await updateTripStatusAPI(tripId, { status: 'DEPARTED' })
      
      const trip = trips.find(t => t.id === tripId)
      const routeStr = trip ? `${trip.from} → ${trip.to}` : ''

      setNotifications(prev => [
        {
          id: Date.now(),
          text: `Hành trình chuyến ${routeStr} đã bắt đầu. Chúc bạn vạn dặm bình an!`,
          time: 'Vừa xong',
          read: false,
          type: 'assign'
        },
        ...prev
      ])

      toast.success('Khởi hành chuyến xe thành công! Trạng thái đã cập nhật thành "Đang khởi hành".')
      fetchTrips(true)
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Lỗi khi khởi hành chuyến xe')
    }
  }

  // Handle open status dialog
  const openStatusDialog = (trip) => {
    setDialogTrip(trip)
    setNewStatus(trip.status)
    setIncidentDesc(trip.incidentDetails?.desc || '')
    setIncidentLoc(trip.incidentDetails?.location || '')
    setIncidentType(trip.incidentDetails?.type || 'Hỏng xe')
    setIsStatusDialogOpen(true)
  }

  // Handle update status save
  const handleUpdateStatus = async () => {
    if (!dialogTrip) return

    try {
      const statusData = {
        status: newStatus,
        incidentType: newStatus === 'INCIDENT' ? incidentType : undefined,
        incidentDesc: newStatus === 'INCIDENT' ? incidentDesc : undefined,
        incidentLoc: newStatus === 'INCIDENT' ? incidentLoc : undefined
      }

      await updateTripStatusAPI(dialogTrip.id, statusData)

      if (newStatus === 'INCIDENT') {
        toast.warning('Đã gửi báo cáo sự cố về tổng đài điều hành! Vui lòng giữ an toàn.')
      } else {
        toast.success('Cập nhật trạng thái chuyến đi thành công!')
      }

      setIsStatusDialogOpen(false)
      fetchTrips(true)
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Lỗi khi cập nhật trạng thái chuyến đi')
    }
  }

  // Handle cargo status actions
  const handleCargoStatusUpdate = async (cargoId, currentStatus, dbId, isConsignment = false, imageFile = null) => {
    let nextStatus = 'PENDING'
    let successMsg = ''

    if (isConsignment) {
      if (currentStatus === 'PENDING') {
        nextStatus = 'APPROVED'
        successMsg = 'Đã duyệt đơn ký gửi. Đang chờ khách thanh toán.'
      } else if (currentStatus === 'APPROVED') {
        nextStatus = 'SHIPPING'
        successMsg = 'Đã nhận hàng ký gửi. Trạng thái chuyển sang "Đang vận chuyển".'
      } else if (currentStatus === 'SHIPPING') {
        nextStatus = 'DELIVERED'
        successMsg = 'Đã giao kiện hàng thành công.'
      }
    } else {
      if (currentStatus === 'PENDING') {
        nextStatus = 'SHIPPING'
        successMsg = 'Đã xác nhận nhận hành lý. Trạng thái chuyển sang "Đang vận chuyển".'
      } else if (currentStatus === 'SHIPPING') {
        nextStatus = 'DELIVERED'
        successMsg = 'Đã bàn giao hành lý cho khách.'
      }
    }

    try {
      await updateCargoStatusAPI(cargoId, nextStatus, imageFile)
      setCargo(prev => 
        prev.map(c => c.id === cargoId ? { ...c, status: nextStatus } : c)
      )
      toast.success(successMsg)
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Lỗi khi cập nhật trạng thái kiện hàng')
    }
  }

  const handleCargoStatusFail = async (cargoId, dbId) => {
    try {
      await updateCargoStatusAPI(cargoId, 'FAILED')
      setCargo(prev => 
        prev.map(c => c.id === cargoId ? { ...c, status: 'FAILED' } : c)
      )
      toast.error('Cập nhật trạng thái kiện hàng giao thất bại.')
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Lỗi khi cập nhật trạng thái kiện hàng')
    }
  }

  // Handle marking notifications as read
  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    toast.success('Đã đánh dấu đọc tất cả thông báo.')
  }

  // Handle logout
  const handleLogout = () => {
    AuthUtil.logout()
    toast.info('Đang đăng xuất...')
    setTimeout(() => {
      navigate('/login')
    }, 500)
  }

  // Sidebar item component
  const SidebarItem = ({ tabId, icon: Icon, label }) => {
    const isActive = activeTab === tabId
    return (
      <button
        onClick={() => {
          setActiveTab(tabId)
          setSearchQuery('')
        }}
        className={`flex items-center w-full rounded-xl px-4 py-3.5 text-sm font-extrabold tracking-wide transition-all group duration-200 border-none ${
          isActive 
            ? 'bg-sky-50 text-[#004b87]' 
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
        }`}
      >
        <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
          <Icon className={`h-5 w-5 ${isActive ? 'text-[#004b87]' : 'text-slate-400 group-hover:text-slate-600'}`} />
        </div>
        {!isSidebarCollapsed && (
          <span 
            className="ml-3 truncate"
          >
            {label}
          </span>
        )}
      </button>
    )
  }

  // Get status details for Trips
  const getTripStatusDetails = (status, incident) => {
    if (incident) return { text: 'Sự cố: ' + incident.type, variant: 'destructive', icon: AlertTriangle }
    switch (status) {
      case 'SCHEDULED': return { text: 'Đã lên lịch', variant: 'info', icon: Clock }
      case 'DEPARTED': return { text: 'Đang khởi hành', variant: 'warning', icon: Truck }
      case 'COMPLETED': return { text: 'Đã hoàn thành', variant: 'success', icon: CheckCircle }
      case 'CANCELLED': return { text: 'Đã hủy', variant: 'destructive', icon: X }
      default: return { text: 'Đã lên lịch', variant: 'info', icon: Clock }
    }
  }

  // Get status details for Tickets
  const getTicketStatusDetails = (status) => {
    switch (status) {
      case 'PAID': return { text: 'Đã thanh toán', variant: 'success' }
      case 'USED': return { text: 'Đã sử dụng', variant: 'secondary' }
      case 'CANCELLED': return { text: 'Đã hủy', variant: 'destructive' }
      default: return { text: 'Đã thanh toán', variant: 'success' }
    }
  }

  // Get status details for Cargo
  const getCargoStatusDetails = (status) => {
    switch (status) {
      case 'PENDING': return { text: 'Chờ xác nhận', variant: 'info' }
      case 'APPROVED': return { text: 'Đã duyệt (Chờ TT)', variant: 'secondary' }
      case 'SHIPPING': return { text: 'Đang vận chuyển', variant: 'warning' }
      case 'DELIVERED': return { text: 'Đã giao', variant: 'success' }
      case 'FAILED': return { text: 'Giao thất bại', variant: 'destructive' }
      case 'CANCELLED': return { text: 'Đã hủy', variant: 'destructive' }
      default: return { text: 'Chờ xác nhận', variant: 'info' }
    }
  }

  // Notification badge counts
  const unreadNotificationsCount = notifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-x-hidden antialiased">
      
      {/* ==================== LEFT SIDEBAR ==================== */}
      <aside
        onMouseEnter={() => !isSidebarPinned && setIsSidebarHovered(true)}
        onMouseLeave={() => !isSidebarPinned && setIsSidebarHovered(false)}
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-slate-100 flex flex-col justify-between py-6 px-4 transition-all duration-300 ${
          isSidebarCollapsed ? 'w-20' : 'w-64 shadow-[10px_0_30px_-15px_rgba(0,0,0,0.03)]'
        }`}
      >
        <div className="space-y-6">
          {/* Driver Info Header (Replacing BusGo logo and name) */}
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between px-2'}`}>
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('profile')}>
              <div className="w-10 h-10 bg-[#004b87] rounded-xl flex items-center justify-center shadow-lg shadow-[#004b87]/20 text-white font-black text-sm uppercase flex-shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              {!isSidebarCollapsed && (
                <div 
                  className="flex flex-col min-w-0"
                >
                  <span className="text-sm font-black text-slate-800 truncate leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                    Tài xế điều hành
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

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <SidebarItem tabId="overview" icon={Grid} label="Tổng quan" />
            {currentUser.role !== 'TRUCK_DRIVER' && (
              <SidebarItem tabId="trips" icon={Calendar} label="Chuyến xe của tôi" />
            )}
            {currentUser.role !== 'TRUCK_DRIVER' && (
              <SidebarItem tabId="passengers" icon={Users} label="Hành khách" />
            )}
            <SidebarItem tabId="cargo" icon={Package} label={currentUser.role === 'TRUCK_DRIVER' ? "Đơn hàng của tôi" : "Hàng hóa đi kèm"} />
            <SidebarItem tabId="profile" icon={User} label="Hồ sơ cá nhân" />
          </nav>
        </div>

        {/* Sidebar Footer (Logout/Collapse Toggle for Collapsed state) */}
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
            onClick={handleLogout}
            className={`flex items-center rounded-xl px-4 py-3.5 text-sm font-extrabold text-red-500 hover:bg-red-50 w-full transition-all border-none bg-transparent cursor-pointer`}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!isSidebarCollapsed && (
              <span
                className="ml-3"
              >
                Đăng xuất
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* ==================== MAIN CONTENT WRAPPER ==================== */}
      <div 
        className="flex-1 flex flex-col transition-all duration-300"
        style={{ paddingLeft: isSidebarCollapsed ? '80px' : '260px' }}
      >
        
        {/* ==================== TOPBAR ==================== */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 h-16 flex items-center justify-between px-6 md:px-8">
          
          {/* Search bar or section title */}
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm nhanh chuyến xe, hành khách..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

          {/* Right Topbar actions */}
          <div className="flex items-center gap-4">
            
            {/* Notification Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger>
                <button className="relative p-2.5 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-full border-none bg-transparent cursor-pointer transition-colors">
                  <Bell className="h-5 w-5" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 flex items-center justify-center text-[10px] font-black text-white bg-red-500 rounded-full border border-white">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="right" className="w-80 max-h-[420px] overflow-y-auto">
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-800">Thông báo mới</span>
                  {unreadNotificationsCount > 0 && (
                    <button 
                      onClick={markAllNotificationsAsRead}
                      className="text-xs text-[#004b87] hover:underline font-bold bg-transparent border-none cursor-pointer"
                    >
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>
                <div className="p-1">
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <DropdownMenuItem 
                        key={n.id} 
                        className={`flex flex-col items-start gap-1 p-3 rounded-xl transition-all ${!n.read ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50'}`}
                        onClick={() => {
                          setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif))
                        }}
                      >
                        <div className="flex gap-2.5 items-start">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? 'bg-[#004b87]' : 'bg-transparent'}`} />
                          <p className={`text-xs ${!n.read ? 'font-black text-slate-800' : 'font-medium text-slate-500'}`}>{n.text}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold ml-4.5">{n.time}</span>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-400 text-xs font-bold">Không có thông báo mới nào</div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>



          </div>
        </header>

        {/* ==================== CONTENT BODY ==================== */}
        <main className="flex-1 p-6 md:p-8 space-y-8">

          {/* ==================== SKELETON LOADER ==================== */}
          {isLoading ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-32 bg-slate-200 rounded-2xl w-full" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-72 bg-slate-200 rounded-2xl" />
                <div className="h-72 bg-slate-200 rounded-2xl" />
              </div>
            </div>
          ) : (
            <div>
              <div
                key={activeTab}
                className="space-y-8"
              >

                {/* ==================== TAB: OVERVIEW (TỔNG QUAN) ==================== */}
                {activeTab === 'overview' && (
                  <>
                    {/* Welcome Banner */}
                    <Card className="border-none bg-gradient-to-r from-[#004b87] to-sky-700 text-white relative overflow-hidden shadow-lg shadow-[#004b87]/15">
                      <div className="absolute top-[-50%] right-[-10%] w-96 h-96 bg-white/5 rounded-full blur-[80px]" />
                      <div className="absolute bottom-[-40%] left-[20%] w-60 h-60 bg-sky-400/10 rounded-full blur-[60px]" />
                      
                      <CardContent className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div className="space-y-2">
                          <span className="text-sky-200 text-xs font-black tracking-widest uppercase">Trang quản trị tài xế</span>
                          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Xin chào, {currentUser.name}</h1>
                          <p className="text-sky-100 text-sm font-semibold flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            {FormatUtil.formatDate(new Date())} — Ca vận hành của bạn đang hoạt động
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between gap-4 bg-white/10 backdrop-blur-md p-3.5 px-5 rounded-2xl border border-white/10 shadow-inner w-full md:w-auto">
                          <div className="text-left md:text-right">
                            <p className="text-[10px] font-black text-sky-200 uppercase tracking-wider">Trạng thái làm việc</p>
                            <span className="text-sm font-extrabold flex items-center gap-2 mt-0.5 md:justify-end">
                              <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${onShift ? 'bg-green-400' : 'bg-slate-450'}`} />
                              {currentUser.role === 'TRUCK_DRIVER'
                                ? (onShift ? 'Rảnh (Sẵn sàng)' : 'Đang bận')
                                : (onShift ? 'Đang hoạt động' : 'Nghỉ ca')
                              }
                            </span>
                          </div>
                          
                          <Button
                            variant={onShift ? (currentUser.role === 'TRUCK_DRIVER' ? 'default' : 'destructive') : 'outline'}
                            onClick={handleShiftToggle}
                            className={`rounded-xl px-5 h-10 text-xs font-black shadow-none border-none ${
                              onShift 
                                ? (currentUser.role === 'TRUCK_DRIVER' ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white')
                                : 'bg-white hover:bg-slate-50 text-[#004b87]'
                            }`}
                          >
                            {currentUser.role === 'TRUCK_DRIVER'
                              ? (onShift ? 'Chuyển sang Bận' : 'Chuyển sang Rảnh')
                              : (onShift ? 'Kết thúc ca' : 'Bắt đầu ca làm')
                            }
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {(currentUser.role === 'TRUCK_DRIVER' || onShift) ? (
                      <>
                        {/* KPI Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                          {/* Chuyến hôm nay */}
                          <Card className="hover:shadow-md border-slate-100/80 transition-shadow">
                            <CardContent className="p-6 flex items-center justify-between">
                              <div className="space-y-1">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chuyến hôm nay</span>
                                <h3 className="text-2xl font-black text-slate-800">{stats.todayTrips} Chuyến</h3>
                                <p className="text-xs font-semibold text-slate-400 flex items-center gap-1 mt-1">
                                  <TrendingUp className="h-3 w-3 text-green-500" />
                                  Lịch trình cố định
                                </p>
                              </div>
                              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#004b87] flex items-center justify-center">
                                <Calendar className="h-6 w-6" />
                              </div>
                            </CardContent>
                          </Card>

                          {/* Chuyến đang chạy */}
                          <Card className="hover:shadow-md border-slate-100/80 transition-shadow">
                            <CardContent className="p-6 flex items-center justify-between">
                              <div className="space-y-1">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chuyến đang chạy</span>
                                <h3 className="text-2xl font-black text-slate-800">{stats.runningTrips} Chuyến</h3>
                                <p className="text-xs font-semibold text-slate-400 flex items-center gap-1 mt-1">
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                                  </span>
                                  Đang di chuyển trên tuyến
                                </p>
                              </div>
                              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center animate-pulse">
                                <Truck className="h-6 w-6" />
                              </div>
                            </CardContent>
                          </Card>

                          {/* Tổng hành khách - HIDE FOR TRUCK DRIVER */}
                          {currentUser.role !== 'TRUCK_DRIVER' && (
                            <Card className="hover:shadow-md border-slate-100/80 transition-shadow">
                              <CardContent className="p-6 flex items-center justify-between">
                                <div className="space-y-1">
                                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Khách chuyến chọn</span>
                                  <h3 className="text-2xl font-black text-slate-800">{stats.totalPassengers} Khách</h3>
                                  <p className="text-xs font-semibold text-slate-400 flex items-center gap-1 mt-1">
                                    {upcomingTrip ? `Chọn tuyến ${upcomingTrip.from} → ${upcomingTrip.to}` : 'Chưa chọn chuyến'}
                                  </p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
                                  <Users className="h-6 w-6" />
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Hàng hóa cần giao */}
                          <Card className="hover:shadow-md border-slate-100/80 transition-shadow">
                            <CardContent className="p-6 flex items-center justify-between">
                              <div className="space-y-1">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                  {currentUser.role === 'TRUCK_DRIVER' ? 'Đơn vận tải' : 'Hàng hóa cần giao'}
                                </span>
                                <h3 className="text-2xl font-black text-slate-800">{stats.pendingCargo} Kiện</h3>
                                <p className="text-xs font-semibold text-slate-400 flex items-center gap-1 mt-1">
                                  Chờ xác nhận & vận chuyển
                                </p>
                              </div>
                              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                                <Package className="h-6 w-6" />
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Featured Trip Highlight & List */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          
                          {/* Upcoming Highlight Card */}
                          <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-center justify-between">
                              <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                                <Clock className="h-5 w-5 text-[#004b87]" />
                                Chuyến xe sắp khởi hành (Gần nhất)
                              </h2>
                              <Button variant="link" size="sm" onClick={() => setActiveTab('trips')} className="font-extrabold text-xs">
                                Xem tất cả chuyến <ChevronRight className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            {upcomingTrip ? (
                              <Card className="border-[#004b87]/30 border-2 shadow-md relative overflow-hidden bg-white/70">
                                <div className="absolute top-0 right-0 bg-[#004b87] text-white text-[10px] font-black uppercase tracking-wider py-1 px-4 rounded-bl-xl">
                                  Khuyên chạy
                                </div>
                                <CardContent className="p-6 space-y-6">
                                  
                                  {/* Route details */}
                                  <div className="flex items-center gap-4 justify-between">
                                    <div className="space-y-1 flex-1">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hành trình</span>
                                      <div className="flex items-center gap-2.5">
                                        <span className="text-lg font-black text-slate-800">{upcomingTrip.from}</span>
                                        <ArrowRight className="h-4 w-4 text-[#004b87] flex-shrink-0" />
                                        <span className="text-lg font-black text-slate-800">{upcomingTrip.to}</span>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái</span>
                                      <div>
                                        <Badge variant={getTripStatusDetails(upcomingTrip.status, upcomingTrip.incidentDetails).variant} className="mt-1 font-extrabold">
                                          {getTripStatusDetails(upcomingTrip.status, upcomingTrip.incidentDetails).text}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="h-px bg-slate-100" />

                                  {/* Info grid */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock className="h-3 w-3" /> Giờ đi</span>
                                      <p className="text-sm font-extrabold text-slate-700">{upcomingTrip.departureTime}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock className="h-3 w-3" /> Giờ đến</span>
                                      <p className="text-sm font-extrabold text-slate-700">{upcomingTrip.arrivalTime}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Bus className="h-3 w-3" /> Xe & Biển số</span>
                                      <p className="text-sm font-extrabold text-slate-700">{upcomingTrip.licensePlate} ({upcomingTrip.maxPassengers} chỗ)</p>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Users className="h-3 w-3" /> Số khách</span>
                                      <p className="text-sm font-extrabold text-slate-700">{upcomingTrip.passengerCount}/{upcomingTrip.maxPassengers} người</p>
                                    </div>
                                  </div>

                                  <div className="h-px bg-slate-100" />

                                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                                    <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
                                      <Info className="h-4 w-4 text-sky-600 flex-shrink-0" />
                                      Vui lòng làm thủ tục check-in cho khách trước giờ khởi hành 15 phút.
                                    </div>
                                    <div className="flex gap-2.5 w-full sm:w-auto">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setSelectedTripId(upcomingTrip.id)
                                          setActiveTab('passengers')
                                        }}
                                        className="flex-1 sm:flex-none border-[#004b87]/30 text-[#004b87] hover:bg-[#004b87]/5"
                                      >
                                        Xem chi tiết
                                      </Button>
                                      {upcomingTrip.status === 'SCHEDULED' ? (
                                        <Button 
                                          variant="default" 
                                          size="sm"
                                          onClick={() => handleStartTrip(upcomingTrip.id)}
                                          className="flex-1 sm:flex-none bg-[#004b87] hover:bg-[#003c6c]"
                                        >
                                          <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
                                          Bắt đầu chuyến
                                        </Button>
                                      ) : (
                                        <Button 
                                          variant="outline"
                                          size="sm"
                                          disabled
                                          className="flex-1 sm:flex-none bg-slate-50 border-slate-200 text-slate-400"
                                        >
                                          Đang khởi hành
                                        </Button>
                                      )}
                                    </div>
                                  </div>

                                </CardContent>
                              </Card>
                            ) : (
                              <Card className="border-slate-100">
                                <CardContent className="p-12 text-center text-slate-400 space-y-2">
                                  <Info className="h-10 w-10 text-slate-350 mx-auto" />
                                  <p className="font-extrabold text-sm">Chưa có chuyến xe nào được chỉ định cho hôm nay</p>
                                </CardContent>
                              </Card>
                            )}
                          </div>

                          {/* Right Panel: Working Guidelines / Quick contacts */}
                          <div className="space-y-4">
                            <h2 className="text-base font-black text-slate-800">
                              Quy trình vận hành an toàn
                            </h2>
                            <Card className="border-slate-100/80">
                              <CardContent className="p-5 space-y-4">
                                <ul className="space-y-3 text-xs text-slate-600 font-semibold">
                                  <li className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-blue-50 text-[#004b87] flex items-center justify-center flex-shrink-0 text-[10px] font-black">1</span>
                                    <span>Kiểm tra phương tiện kỹ thuật và nhiên liệu trước khi xuất phát.</span>
                                  </li>
                                  <li className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-blue-50 text-[#004b87] flex items-center justify-center flex-shrink-0 text-[10px] font-black">2</span>
                                    <span>Mở điều hòa và dọn dẹp vệ sinh buồng lái & khoang hành khách.</span>
                                  </li>
                                  <li className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-blue-50 text-[#004b87] flex items-center justify-center flex-shrink-0 text-[10px] font-black">3</span>
                                    <span>Soát vé và kiểm tra hành lý/hàng hóa đi kèm trước khi lên xe.</span>
                                  </li>
                                  <li className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-blue-50 text-[#004b87] flex items-center justify-center flex-shrink-0 text-[10px] font-black">4</span>
                                    <span>Cập nhật trạng thái hành trình đầy đủ trên hệ thống ứng dụng.</span>
                                  </li>
                                </ul>
                                
                                <div className="h-px bg-slate-100" />
                                
                                <div className="space-y-2">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Hỗ trợ khẩn cấp 24/7</p>
                                  <div className="flex gap-2">
                                    <a 
                                      href="tel:19001234" 
                                      className="flex items-center justify-center gap-1.5 bg-red-50 text-red-600 border border-red-100 p-2.5 rounded-xl font-black text-xs hover:bg-red-100 transition-colors w-full text-center"
                                    >
                                      <Phone className="h-3.5 w-3.5" /> Gọi Tổng Đài
                                    </a>
                                    <a 
                                      href="tel:0999999999" 
                                      className="flex items-center justify-center gap-1.5 bg-slate-50 text-slate-700 border border-slate-200 p-2.5 rounded-xl font-black text-xs hover:bg-slate-100 transition-colors w-full text-center"
                                    >
                                      Kỹ Thuật Viên
                                    </a>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </>
                    ) : (
                      <Card className="border-slate-100 bg-slate-50/50">
                        <CardContent className="p-12 text-center text-slate-400 space-y-3">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-350">
                            <Clock className="h-8 w-8 text-slate-400" />
                          </div>
                          <h3 className="text-base font-extrabold text-[#004b87]">Ca làm việc của bạn đang đóng</h3>
                          <p className="text-xs font-semibold text-slate-500 max-w-sm mx-auto">Vui lòng nhấn nút "Bắt đầu ca làm" phía trên để mở ca hoạt động, tiếp nhận và quản lý lịch trình chạy xe hôm nay.</p>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}


                {/* ==================== TAB: TRIPS (CHUYẾN XE CỦA TÔI) ==================== */}
                {activeTab === 'trips' && (
                  onShift ? (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h1 className="text-2xl font-black text-slate-800">Lịch trình chuyến xe hôm nay</h1>
                          <p className="text-slate-400 text-xs font-semibold mt-1">Danh sách các chuyến xe được chỉ định chạy trong ngày của bạn</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              toast.info('Đang cập nhật danh sách chuyến từ hệ thống...')
                              fetchTrips()
                            }}
                            className="border-slate-200 bg-white"
                          >
                            <RefreshCw className="h-4 w-4 mr-1.5" />
                            Làm mới
                          </Button>
                        </div>
                      </div>

                      <Card className="border-slate-100">
                        <CardContent className="p-0">
                          {filteredTrips.length > 0 ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Giờ chạy</TableHead>
                                  <TableHead>Tuyến đường</TableHead>
                                  <TableHead>Biển số xe</TableHead>
                                  <TableHead>Loại xe</TableHead>
                                  <TableHead>Hành khách</TableHead>
                                  <TableHead>Trạng thái</TableHead>
                                  <TableHead className="text-right">Hành động</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredTrips.map(trip => {
                                  const statusInfo = getTripStatusDetails(trip.status, trip.incidentDetails)
                                  return (
                                    <TableRow key={trip.id} className={trip.id === selectedTripId ? 'bg-blue-50/20 hover:bg-blue-50/30' : ''}>
                                      <TableCell>
                                        <div className="font-extrabold text-slate-800">{trip.departureTime}</div>
                                        <div className="text-[10px] text-slate-400 font-bold">Đến: {trip.arrivalTime}</div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="font-extrabold text-slate-800 flex items-center gap-1.5">
                                          {trip.from}
                                          <ArrowRight className="h-3 w-3 text-[#004b87]" />
                                          {trip.to}
                                        </div>
                                      </TableCell>
                                      <TableCell className="font-extrabold text-slate-700">{trip.licensePlate}</TableCell>
                                      <TableCell className="text-slate-550 font-semibold">{trip.busType}</TableCell>
                                      <TableCell>
                                        <div className="font-extrabold text-slate-700">{trip.passengerCount}/{trip.maxPassengers}</div>
                                        <div className="w-20 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                          <div 
                                            className="bg-[#004b87] h-full"
                                            style={{ width: `${(trip.passengerCount / trip.maxPassengers) * 100}%` }}
                                          />
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant={statusInfo.variant} className="font-extrabold">
                                          {React.createElement(statusInfo.icon, { className: 'h-3 w-3 mr-1 flex-shrink-0' })}
                                          {statusInfo.text}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              setSelectedTripId(trip.id)
                                              setActiveTab('passengers')
                                              toast.info(`Đã chọn chi tiết chuyến ${trip.from} → ${trip.to}`)
                                            }}
                                            className="border-slate-200 text-[#004b87] hover:bg-blue-50/50"
                                          >
                                            Hành khách
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              setSelectedTripId(trip.id)
                                              setActiveTab('cargo')
                                              toast.info(`Đã chọn chi tiết hàng hóa chuyến ${trip.from} → ${trip.to}`)
                                            }}
                                            className="border-slate-200 text-sky-600 hover:bg-sky-50/50"
                                          >
                                            Hàng hóa
                                          </Button>
                                          <Button
                                            variant="default"
                                            size="sm"
                                            onClick={() => openStatusDialog(trip)}
                                            className="bg-[#004b87] hover:bg-[#003d70]"
                                          >
                                            Cập nhật
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                              </TableBody>
                            </Table>
                          ) : (
                            <div className="p-12 text-center text-slate-400 space-y-2">
                              <Info className="h-10 w-10 text-slate-300 mx-auto" />
                              <p className="font-extrabold text-sm">Không tìm thấy chuyến xe nào tương thích</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <Card className="border-slate-100 bg-slate-50/50">
                      <CardContent className="p-12 text-center text-slate-400 space-y-3">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-350">
                          <Clock className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-base font-extrabold text-[#004b87]">Ca làm việc của bạn đang đóng</h3>
                        <p className="text-xs font-semibold text-slate-500 max-w-sm mx-auto">Vui lòng quay lại tab "Tổng quan" và nhấn nút "Bắt đầu ca làm" để xem lịch trình chuyến xe hôm nay.</p>
                      </CardContent>
                    </Card>
                  )
                )}


                {/* ==================== TAB: PASSENGERS (HÀNH KHÁCH) ==================== */}
                {activeTab === 'passengers' && (
                  onShift ? (
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h1 className="text-2xl font-black text-slate-800">Danh sách hành khách đi xe</h1>
                          <p className="text-slate-400 text-xs font-semibold mt-1">Danh sách soát vé hành khách trên xe chi tiết theo chuyến</p>
                        </div>

                        {/* Select trip filter */}
                        <div className="flex gap-2.5 flex-wrap items-center">
                          <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Chuyến chọn:</span>
                          <select 
                            value={selectedTripId || ''} 
                            onChange={(e) => {
                              const val = e.target.value ? Number(e.target.value) : null
                              setSelectedTripId(val)
                              if (val) {
                                toast.info(`Đã chuyển sang xem hành khách chuyến đi số ${val}`)
                              }
                            }}
                            className="border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#004b87] focus:ring-4 focus:ring-[#004b87]/5"
                          >
                            <option value="">-- Chọn chuyến xe --</option>
                            {trips.map(t => (
                              <option key={t.id} value={t.id}>
                                [{t.date} - {t.departureTime}] {t.from} → {t.to} ({t.licensePlate})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <Card className="border-slate-100">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 p-6 bg-slate-50/20">
                          <div>
                            <CardTitle className="text-sm font-black">
                              Thông tin hành khách: {trips.find(t => t.id === selectedTripId) ? `${trips.find(t => t.id === selectedTripId).from} → ${trips.find(t => t.id === selectedTripId).to}` : 'Chưa chọn chuyến'}
                            </CardTitle>
                            <CardDescription className="text-xs font-semibold mt-1">Tổng cộng có {filteredPassengers.length} hành khách khớp điều kiện</CardDescription>
                          </div>
                          <Badge variant="outline" className="border-slate-200 font-extrabold text-[#004b87]">
                            Sĩ số: {trips.find(t => t.id === selectedTripId) ? `${trips.find(t => t.id === selectedTripId).passengerCount} / ${trips.find(t => t.id === selectedTripId).maxPassengers}` : '0 / 0'} Ghế
                          </Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                          {filteredPassengers.length > 0 ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-20">Số ghế</TableHead>
                                  <TableHead>Họ và tên</TableHead>
                                  <TableHead>Số điện thoại</TableHead>
                                  <TableHead>Điểm đón khách</TableHead>
                                  <TableHead>Điểm trả khách</TableHead>
                                  <TableHead>Trạng thái vé</TableHead>
                                  <TableHead className="text-right">Check-in</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredPassengers.map(passenger => {
                                  const ticketStatus = getTicketStatusDetails(passenger.status)
                                  return (
                                    <TableRow key={passenger.id}>
                                      <TableCell className="font-black text-slate-800 text-sm">
                                        <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700">
                                          {passenger.seat}
                                        </span>
                                      </TableCell>
                                      <TableCell className="font-extrabold text-slate-800">{passenger.name}</TableCell>
                                      <TableCell className="text-slate-600 font-semibold">{passenger.phone}</TableCell>
                                      <TableCell className="text-slate-600 font-semibold flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                                        {passenger.pickup}
                                      </TableCell>
                                      <TableCell className="text-slate-600 font-semibold">
                                        {passenger.dropoff}
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant={ticketStatus.variant} className="font-extrabold">
                                          {ticketStatus.text}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {passenger.status === 'PAID' ? (
                                          <Button
                                            variant="default"
                                            size="sm"
                                            onClick={async () => {
                                              try {
                                                await checkInPassengerAPI(passenger.id)
                                                setPassengers(prev => 
                                                  prev.map(p => p.id === passenger.id ? { ...p, status: 'USED' } : p)
                                                )
                                                toast.success(`Đã check-in soát vé thành công cho hành khách ${passenger.name}`)
                                              } catch (err) {
                                                console.error(err)
                                                toast.error(err.message || 'Lỗi khi soát vé hành khách')
                                              }
                                            }}
                                            className="bg-green-600 hover:bg-green-700 text-white shadow-none h-8 px-2.5 rounded-lg"
                                          >
                                            <UserCheck className="h-3.5 w-3.5 mr-1" />
                                            Soát vé
                                          </Button>
                                        ) : passenger.status === 'USED' ? (
                                          <span className="text-xs text-green-600 font-black flex items-center justify-end gap-1">
                                            <Check className="h-4 w-4" /> Đã lên xe
                                          </span>
                                        ) : (
                                          <span className="text-xs text-slate-400 font-semibold">Không khả dụng</span>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                              </TableBody>
                            </Table>
                          ) : (
                            <div className="p-12 text-center text-slate-450 space-y-2">
                              <Info className="h-10 w-10 text-slate-300 mx-auto" />
                              <p className="font-extrabold text-sm text-slate-400">Không tìm thấy hành khách nào phù hợp</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <Card className="border-slate-100 bg-slate-50/50">
                      <CardContent className="p-12 text-center text-slate-400 space-y-3">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-350">
                          <Clock className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-base font-extrabold text-[#004b87]">Ca làm việc của bạn đang đóng</h3>
                        <p className="text-xs font-semibold text-slate-500 max-w-sm mx-auto">Vui lòng quay lại tab "Tổng quan" và nhấn nút "Bắt đầu ca làm" để quản lý soát vé hành khách.</p>
                      </CardContent>
                    </Card>
                  )
                )}


                {/* ==================== TAB: CARGO (HÀNG HÓA ĐI KÈM) ==================== */}
                {activeTab === 'cargo' && (
                  (currentUser.role === 'TRUCK_DRIVER' || onShift) ? (
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h1 className="text-2xl font-black text-slate-800">
                            {currentUser.role === 'TRUCK_DRIVER' ? 'Quản lý đơn hàng vận tải' : 'Quản lý hàng hóa gửi theo chuyến'}
                          </h1>
                          <p className="text-slate-400 text-xs font-semibold mt-1">
                            {currentUser.role === 'TRUCK_DRIVER' ? 'Tiếp nhận đơn hàng vận tải, cập nhật trạng thái lấy/giao hàng' : 'Quản lý việc nhận hàng gửi ký gửi, cập nhật hành trình vận chuyển hàng hóa ký gửi'}
                          </p>
                        </div>

                        {/* Select trip filter - HIDE FOR TRUCK DRIVER */}
                        {currentUser.role !== 'TRUCK_DRIVER' && (
                          <div className="flex gap-2.5 flex-wrap items-center">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Chuyến chọn:</span>
                            <select 
                              value={selectedTripId || ''} 
                              onChange={(e) => setSelectedTripId(e.target.value ? Number(e.target.value) : null)}
                              className="border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#004b87]"
                            >
                              <option value="">-- Chọn chuyến xe --</option>
                              {trips.map(t => (
                                <option key={t.id} value={t.id}>
                                  [{t.date} - {t.departureTime}] {t.from} → {t.to} ({t.licensePlate})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      <Card className="border-slate-100">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 p-6 bg-slate-50/20">
                          <div>
                            <CardTitle className="text-sm font-black">
                              {currentUser.role === 'TRUCK_DRIVER' 
                                ? 'Thông tin đơn hàng nguyên chuyến'
                                : `Thông tin kiện hàng ký gửi: ${trips.find(t => t.id === selectedTripId) ? `${trips.find(t => t.id === selectedTripId).from} → ${trips.find(t => t.id === selectedTripId).to}` : 'Chưa chọn chuyến'}`
                              }
                            </CardTitle>
                            <CardDescription className="text-xs font-semibold mt-1">Tổng cộng có {filteredCargo.length} kiện hàng đang quản lý</CardDescription>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          {filteredCargo.length > 0 ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Mã hàng</TableHead>
                                  <TableHead>Loại hàng hóa</TableHead>
                                  <TableHead>Người gửi</TableHead>
                                  <TableHead>Người nhận & SĐT</TableHead>
                                  <TableHead>Trạng thái</TableHead>
                                  <TableHead className="text-right">Cập nhật hành trình hàng</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredCargo.map(item => {
                                  const cargoStatus = getCargoStatusDetails(item.status)
                                  return (
                                    <TableRow key={item.id}>
                                      <TableCell className="font-black text-slate-800 text-sm">{item.id}</TableCell>
                                      <TableCell className="font-extrabold text-slate-850">{item.type}</TableCell>
                                      <TableCell className="text-slate-550 font-semibold text-xs">{item.sender}</TableCell>
                                      <TableCell>
                                        <div className="font-extrabold text-slate-800">{item.receiver}</div>
                                        <div className="text-xs text-slate-550 font-semibold mt-0.5">{item.phone}</div>
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant={cargoStatus.variant} className="font-extrabold">
                                          {cargoStatus.text}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex justify-end gap-1.5 flex-wrap">
                                          {item.status === 'PENDING' && (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleCargoStatusUpdate(item.id, 'PENDING', item.dbId, item.isConsignment)}
                                              className="border-blue-200 text-[#004b87] hover:bg-blue-50/50 h-8 text-xs px-2.5 rounded-lg"
                                            >
                                              <Check className="h-3.5 w-3.5 mr-1" />
                                              {item.isConsignment ? 'Duyệt đơn' : 'Nhận hàng'}
                                            </Button>
                                          )}
                                          
                                          {item.status === 'APPROVED' && item.isConsignment && (
                                            item.paymentStatus === 'paid' ? (
                                              (currentUser.role === 'TRUCK_DRIVER' || (onShift && isTripStarted)) ? (
                                                <div className="flex flex-col items-end gap-1 w-full">
                                                  <span className="text-[10px] text-amber-600 font-bold block w-full text-right">Chờ đến nhận</span>
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                      const fakeImage = prompt("Nhập URL hình ảnh xác nhận nhận hàng:", "https://example.com/pickup.jpg");
                                                      if (fakeImage) {
                                                        handleCargoStatusUpdate(item.id, 'APPROVED', item.dbId, true, fakeImage);
                                                      }
                                                    }}
                                                    className="border-amber-200 text-amber-700 hover:bg-amber-50 h-8 text-xs px-2.5 rounded-lg"
                                                  >
                                                    <Camera className="h-3.5 w-3.5 mr-1" />
                                                    Đã nhận
                                                  </Button>
                                                </div>
                                              ) : (
                                                <span className="text-[10px] text-slate-500 font-bold block w-full text-right">{currentUser.role === 'TRUCK_DRIVER' ? 'Đã thanh toán (Sẵn sàng nhận hàng)' : 'Đã thanh toán (Chờ xuất phát)'}</span>
                                              )
                                            ) : (
                                              <span className="text-[10px] text-slate-500 font-bold italic mt-1 text-right block w-full">Chờ KH thanh toán</span>
                                            )
                                          )}

                                          {item.status === 'SHIPPING' && (
                                            <>
                                              <Button
                                                variant="default"
                                                size="sm"
                                                onClick={() => {
                                                  if (item.isConsignment) {
                                                    const fakeImage = prompt("Nhập URL hình ảnh xác nhận giao hàng:", "https://example.com/dropoff.jpg");
                                                    if (fakeImage) handleCargoStatusUpdate(item.id, 'SHIPPING', item.dbId, item.isConsignment, fakeImage);
                                                  } else {
                                                    handleCargoStatusUpdate(item.id, 'SHIPPING', item.dbId, false);
                                                  }
                                                }}
                                                className="bg-[#004b87] hover:bg-[#003d70] h-8 text-xs px-2.5 rounded-lg border-none"
                                              >
                                                {item.isConsignment ? <Camera className="h-3.5 w-3.5 mr-1" /> : <Truck className="h-3.5 w-3.5 mr-1" />}
                                                {item.isConsignment ? 'Chụp ảnh giao' : 'Đã giao'}
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleCargoStatusFail(item.id, item.dbId)}
                                                className="border-red-200 text-red-600 hover:bg-red-50 h-8 text-xs px-2.5 rounded-lg"
                                              >
                                                <X className="h-3.5 w-3.5 mr-1" />
                                                Thất bại
                                              </Button>
                                            </>
                                          )}
                                          {item.status === 'DELIVERED' && (
                                            <span className="text-xs text-green-600 font-black flex items-center justify-end gap-1 py-1">
                                              <CheckCircle className="h-4 w-4" /> Bàn giao xong
                                            </span>
                                          )}
                                          {item.status === 'FAILED' && (
                                            <span className="text-xs text-red-500 font-black flex items-center justify-end gap-1 py-1">
                                              <AlertTriangle className="h-4 w-4" /> Giao thất bại
                                            </span>
                                          )}
                                          {item.status === 'CANCELLED' && (
                                            <span className="text-xs text-slate-500 font-black flex items-center justify-end gap-1 py-1">
                                              <X className="h-4 w-4" /> Khách hủy đơn
                                            </span>
                                          )}
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                              </TableBody>
                            </Table>
                          ) : (
                            <div className="p-12 text-center text-slate-400 space-y-2">
                              <Info className="h-10 w-10 text-slate-300 mx-auto" />
                              <p className="font-extrabold text-sm">Chưa có thông tin kiện hàng nào được ký gửi chuyến này</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <Card className="border-slate-100 bg-slate-50/50">
                      <CardContent className="p-12 text-center text-slate-400 space-y-3">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-350">
                          <Clock className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-base font-extrabold text-[#004b87]">
                          {currentUser.role === 'TRUCK_DRIVER' ? 'Chưa có dữ liệu' : 'Ca làm việc của bạn đang đóng'}
                        </h3>
                        <p className="text-xs font-semibold text-slate-500 max-w-sm mx-auto">
                          {currentUser.role === 'TRUCK_DRIVER' ? 'Vui lòng kiểm tra lại sau.' : 'Vui lòng quay lại tab "Tổng quan" và nhấn nút "Bắt đầu ca làm" để quản lý hàng hóa ký gửi.'}
                        </p>
                      </CardContent>
                    </Card>
                  )
                )}


                {/* ==================== TAB: NOTIFICATIONS (THÔNG BÁO CHUYÊN BIỆT) ==================== */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <h1 className="text-2xl font-black text-slate-800">Trung tâm thông báo</h1>
                        <p className="text-slate-400 text-xs font-semibold mt-1">Thông tin điều phối lịch trình, tin tức vận hành từ Ban điều hành BusGo</p>
                      </div>
                      {unreadNotificationsCount > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={markAllNotificationsAsRead}
                          className="border-slate-200 bg-white font-extrabold"
                        >
                          Đánh dấu đã đọc tất cả
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3.5">
                      {notifications.map(n => (
                        <Card 
                          key={n.id} 
                          className={`hover:shadow-sm transition-all border-l-4 ${
                            !n.read 
                              ? 'border-l-[#004b87] bg-white' 
                              : 'border-l-slate-350 bg-white/70'
                          }`}
                        >
                          <CardContent className="p-5 flex items-start gap-4 justify-between">
                            <div className="space-y-1">
                              <p className={`text-sm ${!n.read ? 'font-black text-slate-850' : 'font-semibold text-slate-600'}`}>{n.text}</p>
                              <span className="text-[10px] text-slate-400 font-bold block">{n.time}</span>
                            </div>
                            
                            {!n.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif))
                                  toast.success('Đã đọc thông báo')
                                }}
                                className="h-8 text-xs font-bold text-slate-400 hover:text-[#004b87]"
                              >
                                Đánh dấu đọc
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}


                {/* ==================== TAB: PROFILE (HỒ SƠ CÁ NHÂN) ==================== */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-black text-slate-800">Hồ sơ cá nhân</h1>
                      <p className="text-slate-400 text-xs font-semibold mt-1">Thông tin chi tiết tài xế vận hành BusGo</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Left card: avatar and main details */}
                      <Card className="border-slate-100">
                        <CardContent className="p-6 text-center space-y-6">
                          <div className="relative w-28 h-28 mx-auto">
                            <div className="w-full h-full rounded-full bg-[#004b87] text-white flex items-center justify-center font-black text-4xl shadow-lg border-4 border-slate-100">
                              {currentUser.name.charAt(0)}
                            </div>
                            <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-white flex items-center justify-center" title="Đang online">
                              <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <h2 className="text-lg font-black text-slate-800">{currentUser.name}</h2>
                            <Badge variant="outline" className="border-slate-200 text-[#004b87] font-extrabold">Mã tài xế: DRV-{currentUser.id || 'N/A'}</Badge>
                          </div>

                          <div className="h-px bg-slate-100" />

                          <div className="text-left space-y-3.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-450 font-bold">Chức vụ:</span>
                              <span className="text-slate-700 font-extrabold">
                                {currentUser.role === 'DRIVER' ? 'Tài xế vận hành' : currentUser.role || 'Tài xế'}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Right card: detailed settings & updates */}
                      <div className="lg:col-span-2 space-y-6">
                        <Card className="border-slate-100">
                          <CardHeader className="border-b border-slate-100 p-6">
                            <CardTitle className="text-sm font-black">Thông tin liên lạc & Cá nhân</CardTitle>
                          </CardHeader>
                          <CardContent className="p-6 space-y-5">
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-450 uppercase">Họ và tên</label>
                                <input 
                                  type="text" 
                                  value={currentUser.name} 
                                  disabled
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-500 font-semibold text-sm outline-none cursor-not-allowed"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-450 uppercase">Mã số tài xế</label>
                                <input 
                                  type="text" 
                                  value={currentUser.id ? `DRV-${currentUser.id}` : 'DRV-N/A'} 
                                  disabled
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-500 font-semibold text-sm outline-none cursor-not-allowed"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-450 uppercase">Địa chỉ Email</label>
                                <input 
                                  type="email" 
                                  value={currentUser.email} 
                                  disabled
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-500 font-semibold text-sm outline-none cursor-not-allowed"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-450 uppercase">Số điện thoại</label>
                                <input 
                                  type="text" 
                                  value={currentUser.phone} 
                                  disabled
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-500 font-semibold text-sm outline-none cursor-not-allowed"
                                />
                              </div>
                            </div>

                            <div className="h-px bg-slate-100 my-4" />

                            <div className="flex justify-between items-center bg-amber-50 border border-amber-100 rounded-xl p-4.5 text-xs text-amber-800 font-semibold">
                              <div className="flex items-center gap-2.5">
                                <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0" />
                                <div>
                                  <p className="font-extrabold">Đổi mật khẩu tài khoản</p>
                                  <p className="text-amber-700/80 mt-0.5">Liên hệ Quản trị viên điều hành BusGo để được đổi mật khẩu cấp lại.</p>
                                </div>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => toast.info('Chức năng đổi mật khẩu đang bảo trì.')}
                                className="border-amber-200 hover:bg-amber-100 text-amber-800"
                              >
                                Đổi mật khẩu
                              </Button>
                            </div>

                          </CardContent>
                        </Card>
                      </div>

                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </main>
      </div>


      {/* ==================== DIALOG: UPDATE TRIP STATUS ==================== */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cập nhật trạng thái chuyến xe</DialogTitle>
            <DialogDescription>
              Tuyến đi: {dialogTrip?.from} → {dialogTrip?.to} ({dialogTrip?.licensePlate})
            </DialogDescription>
          </DialogHeader>

          {/* Dialog Inputs */}
          <div className="py-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Trạng thái hành trình</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#004b87]"
              >
                <option value="SCHEDULED">Đã lên lịch</option>
                <option value="DEPARTED">Đang khởi hành (Đang di chuyển)</option>
                <option value="COMPLETED">Đã hoàn thành</option>
                <option value="CANCELLED">Hủy chuyến xe</option>
                <option value="INCIDENT">⚠️ Báo cáo sự cố</option>
              </select>
            </div>

            {/* Conditional input fields for Incident reporting */}
            {newStatus === 'INCIDENT' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 pt-2 border-t border-slate-100"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Loại sự cố</label>
                  <select
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-red-500"
                  >
                    <option value="Hỏng xe">Hỏng xe / Lỗi kỹ thuật động cơ</option>
                    <option value="Hỏng lốp">Hỏng lốp xe dọc đường</option>
                    <option value="Tắc đường">Tắc nghẽn giao thông cực nặng</option>
                    <option value="Thời tiết xấu">Thời tiết ngập lụt / sạt lở</option>
                    <option value="Tai nạn giao thông">Tai nạn va chạm giao thông</option>
                    <option value="Hành khách sự cố">Hành khách cần cấp cứu y tế</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Vị trí hiện tại</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Đèo Hải Vân Km 12+300"
                    value={incidentLoc}
                    onChange={(e) => setIncidentLoc(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Nội dung chi tiết sự cố</label>
                  <textarea
                    placeholder="Mô tả cụ thể sự cố để bộ phận điều hành gửi cứu trợ..."
                    value={incidentDesc}
                    onChange={(e) => setIncidentDesc(e.target.value)}
                    rows={3}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 resize-none"
                  />
                </div>
              </motion.div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
              className="border-slate-200"
            >
              Hủy
            </Button>
            <Button
              variant={newStatus === 'INCIDENT' ? 'destructive' : 'default'}
              onClick={handleUpdateStatus}
              className={newStatus === 'INCIDENT' ? 'bg-red-500 hover:bg-red-600' : 'bg-[#004b87] hover:bg-[#003d70]'}
            >
              Lưu cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
