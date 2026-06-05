import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
  const [isSidebarPinned, setIsSidebarPinned] = useState(false)
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

  // Cargo Detail Dialog State
  const [selectedCargoForDetail, setSelectedCargoForDetail] = useState(null)

  // New Dedicated Incident Dialog States
  const [isIncidentDialogOpen, setIsIncidentDialogOpen] = useState(false)
  const [incidentTrip, setIncidentTrip] = useState(null)
  const [incidentSeverity, setIncidentSeverity] = useState('Trung bình')
  const [incidentImage, setIncidentImage] = useState('')
  const [incidentNotes, setIncidentNotes] = useState('')
  const [changeStatusToIncident, setChangeStatusToIncident] = useState(true)

  const openIncidentDialog = (trip) => {
    setIncidentTrip(trip)
    setIncidentType('Xe hỏng')
    setIncidentSeverity('Trung bình')
    setIncidentLoc('')
    setIncidentDesc('')
    setIncidentImage('')
    setIncidentNotes('')
    setChangeStatusToIncident(true)
    setIsIncidentDialogOpen(true)
  }

  // Completed Trip Detail Dialog
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [detailTrip, setDetailTrip] = useState(null)

  // Start Trip Dialog States
  const [isStartTripDialogOpen, setIsStartTripDialogOpen] = useState(false)
  const [startTripTrip, setStartTripTrip] = useState(null)
  const [startTripData, setStartTripData] = useState({
    startLocation: '',
    startKm: '',
    vehicleStatus: 'Bình thường',
    proofImage: '',
    notes: ''
  })

  const openStartTripDialog = (trip) => {
    setStartTripTrip(trip)
    setStartTripData({
      startLocation: '',
      startKm: '',
      vehicleStatus: 'Bình thường',
      proofImage: '',
      notes: ''
    })
    setIsStartTripDialogOpen(true)
  }

  const [isLocLoading, setIsLocLoading] = useState(false)

  const handleGetCurrentLocation = (targetForm = 'start') => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt của bạn không hỗ trợ định vị GPS!')
      return
    }

    setIsLocLoading(true)
    toast.info('Đang lấy vị trí tọa độ GPS của bạn...')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=vi`
          )
          const data = await response.json()
          const locStr = (data && data.display_name)
            ? data.display_name
            : `GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

          if (targetForm === 'start') {
            setStartTripData(prev => ({ ...prev, startLocation: locStr }))
          } else if (targetForm === 'end') {
            setEndTripData(prev => ({ ...prev, location: locStr }))
          } else if (targetForm === 'incident') {
            setIncidentLoc(locStr)
          }
          toast.success('Lấy vị trí hiện tại thành công!')
        } catch (err) {
          console.error(err)
          const fallbackLoc = `GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          if (targetForm === 'start') {
            setStartTripData(prev => ({ ...prev, startLocation: fallbackLoc }))
          } else if (targetForm === 'end') {
            setEndTripData(prev => ({ ...prev, location: fallbackLoc }))
          } else if (targetForm === 'incident') {
            setIncidentLoc(fallbackLoc)
          }
          toast.success('Định vị thành công bằng tọa độ GPS!')
        } finally {
          setIsLocLoading(false)
        }
      },
      (error) => {
        console.error(error)
        let msg = 'Không thể định vị vị trí hiện tại của bạn.'
        if (error.code === 1) msg = 'Vui lòng cấp quyền truy cập GPS cho ứng dụng!'
        toast.error(msg)
        setIsLocLoading(false)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  // End Trip Dialog States & Actions
  const [isEndTripDialogOpen, setIsEndTripDialogOpen] = useState(false)
  const [endTripData, setEndTripData] = useState({
    location: '',
    km: '',
    vehicleStatus: 'Bình thường',
    proofImage: '',
    vehiclePhoto: '',
    notes: '',
    confirmedComplete: false
  })

  const openEndTripDialog = () => {
    setEndTripData({
      location: '',
      km: '',
      vehicleStatus: 'Bình thường',
      proofImage: '',
      vehiclePhoto: '',
      notes: '',
      confirmedComplete: false
    })
    setIsEndTripDialogOpen(true)
  }

  const handleEndTrip = async (tripId) => {
    try {
      await updateTripStatusAPI(tripId, {
        updateType: 'END',
        viTri: endTripData.location,
        thoiGianKetThuc: new Date().toISOString(),
        soKm: Number(endTripData.km),
        tinhTrangXe: endTripData.vehicleStatus,
        anhMinhChung: endTripData.proofImage,
        anhXeSauChuyen: endTripData.vehiclePhoto,
        ghiChu: endTripData.notes
      })

      toast.success('Hành trình đã kết thúc thành công! Trạng thái cập nhật: "Đã hoàn thành".')
      setIsEndTripDialogOpen(false)
      fetchTrips(true)
      setActiveTab('trips')
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Lỗi khi kết thúc chuyến đi')
    }
  }

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
        
        // Auto-prefetch passengers and cargo for running trip if any
        const runningTrip = data.find(t => t.status === 'DEPARTED' || t.status === 'INCIDENT')
        if (runningTrip) {
          fetchPassengersAndCargo(runningTrip.id)
        }
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

  // Auto-select running trip when trips change
  useEffect(() => {
    const runningTrip = trips.find(t => t.status === 'DEPARTED' || t.status === 'INCIDENT')
    if (runningTrip && selectedTripId !== runningTrip.id) {
      setSelectedTripId(runningTrip.id)
    }
  }, [trips, selectedTripId])

  // Handle active tab loading transition
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [activeTab])

  // Watch current coordinates of driver whenever there is a running trip
  const [currentCoords, setCurrentCoords] = useState({ lat: 16.0544, lon: 108.2022 })
  const [stopwatchTime, setStopwatchTime] = useState('00:00:00')

  useEffect(() => {
    const runningTrip = trips.find(t => t.status === 'DEPARTED' || t.status === 'INCIDENT')
    if (!runningTrip || !onShift) return

    if (!navigator.geolocation) {
      console.warn('Định vị GPS không được hỗ trợ bởi trình duyệt này.')
      return
    }

    const successCallback = (position) => {
      setCurrentCoords({
        lat: position.coords.latitude,
        lon: position.coords.longitude
      })
    }

    const errorCallback = (error) => {
      console.warn('Lỗi định vị GPS:', error)
    }

    const watchId = navigator.geolocation.watchPosition(successCallback, errorCallback, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    })

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [trips, onShift])

  // Stopwatch timer for running trip starting from the START log
  useEffect(() => {
    let intervalId = null
    const runningTrip = trips.find(t => t.status === 'DEPARTED' || t.status === 'INCIDENT')
    const startLog = runningTrip?.journeyLogs?.find(l => l.type === 'START')

    if (runningTrip && startLog) {
      const startTime = new Date(startLog.time).getTime()

      const updateTimer = () => {
        const diff = Date.now() - startTime
        if (diff < 0) {
          setStopwatchTime('00:00:00')
          return
        }
        const totalSeconds = Math.floor(diff / 1000)
        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const seconds = totalSeconds % 60

        const formatted = [
          hours.toString().padStart(2, '0'),
          minutes.toString().padStart(2, '0'),
          seconds.toString().padStart(2, '0')
        ].join(':')

        setStopwatchTime(formatted)
      }

      updateTimer()
      intervalId = setInterval(updateTimer, 1000)
    } else {
      setStopwatchTime('00:00:00')
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [trips])

  // Auto-poll trip status when there is an active INCIDENT trip
  // This ensures the driver sees the status revert to DEPARTED once Admin resolves the incident
  useEffect(() => {
    const hasIncidentTrip = trips.some(t => t.status === 'INCIDENT')
    if (!hasIncidentTrip) return

    const pollInterval = setInterval(() => {
      fetchTrips(true) // silent refresh (no loading spinner)
    }, 10000) // poll every 10 seconds

    return () => clearInterval(pollInterval)
  }, [trips])
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
    const runningTrips = trips.filter(t => t.status === 'DEPARTED' || t.status === 'INCIDENT').length
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
    const running = trips.find(t => t.status === 'DEPARTED' || t.status === 'INCIDENT')
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
  const handleStartTrip = async (tripId, startData = null) => {
    if (!onShift) {
      toast.error('Vui lòng kích hoạt "Bắt đầu ca làm" trước khi khởi hành!')
      return
    }

    try {
      const payload = { status: 'DEPARTED' }
      if (startData) {
        payload.updateType = 'START'
        payload.startLocation = startData.startLocation
        payload.startKm = Number(startData.startKm)
        payload.vehicleStatus = startData.vehicleStatus
        payload.proofImage = startData.proofImage
        payload.notes = startData.notes
      }

      await updateTripStatusAPI(tripId, payload)
      
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
      setIsStartTripDialogOpen(false)
      await fetchTrips(true)
      setActiveTab('current-trip')
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

  // Handle send incident report
  const handleSendIncidentReport = async () => {
    if (!incidentTrip) return

    try {
      const statusData = {
        status: 'INCIDENT',
        updateType: 'INCIDENT',
        incidentType,
        incidentDesc,
        incidentLoc,
        incidentSeverity,
        proofImage: incidentImage,
        notes: incidentNotes,
        changeStatusToIncident
      }

      await updateTripStatusAPI(incidentTrip.id, statusData)
      
      toast.warning('Đã gửi báo cáo sự cố về tổng đài điều hành! Ban quản lý đã được thông báo.')
      setIsIncidentDialogOpen(false)
      fetchTrips(true)
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Lỗi khi gửi báo cáo sự cố')
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
        className={`flex items-center w-full rounded-xl py-3.5 text-sm font-extrabold tracking-wide transition-all group duration-200 border-none ${
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
    // Only show incident badge when the trip status is actually INCIDENT
    if (status === 'INCIDENT' && incident) return { text: 'Sự cố: ' + incident.type, variant: 'destructive', icon: AlertTriangle }
    if (status === 'INCIDENT') return { text: 'Đang xảy ra sự cố', variant: 'destructive', icon: AlertTriangle }
    switch (status) {
      case 'SCHEDULED': return { text: 'Đã lên lịch', variant: 'info', icon: Clock }
      case 'DEPARTED': return { text: 'Đang di chuyển', variant: 'warning', icon: Truck }
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
              <>
                <SidebarItem tabId="trips" icon={Calendar} label="Chuyến xe của tôi" />
                <SidebarItem tabId="current-trip" icon={Truck} label="Chuyến xe hiện tại" />
                <SidebarItem tabId="passengers" icon={Users} label="Hành khách" />
              </>
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
            className={`flex items-center rounded-xl py-3.5 text-sm font-extrabold text-red-500 hover:bg-red-50 w-full transition-all border-none bg-transparent cursor-pointer ${
              isSidebarCollapsed ? 'justify-center px-0' : 'px-4'
            }`}
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
        style={{ paddingLeft: isSidebarPinned ? '260px' : '80px' }}
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
                                          onClick={() => openStartTripDialog(upcomingTrip)}
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
                                {(() => {
                                  const hasDeparted = filteredTrips.some(t => t.status === 'DEPARTED' || t.status === 'INCIDENT')
                                  return filteredTrips.map(trip => {
                                    const statusInfo = getTripStatusDetails(trip.status, trip.incidentDetails)
                                    const isLocked = hasDeparted && trip.status === 'SCHEDULED'
                                    return (
                                      <TableRow key={trip.id} className={`${
                                        trip.id === selectedTripId ? 'bg-blue-50/20 hover:bg-blue-50/30' : ''
                                      } ${isLocked ? 'opacity-60' : ''}`}>
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
                                            {trip.status === 'SCHEDULED' ? (
                                              <Button
                                                variant="default"
                                                size="sm"
                                                disabled={isLocked}
                                                onClick={() => !isLocked && openStartTripDialog(trip)}
                                                title={isLocked ? 'Đang có chuyến xe khác chạy. Hoàn thành trước khi bắt đầu chuyến mới.' : ''}
                                                className={`${
                                                  isLocked
                                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                    : 'bg-[#004b87] hover:bg-[#003d70]'
                                                }`}
                                              >
                                                {isLocked ? '🔒 Đang bị khóa' : 'Bắt đầu chuyến xe'}
                                              </Button>
                                            ) : (trip.status === 'DEPARTED' || trip.status === 'INCIDENT') ? (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openStatusDialog(trip)}
                                                className="border-amber-200 text-amber-600 hover:bg-amber-50"
                                              >
                                                Báo sự cố / Trạng thái
                                              </Button>
                                            ) : trip.status === 'COMPLETED' ? (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => { setDetailTrip(trip); setIsDetailDialogOpen(true) }}
                                                className="border-green-200 text-green-700 hover:bg-green-50"
                                              >
                                                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                                                Xem chi tiết
                                              </Button>
                                            ) : (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                disabled
                                                className="bg-slate-50 border-slate-200 text-slate-400"
                                              >
                                                Đã hủy
                                              </Button>
                                            )}
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    )
                                  })
                                })()}
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


                {/* ==================== TAB: CURRENT TRIP (CHUYẾN XE HIỆN TẠI) ==================== */}
                {activeTab === 'current-trip' && (
                  onShift ? (
                    <div className="space-y-6">
                      <div>
                        <h1 className="text-2xl font-black text-slate-800">Chuyến xe hiện tại</h1>
                        <p className="text-slate-400 text-xs font-semibold mt-1">Thông tin chi tiết hành trình đang hoạt động của bạn</p>
                      </div>

                      {(() => {
                        const runningTrip = trips.find(t => t.status === 'DEPARTED' || t.status === 'INCIDENT')
                        if (!runningTrip) {
                          return (
                            <Card className="border-slate-100 bg-slate-50/50">
                              <CardContent className="p-12 text-center text-slate-400 space-y-3">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-350">
                                  <Truck className="h-8 w-8 text-slate-450" />
                                </div>
                                <h3 className="text-base font-extrabold text-[#004b87]">Không có chuyến xe nào đang chạy</h3>
                                <p className="text-xs font-semibold text-slate-500 max-w-sm mx-auto">Hiện tại bạn không có chuyến xe nào đang hoạt động. Vui lòng quay lại danh sách "Chuyến xe của tôi" để bắt đầu chuyến xe đã lên lịch.</p>
                                <Button
                                  onClick={() => setActiveTab('trips')}
                                  className="bg-[#004b87] hover:bg-[#003d70] text-white text-xs font-black rounded-xl px-5 h-10 mt-2"
                                >
                                  Xem lịch trình chuyến đi
                                </Button>
                              </CardContent>
                            </Card>
                          )
                        }

                        return (
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Trip Info & Details */}
                            <div className="lg:col-span-2 space-y-6">
                              <Card className="border-[#004b87]/30 border shadow-md relative overflow-hidden bg-white">
                                <div className="absolute top-0 right-0 bg-[#004b87] text-white text-[10px] font-black uppercase tracking-wider py-1 px-4 rounded-bl-xl">
                                  Đang vận hành
                                </div>
                                <CardHeader className="pb-4">
                                  <CardTitle className="text-base font-black flex items-center gap-2">
                                    <Bus className="h-5 w-5 text-[#004b87]" />
                                    Hành trình: {runningTrip.from} → {runningTrip.to}
                                  </CardTitle>
                                  <CardDescription className="text-xs font-semibold">
                                    Biển số xe: {runningTrip.licensePlate} ({runningTrip.busType})
                                  </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl">
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock className="h-3 w-3" /> Giờ đi</span>
                                      <p className="text-sm font-extrabold text-slate-700">{runningTrip.departureTime}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock className="h-3 w-3" /> Giờ đến (Dự kiến)</span>
                                      <p className="text-sm font-extrabold text-slate-700">{runningTrip.arrivalTime}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Users className="h-3 w-3" /> Hành khách</span>
                                      <p className="text-sm font-extrabold text-slate-700">{runningTrip.passengerCount}/{runningTrip.maxPassengers} người</p>
                                      {(() => {
                                        const runningTripPassengers = passengers.filter(p => p.tripId === runningTrip.id);
                                        const boardedCount = runningTripPassengers.filter(p => p.status === 'USED').length;
                                        const notBoardedCount = runningTripPassengers.filter(p => p.status === 'PAID').length;
                                        return (
                                          <div className="text-[10px] text-slate-500 font-semibold space-y-0.5 mt-1 border-t border-slate-100 pt-1">
                                            <div className="text-green-600 flex items-center gap-1">
                                              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                              Đã lên: {boardedCount} người
                                            </div>
                                            <div className="text-amber-600 flex items-center gap-1">
                                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                              Chưa lên: {notBoardedCount} người
                                            </div>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                        <Clock className="h-3 w-3 text-[#004b87]" /> Bắt đầu lúc
                                      </span>
                                      {(() => {
                                        const sLog = runningTrip.journeyLogs?.find(l => l.type === 'START')
                                        const t = sLog?.time ? new Date(sLog.time) : null
                                        return (
                                          <p className="text-sm font-black text-[#004b87]">
                                            {t ? t.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                                          </p>
                                        )
                                      })()}
                                    </div>
                                  </div>

                                  <div className="h-px bg-slate-100" />

                                  {/* Quick Actions (Moved from sidebar to here) */}
                                  <div className="space-y-3">
                                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                      <Grid className="h-4 w-4 text-[#004b87]" /> Sơ đồ & Dịch vụ chuyến xe
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <button
                                        onClick={() => {
                                          setSelectedTripId(runningTrip.id)
                                          setActiveTab('passengers')
                                        }}
                                        className="flex items-center justify-between p-4 hover:bg-sky-50/50 border border-slate-100 hover:border-[#004b87]/30 rounded-2xl text-left transition-all bg-slate-50/30 cursor-pointer group"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 bg-blue-50 text-[#004b87] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Users className="h-5 w-5" />
                                          </div>
                                          <div>
                                            <h4 className="text-xs font-black text-slate-800">Danh sách soát vé (Sơ đồ ghế)</h4>
                                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{runningTrip.passengerCount} hành khách trên xe</p>
                                          </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                                      </button>

                                      <button
                                        onClick={() => {
                                          setSelectedTripId(runningTrip.id)
                                          setActiveTab('cargo')
                                        }}
                                        className="flex items-center justify-between p-4 hover:bg-sky-50/50 border border-slate-100 hover:border-[#004b87]/30 rounded-2xl text-left transition-all bg-slate-50/30 cursor-pointer group"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Package className="h-5 w-5" />
                                          </div>
                                          <div>
                                            <h4 className="text-xs font-black text-slate-800">Ký gửi hàng hóa</h4>
                                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Quản lý kiện hàng vận chuyển</p>
                                          </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="h-px bg-slate-100" />

                                  {/* Journey Logs / Timeline Section */}
                                  <div className="space-y-6">
                                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                                      <Clock className="h-4.5 w-4.5 text-[#004b87]" />
                                      Nhật ký hành trình (Dòng thời gian)
                                    </h3>

                                    {runningTrip.journeyLogs && runningTrip.journeyLogs.length > 0 ? (
                                      <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-8 my-4">
                                        {runningTrip.journeyLogs.map((log, idx) => {
                                          let badgeColor = 'bg-slate-100 text-slate-700';
                                          let title = 'Cập nhật';
                                          if (log.type === 'START') {
                                            badgeColor = 'bg-blue-100 text-[#004b87]';
                                            title = 'Khởi hành chuyến xe';
                                          } else if (log.type === 'END') {
                                            badgeColor = 'bg-green-100 text-green-700';
                                            title = 'Hoàn thành chuyến xe';
                                          } else if (log.type === 'INCIDENT') {
                                            badgeColor = 'bg-red-100 text-red-700';
                                            title = '⚠️ Báo cáo sự cố';
                                          }

                                          // Parse incident details if type is INCIDENT
                                          let incidentData = null;
                                          if (log.type === 'INCIDENT' && log.notes && log.notes.startsWith('{')) {
                                            try {
                                              incidentData = JSON.parse(log.notes);
                                            } catch (e) { }
                                          }

                                          return (
                                            <div key={log.id || idx} className="relative">
                                              {/* Timeline Dot */}
                                              <span className={`absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white border-2 ${log.type === 'START' ? 'border-[#004b87]' : (log.type === 'END' ? 'border-green-600' : (log.type === 'INCIDENT' ? 'border-red-500' : 'border-slate-400'))
                                                }`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${log.type === 'START' ? 'bg-[#004b87]' : (log.type === 'END' ? 'bg-green-600' : (log.type === 'INCIDENT' ? 'bg-red-500' : 'bg-slate-400'))}`} />
                                              </span>

                                              {/* Log Content Card */}
                                              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                  <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${badgeColor}`}>
                                                      {title}
                                                    </span>
                                                    <span className="text-xs font-extrabold text-slate-800">
                                                      {log.location}
                                                    </span>
                                                  </div>
                                                  <span className="text-[10px] font-bold text-slate-400">
                                                    {FormatUtil.formatDate(log.time)} — {new Date(log.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                  </span>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                                  <div className="space-y-1.5 flex-1">
                                                    <div className="flex justify-between border-b border-slate-100/50 pb-1">
                                                      <span className="text-slate-400 font-semibold">Chỉ số ODO:</span>
                                                      <span className="text-slate-700 font-extrabold">{log.km} km</span>
                                                    </div>
                                                    <div className="flex justify-between border-b border-slate-100/50 pb-1">
                                                      <span className="text-slate-400 font-semibold">Tình trạng xe:</span>
                                                      <span className="text-slate-700 font-extrabold">{log.vehicleStatus || 'Bình thường'}</span>
                                                    </div>
                                                    {incidentData ? (
                                                      <div className="pt-1">
                                                        <span className="text-red-500 font-bold block">Chi tiết sự cố:</span>
                                                        <p className="text-slate-600 font-medium bg-red-50/50 p-2 rounded-lg border border-red-100 mt-1">
                                                          <strong>[{incidentData.type}]</strong> {incidentData.desc}
                                                        </p>
                                                      </div>
                                                    ) : (
                                                      log.notes && (
                                                        <div className="pt-1">
                                                          <span className="text-slate-400 font-semibold block">Ghi chú:</span>
                                                          <p className="text-slate-650 font-medium bg-white p-2 rounded-lg border border-slate-100 mt-1">
                                                            {log.notes}
                                                          </p>
                                                        </div>
                                                      )
                                                    )}
                                                  </div>

                                                  {/* Photo columns */}
                                                  <div className="flex gap-2">
                                                    {/* Proof image (ODO) */}
                                                    <div className="flex-1">
                                                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Ảnh đồng hồ km</p>
                                                      {log.proofImage ? (
                                                        <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-150 shadow-inner bg-slate-150">
                                                          <img
                                                            src={log.proofImage}
                                                            alt="Proof"
                                                            className="w-full h-full object-cover cursor-zoom-in"
                                                            onClick={() => window.open(log.proofImage)}
                                                          />
                                                        </div>
                                                      ) : (
                                                        <div className="w-full h-24 rounded-lg border border-dashed border-slate-200 flex items-center justify-center text-slate-400 font-medium text-[10px] text-center px-2">
                                                          Không có ảnh
                                                        </div>
                                                      )}
                                                    </div>
                                                    {/* Vehicle photo (END only) */}
                                                    {log.type === 'END' && (
                                                      <div className="flex-1">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Ảnh xe sau chuyến</p>
                                                        {log.vehiclePhoto ? (
                                                          <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-150 shadow-inner bg-slate-150">
                                                            <img
                                                              src={log.vehiclePhoto}
                                                              alt="Vehicle"
                                                              className="w-full h-full object-cover cursor-zoom-in"
                                                              onClick={() => window.open(log.vehiclePhoto)}
                                                            />
                                                          </div>
                                                        ) : (
                                                          <div className="w-full h-24 rounded-lg border border-dashed border-slate-200 flex items-center justify-center text-slate-400 font-medium text-[10px] text-center px-2">
                                                            Không có ảnh
                                                          </div>
                                                        )}
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-slate-400 font-semibold italic">Không tìm thấy nhật ký hành trình.</p>
                                    )}
                                  </div>
                                </CardContent>
                                <CardContent className="p-0 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
                                  <CardFooter className="p-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <span className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
                                      <Info className="h-4 w-4 text-[#004b87]" />
                                      Cập nhật sự cố hoặc kết thúc hành trình khi tới bến.
                                    </span>
                                    <div className="flex gap-2.5 w-full sm:w-auto">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openIncidentDialog(runningTrip)}
                                        className="border-red-200 text-red-650 hover:bg-red-50"
                                      >
                                        <AlertTriangle className="h-4 w-4 mr-1.5" /> Báo cáo sự cố
                                      </Button>
                                      {runningTrip.status !== 'INCIDENT' && (
                                        <Button
                                          variant="default"
                                          size="sm"
                                          onClick={openEndTripDialog}
                                          className="bg-green-600 hover:bg-green-700 text-white border-none"
                                        >
                                          <CheckCircle className="h-4 w-4 mr-1.5" /> Hoàn thành chuyến xe
                                        </Button>
                                      )}
                                    </div>
                                  </CardFooter>
                                </CardContent>
                              </Card>
                            </div>

                            {/* Sidebar: Grab-style Live Map */}
                            <div className="space-y-4">
                              {(() => {
                                // === Coordinate lookup table for all DB locations ===
                                const LOCATION_COORDS = {
                                  // Nội thành Đà Nẵng
                                  'bến xe trung tâm': { lat: 16.0479, lng: 108.2052 },
                                  'bến xe đà nẵng': { lat: 16.0479, lng: 108.2052 },
                                  'sân bay quốc tế đà nẵng': { lat: 16.0439, lng: 108.1993 },
                                  'sân bay đà nẵng': { lat: 16.0439, lng: 108.1993 },
                                  'bãi biển mỹ khê': { lat: 16.0600, lng: 108.2470 },
                                  'cầu rồng': { lat: 16.0614, lng: 108.2275 },
                                  'phố cổ hội an': { lat: 15.8801, lng: 108.3380 },
                                  'bãi biển non nước': { lat: 16.0025, lng: 108.2629 },
                                  'đại học duy tân': { lat: 16.0796, lng: 108.2201 },
                                  'trung tâm thành phố': { lat: 16.0748, lng: 108.2219 },
                                  'khu công nghiệp hòa cầm': { lat: 15.9955, lng: 108.1637 },
                                  // Liên tỉnh
                                  'đà nẵng': { lat: 16.0544, lng: 108.2022 },
                                  'huế': { lat: 16.4637, lng: 107.5909 },
                                  'quảng nam': { lat: 15.5794, lng: 108.0832 },
                                  'quảng ngãi': { lat: 15.1214, lng: 108.7922 },
                                  'quảng trị': { lat: 16.7474, lng: 107.1857 },
                                  'quảng bình': { lat: 17.4689, lng: 106.6220 },
                                  'hà tĩnh': { lat: 18.3428, lng: 105.9057 },
                                  'nghệ an': { lat: 19.3334, lng: 104.8526 },
                                  'thanh hóa': { lat: 19.8067, lng: 105.7851 },
                                }

                                const getCoords = (name) => {
                                  if (!name) return null
                                  const key = name.toLowerCase().trim()
                                  if (LOCATION_COORDS[key]) return LOCATION_COORDS[key]
                                  // Partial match
                                  for (const [k, v] of Object.entries(LOCATION_COORDS)) {
                                    if (key.includes(k) || k.includes(key)) return v
                                  }
                                  return null
                                }

                                // Parse GPS string from startLog if available
                                const startLog = runningTrip.journeyLogs?.find(l => l.type === 'START')
                                let driverLat = currentCoords.lat
                                let driverLng = currentCoords.lon

                                // Try to get start position from GPS log
                                if (startLog?.location) {
                                  const m = startLog.location.match(/GPS:\s*(-?\d+\.\d+),\s*(-?\d+\.\d+)/)
                                  if (m) { driverLat = parseFloat(m[1]); driverLng = parseFloat(m[2]) }
                                }

                                // Destination from trip route
                                const destCoords = getCoords(runningTrip.to)
                                const originCoords = getCoords(runningTrip.from) || { lat: driverLat, lng: driverLng }

                                const destLat = destCoords?.lat ?? (driverLat - 0.05)
                                const destLng = destCoords?.lng ?? (driverLng + 0.05)

                                // Build Leaflet srcDoc
                                const leafletHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body, #map { width: 100%; height: 100%; }
  .grab-panel {
    position: absolute; bottom: 0; left: 0; right: 0; z-index: 1000;
    background: white; border-radius: 20px 20px 0 0;
    padding: 16px 20px 12px; box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
  }
  .grab-row { display: flex; align-items: center; justify-content: space-between; }
  .grab-eta { font-size: 26px; font-weight: 900; color: #111; }
  .grab-sub { font-size: 13px; color: #666; margin-top: 2px; }
  .grab-dest-badge {
    background: #00b14f; color: white; border-radius: 12px;
    padding: 8px 16px; font-size: 13px; font-weight: 700;
  }
  .driver-icon { font-size: 28px; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4)); }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
const driverLat = ${driverLat};
const driverLng = ${driverLng};
const destLat = ${destLat};
const destLng = ${destLng};
const originLat = ${originCoords.lat};
const originLng = ${originCoords.lng};
const routeFrom = ${JSON.stringify(runningTrip.from)};
const routeTo = ${JSON.stringify(runningTrip.to)};

const map = L.map('map', {
  zoomControl: false,
  attributionControl: false
}).setView([driverLat, driverLng], 14);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

L.control.zoom({ position: 'topright' }).addTo(map);

// Driver marker (blue arrow like Grab)
const driverIcon = L.divIcon({
  className: '',
  html: '<div style="width:44px;height:44px;background:#1a73e8;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 12px rgba(26,115,232,0.5);font-size:22px;">🚌</div>',
  iconSize: [44, 44],
  iconAnchor: [22, 22]
});
const driverMarker = L.marker([driverLat, driverLng], { icon: driverIcon }).addTo(map);

// Origin marker
const originIcon = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;background:#1a73e8;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(26,115,232,0.25);"></div>',
  iconSize: [16,16], iconAnchor: [8,8]
});
L.marker([originLat, originLng], { icon: originIcon }).addTo(map)
  .bindPopup('<b>Điểm xuất phát:</b><br>' + routeFrom).openPopup();

// Destination marker (red pin)
const destIcon = L.divIcon({
  className: '',
  html: '<div style="position:relative;width:32px;height:44px;"><div style="width:32px;height:32px;background:#e53935;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 10px rgba(229,57,53,0.5);"></div><div style="position:absolute;top:4px;left:4px;width:16px;height:16px;background:white;border-radius:50%;"></div></div>',
  iconSize: [32, 44], iconAnchor: [16, 44]
});
L.marker([destLat, destLng], { icon: destIcon }).addTo(map)
  .bindPopup('<b>Điểm đến:</b><br>' + routeTo);

// Draw route via OSRM
const osrmUrl = 'https://router.project-osrm.org/route/v1/driving/'
  + driverLng + ',' + driverLat + ';'
  + destLng + ',' + destLat
  + '?overview=full&geometries=geojson';

fetch(osrmUrl)
  .then(r => r.json())
  .then(data => {
    if (data.code === 'Ok' && data.routes && data.routes[0]) {
      const route = data.routes[0];
      const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
      
      // Blue shadow line (like Grab)
      L.polyline(coords, { color: '#1a73e8', weight: 10, opacity: 0.25 }).addTo(map);
      // Main route line
      L.polyline(coords, { color: '#1a73e8', weight: 5, opacity: 0.95 }).addTo(map);
      
      // Fit bounds with padding
      map.fitBounds(L.polyline(coords).getBounds(), { padding: [60, 60] });
      
      // Bottom info panel
      const dist = (route.distance / 1000).toFixed(1);
      const dur = Math.ceil(route.duration / 60);
      const hrs = Math.floor(dur / 60);
      const mins = dur % 60;
      const etaStr = hrs > 0 ? hrs + ' giờ ' + mins + ' phút' : mins + ' phút';
      
      const panel = document.createElement('div');
      panel.className = 'grab-panel';
      panel.innerHTML = '<div class="grab-row"><div><div class="grab-eta">~' + etaStr + '</div><div class="grab-sub">' + dist + ' km · ' + routeTo + '</div></div><div class="grab-dest-badge">🏁 ' + routeTo + '</div></div>';
      document.body.appendChild(panel);
    }
  })
  .catch(() => {
    // Fallback: straight line
    L.polyline([[driverLat, driverLng],[destLat, destLng]], { color: '#1a73e8', weight: 5, dashArray: '8 8' }).addTo(map);
    map.fitBounds([[driverLat, driverLng],[destLat, destLng]], { padding: [60, 60] });
  });

// Listen for driver position updates
window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'UPDATE_COORDS') {
    const { lat, lng } = e.data;
    driverMarker.setLatLng([lat, lng]);
  }
});
</script>
</body>
</html>`

                                return (
                                  <Card className="border-slate-100 overflow-hidden shadow-sm">
                                    {/* Header - Grab style top bar */}
                                    <div className="flex items-center justify-between px-4 py-3 bg-[#004b87]">
                                      <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                          <MapPin className="h-4 w-4 text-white" />
                                        </div>
                                        <div>
                                          <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Đang chạy tuyến</p>
                                          <p className="text-sm font-black text-white">{runningTrip.from} → {runningTrip.to}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1.5 bg-red-500 text-white rounded-full px-3 py-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                        <span className="text-[11px] font-black">LIVE</span>
                                      </div>
                                    </div>

                                    {/* Map */}
                                    <div className="relative" style={{ height: '440px' }}>
                                      <iframe
                                        srcDoc={leafletHTML}
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        title="Bản đồ hành trình"
                                        sandbox="allow-scripts allow-same-origin"
                                        className="w-full h-full"
                                      />
                                    </div>

                                    {/* Footer: start time */}
                                    {(() => {
                                      const sLog = runningTrip.journeyLogs?.find(l => l.type === 'START')
                                      const startTimeStr = sLog?.time
                                        ? new Date(sLog.time).toLocaleString('vi-VN', {
                                            hour: '2-digit', minute: '2-digit', second: '2-digit',
                                            day: '2-digit', month: '2-digit', year: 'numeric'
                                          })
                                        : '—'
                                      return (
                                        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-100">
                                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                                            <Clock className="h-3.5 w-3.5 text-[#004b87]" />
                                            Bắt đầu chuyến xe
                                          </div>
                                          <div className="text-xs font-black text-[#004b87]">
                                            {startTimeStr}
                                          </div>
                                        </div>
                                      )
                                    })()}
                                  </Card>
                                )
                              })()}
                            </div>

                          </div>
                        )

                      })()}
                    </div>
                  ) : (
                    <Card className="border-slate-100 bg-slate-50/50">
                      <CardContent className="p-12 text-center text-slate-400 space-y-3">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-350">
                          <Clock className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-base font-extrabold text-[#004b87]">Ca làm việc của bạn đang đóng</h3>
                        <p className="text-xs font-semibold text-slate-500 max-w-sm mx-auto">Vui lòng quay lại tab "Tổng quan" và nhấn nút "Bắt đầu ca làm" để quản lý hành trình đang hoạt động.</p>
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
                                          {/* Nút Xem chi tiết (Always visible) */}
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSelectedCargoForDetail(item)}
                                            className="border-slate-200 text-slate-700 hover:bg-slate-50 h-8 text-xs px-2.5 rounded-lg"
                                          >
                                            <Info className="h-3.5 w-3.5 mr-1" />
                                            Chi tiết
                                          </Button>

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
                                              (currentUser.role === 'TRUCK_DRIVER' || (onShift && trips.some(t => t.status === 'DEPARTED' || t.status === 'INCIDENT'))) ? (
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

      {/* ==================== DIALOG: CARGO DETAILS ==================== */}
      <Dialog open={!!selectedCargoForDetail} onOpenChange={(open) => !open && setSelectedCargoForDetail(null)}>
        <DialogContent className="max-w-2xl bg-white rounded-2xl shadow-xl border-0 overflow-hidden p-0 max-h-[90vh] overflow-y-auto">
          {selectedCargoForDetail && (
            <>
              {/* Header */}
              <div className="bg-[#004b87] px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white m-0 leading-tight">Chi tiết đơn hàng #{selectedCargoForDetail.id}</h2>
                    <p className="text-blue-100 text-xs font-semibold mt-0.5 opacity-80">
                      {selectedCargoForDetail.isConsignment ? 'Đơn hàng vận tải ký gửi' : 'Hành lý gửi kèm chuyến xe khách'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCargoForDetail(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors border-none cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Trạng thái hiện tại */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Trạng thái đơn hàng</span>
                    <Badge variant={getCargoStatusDetails(selectedCargoForDetail.status).variant} className="text-sm px-3 py-1 font-extrabold shadow-sm">
                      {getCargoStatusDetails(selectedCargoForDetail.status).text}
                    </Badge>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Loại hàng</span>
                    <span className="text-sm font-extrabold text-slate-800">{selectedCargoForDetail.type}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ==================== DIALOG: START TRIP ==================== */}
      <Dialog open={isStartTripDialogOpen} onOpenChange={setIsStartTripDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Xác nhận khởi hành chuyến xe</DialogTitle>
            <DialogDescription>
              Vui lòng điền đầy đủ thông tin điểm xuất phát trước khi bắt đầu chuyến.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Chuyến xe</p>
                <p className="text-sm font-bold text-slate-700 mt-1">{startTripTrip?.from} → {startTripTrip?.to}</p>
              </div>
              <Badge className="bg-blue-50 text-[#004b87] border-0">{startTripTrip?.licensePlate}</Badge>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Địa điểm xuất phát <span className="text-red-500">*</span></label>
                <button
                  type="button"
                  onClick={() => handleGetCurrentLocation('start')}
                  disabled={isLocLoading}
                  className="text-xs font-extrabold text-[#004b87] hover:underline flex items-center gap-1 bg-transparent border-none cursor-pointer disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <MapPin className={`h-3.5 w-3.5 ${isLocLoading ? 'animate-bounce' : ''}`} />
                  {isLocLoading ? 'Đang định vị...' : 'Lấy vị trí GPS'}
                </button>
              </div>
              <input
                type="text"
                placeholder="Nhập tên bến xe hoặc vị trí bắt đầu"
                value={startTripData.startLocation}
                onChange={(e) => setStartTripData(prev => ({ ...prev, startLocation: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#004b87] focus:ring-4 focus:ring-[#004b87]/5"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Số km bắt đầu <span className="text-red-500">*</span></label>
              <input
                type="number"
                placeholder="Nhập chỉ số odo / số km hiện tại của xe"
                value={startTripData.startKm}
                onChange={(e) => setStartTripData(prev => ({ ...prev, startKm: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#004b87] focus:ring-4 focus:ring-[#004b87]/5"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Tình trạng xe <span className="text-red-500">*</span></label>
              <select
                value={startTripData.vehicleStatus}
                onChange={(e) => setStartTripData(prev => ({ ...prev, vehicleStatus: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#004b87]"
              >
                <option value="Bình thường">Bình thường / Ổn định</option>
                <option value="Tốt">Tốt / Mới bảo dưỡng</option>
                <option value="Cần lưu ý nhẹ">Cần lưu ý nhẹ (có ghi chú)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Ảnh minh chứng <span className="text-red-500">*</span></label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onloadend = () => {
                      setStartTripData(prev => ({ ...prev, proofImage: reader.result }))
                    }
                    reader.readAsDataURL(file)
                  }
                }}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-[#004b87] hover:file:bg-blue-100 cursor-pointer"
              />
              {startTripData.proofImage && (
                <div className="mt-2.5 relative w-full h-40 rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                  <img src={startTripData.proofImage} alt="Proof preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setStartTripData(prev => ({ ...prev, proofImage: '' }))}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors border-none cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Ghi chú</label>
              <textarea
                placeholder="Nhập ghi chú thêm nếu có (ví dụ: áp suất lốp, thông tin tài xế phụ...)"
                value={startTripData.notes}
                onChange={(e) => setStartTripData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#004b87] focus:ring-4 focus:ring-[#004b87]/5 resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStartTripDialogOpen(false)}
              className="border-slate-200"
            >
              Hủy
            </Button>
            <Button
              variant="default"
              disabled={!startTripData.startLocation || !startTripData.startKm || !startTripData.proofImage}
              onClick={() => {
                if (startTripTrip) {
                  handleStartTrip(startTripTrip.id, startTripData)
                }
              }}
              className="bg-[#004b87] hover:bg-[#003d70] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              Xác nhận khởi hành
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== DIALOG: END TRIP ==================== */}
      <Dialog open={isEndTripDialogOpen} onOpenChange={setIsEndTripDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-lg font-black text-slate-800">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600">
                <CheckCircle className="h-5 w-5" />
              </span>
              Xác nhận hoàn thành chuyến xe
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Vui lòng điền đầy đủ thông tin để chốt hành trình
            </DialogDescription>
          </DialogHeader>

          {/* Auto time banner */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 my-1">
            <Clock className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Thời gian kết thúc thực tế</p>
              <p className="text-sm font-bold text-slate-700">{new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
            </div>
            <span className="ml-auto text-xs font-bold text-green-600 bg-green-50 border border-green-100 rounded-full px-2.5 py-1">Tự động</span>
          </div>

          <div className="py-2 space-y-4">

            {/* End Location */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Vị trí kết thúc <span className="text-red-500">*</span></label>
                <button
                  type="button"
                  onClick={() => handleGetCurrentLocation('end')}
                  disabled={isLocLoading}
                  className="text-xs font-extrabold text-[#004b87] hover:underline flex items-center gap-1 bg-transparent border-none cursor-pointer disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <MapPin className={`h-3.5 w-3.5 ${isLocLoading ? 'animate-bounce' : ''}`} />
                  {isLocLoading ? 'Đang định vị...' : 'Lấy vị trí GPS'}
                </button>
              </div>
              <input
                type="text"
                placeholder="Nhập bến xe kết thúc hoặc vị trí hiện tại"
                value={endTripData.location}
                onChange={(e) => setEndTripData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#004b87] focus:ring-4 focus:ring-[#004b87]/5"
                required
              />
            </div>

            {/* End KM */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Số km kết thúc (ODO) <span className="text-red-500">*</span></label>
              <input
                type="number"
                placeholder="Nhập chỉ số đồng hồ km cuối của xe"
                value={endTripData.km}
                onChange={(e) => setEndTripData(prev => ({ ...prev, km: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#004b87] focus:ring-4 focus:ring-[#004b87]/5"
                required
              />
            </div>

            {/* Odometer photo */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
                Ảnh đồng hồ km cuối
                <span className="ml-1.5 text-amber-500 font-bold text-xs normal-case">(Nên có)</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onloadend = () => {
                      setEndTripData(prev => ({ ...prev, proofImage: reader.result }))
                    }
                    reader.readAsDataURL(file)
                  }
                }}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-[#004b87] hover:file:bg-blue-100 cursor-pointer"
              />
              {endTripData.proofImage && (
                <div className="mt-2 relative w-full h-36 rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                  <img src={endTripData.proofImage} alt="Ảnh đồng hồ km" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setEndTripData(prev => ({ ...prev, proofImage: '' }))}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors border-none cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Vehicle photo */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
                Ảnh xe sau chuyến
                <span className="ml-1.5 text-slate-400 font-bold text-xs normal-case">(Không bắt buộc)</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onloadend = () => {
                      setEndTripData(prev => ({ ...prev, vehiclePhoto: reader.result }))
                    }
                    reader.readAsDataURL(file)
                  }
                }}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-slate-100 file:text-slate-600 hover:file:bg-slate-200 cursor-pointer"
              />
              {endTripData.vehiclePhoto && (
                <div className="mt-2 relative w-full h-36 rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                  <img src={endTripData.vehiclePhoto} alt="Ảnh xe sau chuyến" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setEndTripData(prev => ({ ...prev, vehiclePhoto: '' }))}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors border-none cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Vehicle condition */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Tình trạng xe sau chuyến <span className="text-red-500">*</span></label>
              <select
                value={endTripData.vehicleStatus}
                onChange={(e) => setEndTripData(prev => ({ ...prev, vehicleStatus: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#004b87]"
              >
                <option value="Bình thường">✅ Bình thường / Ổn định</option>
                <option value="Tốt">🟢 Tốt / Mới bảo dưỡng</option>
                <option value="Cần lưu ý nhẹ">🟡 Có vấn đề nhẹ (ghi chú bên dưới)</option>
                <option value="Cần bảo dưỡng">🔴 Cần bảo dưỡng / sửa chữa ngay</option>
              </select>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Ghi chú sau chuyến
                <span className="ml-1.5 text-slate-400 font-bold text-xs normal-case">(Không bắt buộc)</span>
              </label>
              <textarea
                placeholder="Ví dụ: trễ 15 phút do kẹt xe, xe bình thường, không phát sinh..."
                value={endTripData.notes}
                onChange={(e) => setEndTripData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#004b87] focus:ring-4 focus:ring-[#004b87]/5 resize-none"
              />
            </div>

            {/* Confirmation checkbox */}
            <div
              onClick={() => setEndTripData(prev => ({ ...prev, confirmedComplete: !prev.confirmedComplete }))}
              className={`flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                endTripData.confirmedComplete
                  ? 'bg-green-50 border-green-400'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                endTripData.confirmedComplete
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'bg-white border-slate-300'
              }`}>
                {endTripData.confirmedComplete && <Check className="h-3 w-3" />}
              </div>
              <div>
                <p className="text-sm font-black text-slate-700">Xác nhận đã hoàn tất hành trình <span className="text-red-500">*</span></p>
                <p className="text-xs text-slate-500 mt-0.5">Tôi xác nhận xe đã đến đúng điểm cuối và hành trình đã kết thúc hoàn toàn.</p>
              </div>
            </div>

          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setIsEndTripDialogOpen(false)}
              className="border-slate-200"
            >
              Hủy
            </Button>
            <Button
              variant="default"
              disabled={!endTripData.location || !endTripData.km || !endTripData.confirmedComplete}
              onClick={() => {
                const runningTrip = trips.find(t => t.status === 'DEPARTED' || t.status === 'INCIDENT')
                if (runningTrip) {
                  handleEndTrip(runningTrip.id)
                }
              }}
              className="bg-green-600 hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed font-bold"
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Xác nhận kết thúc chuyến
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== DIALOG: COMPLETED TRIP DETAIL ==================== */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailTrip && (() => {
            const startLog = detailTrip.journeyLogs?.find(l => l.type === 'START')
            const endLog = detailTrip.journeyLogs?.find(l => l.type === 'END')
            const totalKm = (endLog?.km && startLog?.km) ? endLog.km - startLog.km : null
            return (
              <>
                <DialogHeader className="pb-3">
                  <DialogTitle className="flex items-center gap-2 text-lg font-black text-slate-800">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                    </span>
                    Chi tiết chuyến đã hoàn thành
                  </DialogTitle>
                  <DialogDescription className="text-slate-500">
                    {detailTrip.from} → {detailTrip.to} • {detailTrip.licensePlate}
                  </DialogDescription>
                </DialogHeader>

                {/* Trip summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-2">
                  {[
                    { label: 'Giờ khởi hành', value: detailTrip.departureTime, icon: '🕐' },
                    { label: 'Giờ đến', value: detailTrip.arrivalTime, icon: '🏁' },
                    { label: 'Hành khách', value: `${detailTrip.passengerCount}/${detailTrip.maxPassengers}`, icon: '👥' },
                    { label: 'Quãng đường', value: totalKm !== null ? `${totalKm} km` : '—', icon: '📏' },
                  ].map(item => (
                    <div key={item.label} className="bg-slate-50 rounded-xl border border-slate-100 p-3 text-center">
                      <p className="text-lg">{item.icon}</p>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-wider mt-1">{item.label}</p>
                      <p className="text-sm font-extrabold text-slate-700 mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Lộ trình chi tiết */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-[#004b87] uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Báo cáo lộ trình & ODO
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Xuất phát */}
                    <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">
                          Từ
                        </div>
                        <div className="space-y-1">
                          <p className="font-extrabold text-slate-800 text-sm">Điểm xuất phát</p>
                          <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                            {startLog?.location || 'Chưa cập nhật'}
                          </p>
                          <div className="text-[10px] text-slate-400 font-bold mt-1">
                            ODO: {startLog?.km ? `${startLog.km} km` : '—'} • {startLog?.time ? new Date(startLog.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Kết thúc */}
                    <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">
                          Đến
                        </div>
                        <div className="space-y-1">
                          <p className="font-extrabold text-slate-800 text-sm">Điểm kết thúc</p>
                          <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                            {endLog?.location || 'Chưa cập nhật'}
                          </p>
                          <div className="text-[10px] text-slate-400 font-bold mt-1">
                            ODO: {endLog?.km ? `${endLog.km} km` : '—'} • {endLog?.time ? new Date(endLog.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tình trạng xe & Ghi chú */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-[#004b87] uppercase tracking-wider flex items-center gap-2">
                    <Info className="h-4 w-4" /> Tình trạng xe & Ghi chú cuối chuyến
                  </h3>
                  <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-450 font-bold">Tình trạng xe sau chuyến:</span>
                      <span className="text-slate-700 font-extrabold">{endLog?.vehicleStatus || 'Bình thường'}</span>
                    </div>
                    {endLog?.notes && (
                      <div className="pt-1">
                        <span className="text-slate-450 font-bold block mb-1">Ghi chú của tài xế:</span>
                        <p className="text-slate-650 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          {endLog.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hình ảnh minh chứng ODO / Xe */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-[#004b87] uppercase tracking-wider flex items-center gap-2">
                    <Camera className="h-4 w-4" /> Ảnh minh chứng chuyến đi
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Ảnh ODO đầu */}
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase text-center">Đồng hồ ODO xuất phát</p>
                      {startLog?.proofImage ? (
                        <div className="relative w-full h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer" onClick={() => window.open(startLog.proofImage)}>
                          <img src={startLog.proofImage} alt="ODO Start" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-full h-28 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-[10px] text-center px-2">
                          Không có ảnh
                        </div>
                      )}
                    </div>

                    {/* Ảnh ODO cuối */}
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase text-center">Đồng hồ ODO bến đến</p>
                      {endLog?.proofImage ? (
                        <div className="relative w-full h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer" onClick={() => window.open(endLog.proofImage)}>
                          <img src={endLog.proofImage} alt="ODO End" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-full h-28 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-[10px] text-center px-2">
                          Không có ảnh
                        </div>
                      )}
                    </div>

                    {/* Ảnh xe cuối chuyến */}
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase text-center">Ảnh xe sau chuyến đi</p>
                      {endLog?.vehiclePhoto ? (
                        <div className="relative w-full h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer" onClick={() => window.open(endLog.vehiclePhoto)}>
                          <img src={endLog.vehiclePhoto} alt="Vehicle End" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-full h-28 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-[10px] text-center px-2">
                          Không có ảnh
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )
          })}
        </DialogContent>
      </Dialog>
      {/* ==================== DIALOG: BÁO CÁO SỰ CỐ CHUYẾN XE ==================== */}
      <Dialog open={isIncidentDialogOpen} onOpenChange={setIsIncidentDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              BÁO CÁO SỰ CỐ CHUYẾN XE
            </DialogTitle>
            <DialogDescription className="text-slate-505 text-xs font-semibold">
              Vui lòng cung cấp chi tiết sự cố gặp phải để nhận trợ giúp từ Ban điều phối.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-4 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100/80 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-450 font-bold">Chuyến xe:</span>
                <span className="text-slate-800 font-extrabold">{incidentTrip?.from} → {incidentTrip?.to}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450 font-bold">Biển số xe:</span>
                <span className="text-slate-800 font-extrabold">{incidentTrip?.licensePlate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450 font-bold">Trạng thái hiện tại:</span>
                <Badge className="bg-[#004b87] text-white">Đang vận hành</Badge>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Loại sự cố *</label>
              <select
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-red-500"
              >
                <option value="Xe gặp vấn đề">Xe gặp vấn đề (Hỏng hóc, máy nóng, thủng lốp, lỗi phanh...)</option>
                <option value="Trễ giờ / kẹt xe">Trễ giờ / kẹt xe (Kẹt xe, đường cấm, thời tiết xấu...)</option>
                <option value="Tai nạn / va chạm">Tai nạn / va chạm (Va quẹt nhẹ, tai nạn, dừng khẩn cấp...)</option>
                <option value="Hành khách có vấn đề">Hành khách có vấn đề (Vắng mặt, lên sai điểm, gây rối...)</option>
                <option value="Hàng hóa có vấn đề">Hàng hóa có vấn đề (Móp méo, rách, thất lạc...)</option>
                <option value="Sai lịch trình">Sai lịch trình (Sai điểm đón, sai tuyến, nhầm xe...)</option>
                <option value="Sự cố khác">Sự cố khác (Vấn đề phát sinh khác...)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Mức độ sự cố *</label>
              <div className="flex gap-2.5">
                {['Nhẹ', 'Trung bình', 'Nghiêm trọng'].map((lvl) => {
                  let color = 'border-slate-200 text-slate-650 hover:bg-slate-50'
                  if (incidentSeverity === lvl) {
                    if (lvl === 'Nhẹ') color = 'bg-yellow-50 border-yellow-400 text-yellow-800'
                    else if (lvl === 'Trung bình') color = 'bg-orange-50 border-orange-400 text-orange-800'
                    else color = 'bg-red-50 border-red-500 text-red-800'
                  }
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setIncidentSeverity(lvl)}
                      className={`flex-1 py-2 px-3 border-2 rounded-xl text-center font-black transition-all cursor-pointer ${color}`}
                    >
                      {lvl}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Vị trí hiện tại *</label>
                <button
                  type="button"
                  onClick={() => handleGetCurrentLocation('incident')}
                  disabled={isLocLoading}
                  className="text-xs font-extrabold text-[#004b87] hover:underline flex items-center gap-1 bg-transparent border-none cursor-pointer disabled:text-slate-400"
                >
                  <MapPin className={`h-3.5 w-3.5 ${isLocLoading ? 'animate-bounce' : ''}`} />
                  {isLocLoading ? 'Đang định vị...' : 'Tự động lấy vị trí'}
                </button>
              </div>
              <input
                type="text"
                placeholder="Nhập vị trí hiện tại hoặc tọa độ GPS"
                value={incidentLoc}
                onChange={(e) => setIncidentLoc(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Mô tả sự cố *</label>
              <textarea
                placeholder="Nhập nội dung chi tiết sự cố xảy ra..."
                value={incidentDesc}
                onChange={(e) => setIncidentDesc(e.target.value)}
                rows={3}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 resize-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Ảnh minh chứng *</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onloadend = () => {
                      setIncidentImage(reader.result)
                    }
                    reader.readAsDataURL(file)
                  }
                }}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer"
              />
              {incidentImage && (
                <div className="mt-2.5 relative w-full h-36 rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                  <img src={incidentImage} alt="Incident proof" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setIncidentImage('')}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors border-none cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Ghi chú thêm</label>
              <textarea
                placeholder="Nhập ghi chú thêm nếu có..."
                value={incidentNotes}
                onChange={(e) => setIncidentNotes(e.target.value)}
                rows={2}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 resize-none"
              />
            </div>

            <div
              onClick={() => setChangeStatusToIncident(!changeStatusToIncident)}
              className={`flex items-start gap-3 rounded-xl border-2 p-3.5 cursor-pointer transition-all ${
                changeStatusToIncident
                  ? 'bg-red-50/50 border-red-300'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                changeStatusToIncident
                  ? 'bg-red-500 border-red-500 text-white'
                  : 'bg-white border-slate-300'
              }`}>
                {changeStatusToIncident && <Check className="h-3 w-3" />}
              </div>
              <div>
                <p className="font-black text-slate-700 text-xs">Đổi trạng thái chuyến xe sang "Có sự cố"</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Hệ thống sẽ cập nhật trạng thái chuyến đi thành "Có sự cố" trên bảng điều hành Admin.</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsIncidentDialogOpen(false)}
              className="border-slate-200 h-9 px-4 text-xs rounded-xl"
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              disabled={!incidentLoc || !incidentDesc || !incidentImage}
              onClick={handleSendIncidentReport}
              className="bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-450 disabled:cursor-not-allowed h-9 px-4 text-xs font-black rounded-xl"
            >
              Gửi báo cáo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
