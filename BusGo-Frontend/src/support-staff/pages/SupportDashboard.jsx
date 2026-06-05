import React, { useState, useEffect, useRef } from 'react'
import { getChatSessionsAPI, getCancellationRequestsAPI, checkCancellationAPI, processCancellationAPI, getChatMessagesAPI, getCustomerTicketsAPI, closeChatSessionAPI, sendChatMessageAPI } from '../../services/supportService'
import { toast } from '../../utils/toastService'
import { AuthUtil } from '../../utils/helpers'
import {
  MessageCircle, FileText, LogOut, Menu, X, Send, Search, Bell,
  CheckCircle, AlertCircle, Clock, DollarSign, Phone, Mail, MapPin,
  Users, Ticket, Calendar, ChevronRight, ArrowRight, Grid, User, RefreshCw
} from 'lucide-react'

// Import custom UI components
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'

function SupportDashboard() {
  // Layout States
  const [isSidebarPinned, setIsSidebarPinned] = useState(false)
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)
  const isSidebarCollapsed = !isSidebarPinned && !isSidebarHovered
  const [activeTab, setActiveTab] = useState('overview') // overview, chat, cancellation
  const [searchQuery, setSearchQuery] = useState('')

  // User
  const currentUser = AuthUtil.getCurrentUser()

  // ==================== CHAT STATES ====================
  const [chatSessions, setChatSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loadingChat, setLoadingChat] = useState(false)
  const [customerTickets, setCustomerTickets] = useState([])
  const messagesEndRef = useRef(null)

  // Ref to activeSession to prevent stale closures in polling interval
  const activeSessionRef = useRef(activeSession)
  useEffect(() => {
    activeSessionRef.current = activeSession
  }, [activeSession])

  // ==================== CANCELLATION STATES ====================
  const [cancellations, setCancellations] = useState([])
  const [cancellationFilter, setCancellationFilter] = useState('pending')
  const [selectedTicketId, setSelectedTicketId] = useState(null)
  const [eligibilityData, setEligibilityData] = useState(null)
  const [loadingCancellation, setLoadingCancellation] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)

  // ==================== OVERVIEW STATS ====================
  const stats = {
    activeSessions: chatSessions.filter(s => s.trangThai === 'active').length,
    pendingCancellations: cancellations.filter(c => c.trangThai === 'pending').length,
    completedToday: chatSessions.filter(s => s.trangThai === 'closed').length,
    totalCustomers: new Set(chatSessions.map(s => s.maKhachHang)).size
  }

  // ==================== FETCH FUNCTIONS ====================
  const fetchChatSessions = async () => {
    setLoadingChat(true)
    try {
      const data = await getChatSessionsAPI()
      setChatSessions(data.chatSessions || [])
    } catch (error) {
      console.error(error)
      if (activeTab === 'chat') toast.error('Không thể tải danh sách chat')
    } finally {
      setLoadingChat(false)
    }
  }

  const fetchCancellations = async () => {
    setLoadingCancellation(true)
    try {
      const data = await getCancellationRequestsAPI(cancellationFilter === 'all' ? null : cancellationFilter)
      setCancellations(data.requests || [])
    } catch (error) {
      console.error(error)
      if (activeTab === 'cancellation') toast.error('Không thể tải danh sách yêu cầu')
    } finally {
      setLoadingCancellation(false)
    }
  }

  // ==================== EFFECTS ====================
  useEffect(() => {
    fetchChatSessions()
    fetchCancellations()
    const interval = setInterval(() => {
      fetchChatSessions()
      const currSession = activeSessionRef.current
      if (currSession) {
        fetchChatMessages(currSession.maChatSession, false)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (activeTab === 'cancellation') {
      fetchCancellations()
    }
  }, [cancellationFilter])

  // Reset local search query on tab change
  useEffect(() => {
    setSearchQuery('')
  }, [activeTab])

  // ==================== CHAT FUNCTIONS ====================
  const fetchChatMessages = async (sessionId, showLoading = true) => {
    if (showLoading) setLoadingChat(true)
    try {
      const data = await getChatMessagesAPI(sessionId)
      setMessages(data.messages || [])
      scrollToBottom()

      // Load tickets if customer ID exists
      if (data.session?.maKhachHang && showLoading) {
        const ticketData = await getCustomerTicketsAPI(data.session.maKhachHang)
        setCustomerTickets(ticketData.tickets || [])
      }
    } catch (error) {
      console.error(error)
      if (showLoading) toast.error('Không thể tải tin nhắn')
    } finally {
      if (showLoading) setLoadingChat(false)
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleSelectSession = (session) => {
    setActiveSession(session)
    setCustomerTickets([])
    fetchChatMessages(session.maChatSession)
  }

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault()
    if (!newMessage.trim() || !activeSession) return

    try {
      await sendChatMessageAPI(activeSession.maChatSession, newMessage)
      setNewMessage('')
      fetchChatMessages(activeSession.maChatSession, false)
    } catch (error) {
      toast.error(error.message || 'Lỗi gửi tin nhắn')
    }
  }

  const handleCloseSession = async () => {
    if (!activeSession || !window.confirm('Bạn có chắc chắn muốn đóng phiên chat này?')) return

    try {
      await closeChatSessionAPI(activeSession.maChatSession)
      toast.success('Đã đóng phiên chat')
      setActiveSession(null)
      setCustomerTickets([])
      fetchChatSessions()
    } catch (error) {
      toast.error(error.message || 'Lỗi đóng phiên chat')
    }
  }

  // ==================== CANCELLATION FUNCTIONS ====================
  const handleCheckEligibility = async (ticketId) => {
    setSelectedTicketId(ticketId)
    setLoadingCancellation(true)
    setEligibilityData(null)
    setShowRejectInput(false)

    try {
      const data = await checkCancellationAPI(ticketId)
      setEligibilityData(data)
    } catch (error) {
      toast.error(error.message || 'Lỗi kiểm tra điều kiện')
    } finally {
      setLoadingCancellation(false)
    }
  }

  const handleProcessCancellation = async (action) => {
    if (action === 'reject' && !showRejectInput) {
      setShowRejectInput(true)
      return
    }

    if (action === 'reject' && !rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối')
      return
    }

    if (!window.confirm(`Xác nhận ${action === 'approve' ? 'PHÊ DUYỆT' : 'TỪ CHỐI'} yêu cầu hủy vé này? (Sẽ xử lý TẤT CẢ vé trong booking)`)) return

    try {
      const payload = {
        hanh_dong: action,
        lyDoHuy: 'Yêu cầu hủy từ khách hàng'
      }
      if (action === 'reject') {
        payload.lyDoTuChoi = rejectReason
      }

      const result = await processCancellationAPI(selectedTicketId, payload)
      toast.success(result.message || (action === 'approve' ? 'Đã phê duyệt hủy vé' : 'Đã từ chối yêu cầu'))
      setSelectedTicketId(null)
      setEligibilityData(null)
      setShowRejectInput(false)
      setRejectReason('')
      fetchCancellations()
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Lỗi xử lý yêu cầu')
    }
  }

  const handleLogout = () => {
    AuthUtil.logout()
    setTimeout(() => window.location.href = '/login', 500)
  }

  // Unified Search filter based on activeTab
  const filteredChatSessions = chatSessions.filter(s =>
    s.tenKhachHang?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.emailKhach?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredCancellations = cancellations.filter(c =>
    c.hoTenHanhKhach?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.soDienThoaiHanhKhach?.includes(searchQuery)
  )

  // Sidebar item component
  const SidebarItem = ({ tabId, icon: Icon, label, badgeCount, badgeColor }) => {
    const isActive = activeTab === tabId
    return (
      <button
        onClick={() => {
          setActiveTab(tabId)
        }}
        className={`flex items-center w-full rounded-xl py-3.5 text-sm font-extrabold tracking-wide transition-all group duration-200 border-none bg-transparent cursor-pointer ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4'
          } ${isActive
            ? 'bg-sky-50 text-[#004b87]'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
      >
        <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'} flex items-center`}>
          <Icon className={`h-5 w-5 ${isActive ? 'text-[#004b87]' : 'text-slate-400 group-hover:text-slate-600'}`} />
        </div>
        {!isSidebarCollapsed && (
          <span className="ml-3 truncate flex-1 text-left">
            {label}
          </span>
        )}
        {!isSidebarCollapsed && badgeCount > 0 && (
          <span className={`px-2 py-0.5 text-xs font-black rounded-full ${badgeColor}`}>
            {badgeCount}
          </span>
        )}
      </button>
    )
  }

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-x-hidden antialiased">
      {/* ==================== LEFT SIDEBAR ==================== */}
      <aside
        onMouseEnter={() => !isSidebarPinned && setIsSidebarHovered(true)}
        onMouseLeave={() => !isSidebarPinned && setIsSidebarHovered(false)}
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-slate-100 flex flex-col justify-between py-6 px-4 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64 shadow-[10px_0_30px_-15px_rgba(0,0,0,0.03)]'
          }`}
      >
        <div className="space-y-6">
          {/* User Info Header */}
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between px-2'}`}>
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 bg-[#004b87] rounded-xl flex items-center justify-center shadow-lg shadow-[#004b87]/20 text-white font-black text-sm uppercase flex-shrink-0">
                {currentUser?.name?.charAt(0) || 'S'}
              </div>
              {!isSidebarCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-black text-slate-800 truncate leading-tight">
                    {currentUser?.name || 'Hỗ trợ viên'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                    Nhân viên Hỗ trợ
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
            <SidebarItem tabId="chat" icon={MessageCircle} label="Chat hỗ trợ" badgeCount={stats.activeSessions} badgeColor="bg-red-500 text-white" />
            <SidebarItem tabId="cancellation" icon={FileText} label="Hoàn/Hủy vé" badgeCount={stats.pendingCancellations} badgeColor="bg-orange-500 text-white" />
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
            onClick={handleLogout}
            className={`flex items-center rounded-xl py-3.5 text-sm font-extrabold text-red-500 hover:bg-red-55 w-full transition-all border-none bg-transparent cursor-pointer ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4'
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
          {/* Search bar */}
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={activeTab === 'chat' ? 'Tìm nhanh theo tên khách, email...' : activeTab === 'cancellation' ? 'Tìm theo tên hành khách, số điện thoại...' : 'Tìm kiếm nhanh...'}
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
            <button className="relative p-2.5 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-full border-none bg-transparent cursor-pointer transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#004b87] to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
              {currentUser?.name?.charAt(0) || 'S'}
            </div>
          </div>
        </header>

        {/* ==================== CONTENT BODY ==================== */}
        <main className="flex-1 overflow-hidden p-6 md:p-8 flex flex-col bg-slate-50">

          {/* ==================== TAB: OVERVIEW ==================== */}
          {activeTab === 'overview' && (
            <div className="flex-1 overflow-y-auto space-y-8 animate-fadeIn">
              {/* Welcome Banner */}
              <Card className="border-none bg-gradient-to-r from-[#004b87] to-sky-700 text-white relative overflow-hidden shadow-lg shadow-[#004b87]/15">
                <div className="absolute top-[-50%] right-[-10%] w-96 h-96 bg-white/5 rounded-full blur-[80px]" />
                <div className="absolute bottom-[-40%] left-[20%] w-60 h-60 bg-sky-400/10 rounded-full blur-[60px]" />

                <CardContent className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="space-y-2">
                    <span className="text-sky-200 text-xs font-black tracking-widest uppercase">Trang quản trị soát vé & hỗ trợ</span>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight">Xin chào, {currentUser?.name || 'Hỗ trợ viên'}</h1>
                    <p className="text-sky-100 text-sm font-semibold flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      Chúc bạn một ngày làm việc hiệu quả và hỗ trợ khách hàng tốt nhất!
                    </p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md p-3.5 px-5 rounded-2xl border border-white/10 shadow-inner w-full md:w-auto">
                    <p className="text-[10px] font-black text-sky-200 uppercase tracking-wider">Phiên chat hoạt động</p>
                    <span className="text-lg font-black mt-0.5 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                      {stats.activeSessions} Phòng đang mở
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { icon: MessageCircle, label: 'Chat Hoạt Động', value: stats.activeSessions, color: 'blue', desc: 'Đang chat với khách' },
                  { icon: Ticket, label: 'Yêu cầu hoàn/hủy', value: stats.pendingCancellations, color: 'orange', desc: 'Chờ kiểm tra & duyệt' },
                  { icon: CheckCircle, label: 'Đã đóng hôm nay', value: stats.completedToday, color: 'green', desc: 'Hoàn thành hỗ trợ' },
                  { icon: Users, label: 'Khách hàng hỗ trợ', value: stats.totalCustomers, color: 'purple', desc: 'Tổng khách liên hệ' }
                ].map((stat, i) => {
                  const colorClass = {
                    blue: 'bg-blue-50 text-[#004b87] border-blue-100',
                    orange: 'bg-orange-50 text-orange-600 border-orange-100',
                    green: 'bg-green-50 text-green-600 border-green-100',
                    purple: 'bg-purple-50 text-purple-600 border-purple-100'
                  }[stat.color]

                  return (
                    <Card key={i} className="hover:shadow-md border-slate-100/80 transition-shadow">
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

              {/* Shortcuts Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card
                  onClick={() => setActiveTab('chat')}
                  className="bg-gradient-to-br from-blue-50/50 to-blue-50 border border-blue-100 hover:border-blue-200 rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all group"
                >
                  <CardContent className="p-0 flex items-start justify-between">
                    <div className="space-y-4 flex-1">
                      <div className="w-14 h-14 bg-gradient-to-br from-[#004b87] to-blue-600 rounded-2xl flex items-center justify-center shadow-md shadow-[#004b87]/15 group-hover:scale-105 transition-transform duration-300">
                        <MessageCircle className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 text-lg">Hộp thư hỗ trợ chat</h3>
                        <p className="text-slate-500 font-semibold text-xs mt-1">Hỗ trợ khách hàng trực tuyến, giải đáp thắc mắc dịch vụ và đặt vé nhanh chóng.</p>
                      </div>
                      <span className="text-xs font-black text-[#004b87] inline-flex items-center gap-1.5 group-hover:underline">
                        Bắt đầu hỗ trợ <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                    <div className="text-3xl font-black text-[#004b87] bg-white w-12 h-12 rounded-full flex items-center justify-center border border-blue-100 shadow-inner">
                      {stats.activeSessions}
                    </div>
                  </CardContent>
                </Card>

                <Card
                  onClick={() => setActiveTab('cancellation')}
                  className="bg-gradient-to-br from-orange-50/50 to-orange-50 border border-orange-100 hover:border-orange-200 rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all group"
                >
                  <CardContent className="p-0 flex items-start justify-between">
                    <div className="space-y-4 flex-1">
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-md shadow-orange-500/15 group-hover:scale-105 transition-transform duration-300">
                        <FileText className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 text-lg">Yêu cầu Hoàn/Hủy vé</h3>
                        <p className="text-slate-500 font-semibold text-xs mt-1">Kiểm tra điều kiện hủy vé của khách hàng dựa trên chính sách giờ và thực hiện duyệt hoàn tiền.</p>
                      </div>
                      <span className="text-xs font-black text-orange-600 inline-flex items-center gap-1.5 group-hover:underline">
                        Duyệt yêu cầu ngay <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                    <div className="text-3xl font-black text-orange-600 bg-white w-12 h-12 rounded-full flex items-center justify-center border border-orange-100 shadow-inner">
                      {stats.pendingCancellations}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ==================== TAB: CHAT ==================== */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex overflow-hidden gap-6 animate-fadeIn relative">
              {/* Left Column: Chat Sessions list */}
              <div className="w-80 md:w-96 bg-white rounded-2xl border border-slate-100 flex flex-col overflow-hidden shadow-sm flex-shrink-0">
                <div className="p-4 border-b border-slate-100 bg-slate-50/20 flex-shrink-0">
                  <h3 className="font-black text-slate-800 text-sm mb-2">Cuộc hội thoại hỗ trợ</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm theo tên, email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 text-xs font-semibold focus:outline-none focus:border-[#004b87] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Session Cards list */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {filteredChatSessions.length > 0 ? (
                    filteredChatSessions.map(session => {
                      const isActive = activeSession?.maChatSession === session.maChatSession
                      return (
                        <button
                          key={session.maChatSession}
                          onClick={() => handleSelectSession(session)}
                          className={`w-full text-left p-3.5 rounded-xl transition-all duration-200 border-none cursor-pointer block ${isActive
                              ? 'bg-[#004b87] text-white shadow-md shadow-[#004b87]/15'
                              : session.trangThai === 'closed'
                                ? 'bg-slate-50/65 hover:bg-slate-100/80 text-slate-400'
                                : 'bg-white hover:bg-slate-50 border border-slate-100 hover:border-slate-200 text-slate-700'
                            }`}
                        >
                          <div className="flex justify-between items-center mb-1.5">
                            <h4 className={`font-extrabold text-xs truncate max-w-[180px] ${isActive ? 'text-white' : 'text-slate-800'}`}>
                              {session.tenKhachHang}
                            </h4>
                            {session.trangThai === 'closed' ? (
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${isActive ? 'bg-blue-800/40 text-blue-100' : 'bg-slate-100 text-slate-400'
                                }`}>
                                Đã đóng
                              </span>
                            ) : (
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-black flex items-center gap-1 ${isActive ? 'bg-white/20 text-green-300' : 'bg-green-50 text-green-600'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isActive ? 'bg-green-300' : 'bg-green-500'}`}></span>
                                Live
                              </span>
                            )}
                          </div>
                          <p className={`text-[11px] truncate ${isActive ? 'text-sky-100 font-semibold' : 'text-slate-500 font-medium'}`}>
                            {session.tinNhanCuoi || 'Bắt đầu cuộc trò chuyện...'}
                          </p>
                        </button>
                      )
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 p-6">
                      <MessageCircle className="w-10 h-10 opacity-20" />
                      <p className="text-xs font-bold">Không tìm thấy phòng chat</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Center Panel: Messaging area */}
              <div className="flex-1 bg-white rounded-2xl border border-slate-100 flex flex-col overflow-hidden shadow-sm">
                {activeSession ? (
                  <>
                    {/* Header */}
                    <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50/30 to-transparent flex-shrink-0">
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-sm">{activeSession.tenKhachHang}</h3>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">{activeSession.emailKhach}</p>
                      </div>
                      {activeSession.trangThai !== 'closed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCloseSession}
                          className="border-red-100 text-red-600 hover:bg-red-50 h-8 rounded-lg font-bold text-xs"
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          Đóng phòng
                        </Button>
                      )}
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-slate-50/50 to-white flex flex-col scrollbar-thin">
                      {messages.map(msg => {
                        const isAgent = msg.nguoiGui === 'agent'
                        return (
                          <div key={msg.maTinNhan} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                            <div className="space-y-1 max-w-[70%]">
                              <div
                                className={`px-4 py-2.5 rounded-2xl shadow-sm text-xs font-semibold leading-relaxed break-words ${isAgent
                                    ? 'bg-gradient-to-r from-[#004b87] to-blue-600 text-white rounded-tr-none'
                                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                                  }`}
                              >
                                {msg.noiDung}
                              </div>
                              <p className={`text-[9px] font-bold px-1 ${isAgent ? 'text-right text-slate-400' : 'text-left text-slate-400'}`}>
                                {new Date(msg.thoiGianGui).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Replies Panel */}
                    {activeSession.trangThai !== 'closed' && (
                      <div className="px-6 py-2.5 bg-slate-50/60 border-t border-slate-100 flex gap-2 overflow-x-auto scrollbar-none flex-shrink-0">
                        {[
                          "Chào bạn, chúng tôi rất hân hạnh được phục vụ!",
                          "Bạn cần hỗ trợ vấn đề gì ạ?",
                          "Quy trình Đặt vé: Bạn chọn chuyến, vị trí ghế và thanh toán trên hệ thống nhé.",
                          "Hủy vé/Hoàn tiền: Bạn vào Lịch sử vé, gửi Yêu cầu hủy trước giờ khởi hành.",
                          "Vui lòng cung cấp Mã vé hoặc SĐT để chúng tôi kiểm tra chi tiết."
                        ].map((text, idx) => (
                          <button
                            key={idx}
                            onClick={() => setNewMessage(text)}
                            className="whitespace-nowrap px-3 py-1.5 bg-white border border-slate-200 hover:border-[#004b87]/30 text-slate-600 hover:text-[#004b87] hover:bg-sky-50/20 text-[10px] font-bold rounded-full transition-all flex-shrink-0 shadow-sm cursor-pointer"
                          >
                            {text}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Input Field form */}
                    {activeSession.trangThai !== 'closed' ? (
                      <form onSubmit={handleSendMessage} className="h-16 border-t border-slate-100 px-6 flex items-center gap-3 bg-white flex-shrink-0">
                        <input
                          type="text"
                          placeholder="Nhập tin nhắn phản hồi..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="flex-1 px-4 py-2 border border-slate-200 rounded-full bg-slate-50/50 text-xs font-semibold focus:outline-none focus:border-[#004b87] focus:bg-white transition-all"
                        />
                        <Button
                          type="submit"
                          disabled={!newMessage.trim()}
                          className="bg-gradient-to-r from-[#004b87] to-blue-600 text-white rounded-full w-9 h-9 p-0 flex items-center justify-center hover:shadow-md transition-shadow disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </form>
                    ) : (
                      <div className="h-16 bg-slate-50 border-t border-slate-100 flex items-center justify-center text-slate-400 text-xs font-extrabold flex-shrink-0">
                        ✓ Cuộc hội thoại này đã được kết thúc và đóng phòng
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-3 p-8">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-350">
                      <MessageCircle className="w-8 h-8 opacity-30" />
                    </div>
                    <p className="text-sm font-bold text-slate-400">Chọn một cuộc trò chuyện từ danh sách để hỗ trợ</p>
                  </div>
                )}
              </div>

              {/* Right Panel: Customer Tickets */}
              {activeSession && (
                <aside className="w-80 bg-white rounded-2xl border border-slate-100 flex flex-col overflow-hidden shadow-sm flex-shrink-0">
                  <div className="h-16 border-b border-slate-100 px-5 flex items-center bg-gradient-to-r from-slate-50/30 to-transparent flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-[#004b87]" />
                      <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">Lịch sử đặt vé</h3>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {customerTickets.length > 0 ? (
                      customerTickets.map(ticket => (
                        <Card key={ticket.maVe} className="border-slate-100 hover:shadow-md transition-shadow bg-gradient-to-br from-white to-slate-50/20">
                          <CardContent className="p-4 space-y-4">
                            {/* Ticket header details */}
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-extrabold text-slate-800 text-xs">Mã vé #{ticket.maVe}</h4>
                                <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                                  Ngày đặt: {new Date(ticket.ngayDatVe).toLocaleDateString('vi-VN')}
                                </p>
                              </div>
                              <Badge className={`text-[9px] font-black tracking-wide border-none ${ticket.trangThaiVe === 'da_thanh_toan'
                                  ? 'bg-green-50 text-green-700'
                                  : ticket.trangThaiVe === 'da_su_dung'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'bg-red-50 text-red-600'
                                }`}>
                                {ticket.trangThaiVe === 'da_thanh_toan' ? 'Chờ chạy' : ticket.trangThaiVe === 'da_su_dung' ? 'Đã chạy' : 'Đã hủy'}
                              </Badge>
                            </div>

                            {/* Ticket Route visual representation */}
                            <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50 space-y-1.5 text-[11px] font-bold text-slate-600">
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#004b87]" />
                                <span className="truncate">{ticket.chuyenXe?.diemDi || 'N/A'}</span>
                              </div>
                              <div className="h-3 border-l border-dashed border-[#004b87] ml-[2.5px] -my-1" />
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                <span className="truncate">{ticket.chuyenXe?.diemDen || 'N/A'}</span>
                              </div>
                            </div>

                            {/* Compact Grid */}
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div className="bg-white rounded-lg p-2 border border-slate-100">
                                <p className="text-slate-400 font-bold">Số ghế</p>
                                <p className="text-slate-800 font-black mt-0.5 text-xs">{ticket.soGhe || 'N/A'}</p>
                              </div>
                              <div className="bg-white rounded-lg p-2 border border-slate-100">
                                <p className="text-slate-400 font-bold">Giờ đi</p>
                                <p className="text-slate-800 font-black mt-0.5 text-xs">{ticket.chuyenXe?.gioDi || 'N/A'}</p>
                              </div>
                              <div className="bg-white rounded-lg p-2 border border-slate-100">
                                <p className="text-slate-400 font-bold">Giá vé</p>
                                <p className="text-green-600 font-black mt-0.5">{(ticket.giaVe || 0).toLocaleString()} đ</p>
                              </div>
                              <div className="bg-white rounded-lg p-2 border border-slate-100">
                                <p className="text-slate-400 font-bold">Thực trả</p>
                                <p className="text-green-600 font-black mt-0.5">{(ticket.giaThanhToan || 0).toLocaleString()} đ</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 p-6">
                        <Ticket className="w-8 h-8 opacity-20" />
                        <p className="text-[11px] font-bold text-center">Khách chưa có giao dịch vé nào</p>
                      </div>
                    )}
                  </div>
                </aside>
              )}
            </div>
          )}

          {/* ==================== TAB: CANCELLATION ==================== */}
          {activeTab === 'cancellation' && (
            <div className="flex-1 flex overflow-hidden gap-6 animate-fadeIn relative">

              {/* Left Column: Requests list */}
              <div className="w-85 md:w-[45%] bg-white rounded-2xl border border-slate-100 flex flex-col overflow-hidden shadow-sm flex-shrink-0">
                <div className="p-4 border-b border-slate-100 bg-slate-50/20 flex-shrink-0 space-y-3">
                  <div className="flex gap-1.5 flex-wrap">
                    {['pending', 'approved', 'rejected', 'all'].map(status => (
                      <button
                        key={status}
                        onClick={() => setCancellationFilter(status)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all duration-150 cursor-pointer border-none ${cancellationFilter === status
                            ? 'bg-[#004b87] text-white shadow-sm shadow-[#004b87]/10'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                      >
                        {status === 'pending' ? 'Đang chờ' : status === 'approved' ? 'Đã duyệt' : status === 'rejected' ? 'Từ chối' : 'Tất cả'}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm theo tên khách, sđt..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 text-xs font-semibold focus:outline-none focus:border-[#004b87] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* List Body */}
                <div className="flex-1 overflow-y-auto division-y divide-slate-100">
                  {loadingCancellation ? (
                    <div className="p-8 text-center text-slate-400 text-xs font-bold">Đang tải yêu cầu...</div>
                  ) : filteredCancellations.length > 0 ? (
                    filteredCancellations.map(req => {
                      const isSelected = selectedTicketId === req.maVe
                      return (
                        <button
                          key={req.maYeuCau}
                          onClick={() => handleCheckEligibility(req.maVe)}
                          className={`w-full text-left p-4 hover:bg-slate-50/50 transition-all border-l-4 border-y border-y-slate-50 cursor-pointer block ${isSelected
                              ? 'border-[#004b87] bg-blue-50/20'
                              : 'border-transparent'
                            }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-extrabold text-slate-800 text-xs">Mã vé #{req.maVe}</div>
                              <div className="text-[10px] text-slate-400 font-bold mt-0.5">({req.soVeInBooking} vé cùng Booking)</div>
                            </div>
                            <Badge className={`text-[9px] font-black tracking-wide border-none ${req.trangThai === 'pending' ? 'bg-yellow-50 text-yellow-750' :
                                req.trangThai === 'approved' ? 'bg-green-50 text-green-700' :
                                  'bg-red-50 text-red-650'
                              }`}>
                              {req.trangThai === 'pending' ? 'Đang chờ' : req.trangThai === 'approved' ? 'Phê duyệt' : 'Từ chối'}
                            </Badge>
                          </div>

                          <div className="space-y-1 text-slate-600 font-semibold text-[11px]">
                            <p className="text-slate-800 font-extrabold">{req.hoTenHanhKhach} — {req.soDienThoaiHanhKhach}</p>
                            <p className="text-slate-400 flex items-center gap-1.5 mt-1 font-bold">
                              <MapPin className="w-3 h-3 text-[#004b87] flex-shrink-0" />
                              <span className="truncate">{req.diemDi} → {req.diemDen}</span>
                            </p>
                          </div>

                          {req.danhSachVe && req.danhSachVe.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2.5">
                              {req.danhSachVe.map(ve => (
                                <span key={ve.maVe} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black">
                                  Ghế {ve.soGhe || 'N/A'}
                                </span>
                              ))}
                            </div>
                          )}
                        </button>
                      )
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 p-6">
                      <FileText className="w-10 h-10 opacity-20" />
                      <p className="text-xs font-bold">Không có yêu cầu nào phù hợp</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Check details & process */}
              <div className="flex-1 bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm flex flex-col">
                {(() => {
                  const selectedReq = cancellations.find(c => c.maVe === selectedTicketId)
                  return selectedTicketId && eligibilityData ? (
                    <>
                      {/* Check Eligibility Header Banner */}
                      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-transparent flex-shrink-0">
                        <h3 className="font-black text-slate-800 text-sm mb-3">Kết quả thẩm định Vé #{selectedTicketId}</h3>

                        {eligibilityData.eligibility.coTheHoan ? (
                          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-start gap-3 shadow-inner">
                            <span className="text-lg">✅</span>
                            <div>
                              <p className="font-extrabold text-xs">HỢP LỆ HOÀN TIỀN</p>
                              <p className="text-[10px] font-bold text-green-600/90 mt-1">Yêu cầu được gửi trước giờ khởi hành {eligibilityData.eligibility.hoursUntilDeparture} tiếng.</p>
                            </div>
                          </div>
                        ) : eligibilityData.eligibility.coTheHuy ? (
                          <div className="bg-orange-50 border border-orange-200 text-orange-700 p-4 rounded-xl flex items-start gap-3 shadow-inner">
                            <span className="text-lg">⚠️</span>
                            <div>
                              <p className="font-extrabold text-xs">CÓ THỂ HỦY (KHÔNG HOÀN TIỀN)</p>
                              <p className="text-[10px] font-bold text-orange-600/90 mt-1">Vé được phép hủy bỏ khỏi sơ đồ ghế nhưng không đủ điều kiện hoàn trả lại tiền thanh toán.</p>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3 shadow-inner">
                            <span className="text-lg">❌</span>
                            <div>
                              <p className="font-extrabold text-xs">KHÔNG THỂ HỦY VÉ</p>
                              <p className="text-[10px] font-bold text-red-600/90 mt-1">Lý do: {eligibilityData.eligibility.lyDoKhongHuy}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Request details & Refund Calculation body */}
                      <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* List of tickets in this Booking */}
                        {selectedReq && selectedReq.danhSachVe && selectedReq.danhSachVe.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">Danh sách vé trong Booking</h4>
                            <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
                              <Table>
                                <TableHeader className="bg-slate-50/70 text-[10px]">
                                  <TableRow>
                                    <TableHead className="h-9">Mã vé</TableHead>
                                    <TableHead className="h-9">Số ghế</TableHead>
                                    <TableHead className="h-9">Trạng thái</TableHead>
                                    <TableHead className="h-9 text-right">Giá vé</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody className="text-xs">
                                  {selectedReq.danhSachVe.map(ve => (
                                    <TableRow key={ve.maVe} className="h-10 hover:bg-slate-50/50">
                                      <TableCell className="font-extrabold text-[#004b87]">#{ve.maVe}</TableCell>
                                      <TableCell className="font-bold text-slate-700">{ve.soGhe || 'N/A'}</TableCell>
                                      <TableCell>
                                        <Badge className={`text-[9px] font-bold border-none ${ve.trangThaiVe === 'da_huy' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'
                                          }`}>
                                          {ve.trangThaiVe === 'da_huy' ? 'Đã hủy' : 'Đang xử lý'}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right font-black text-green-600">
                                        {(ve.giaThanhToan || 0).toLocaleString()} đ
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        )}

                        {/* Refund Calculator Breakdown */}
                        <div className="space-y-3">
                          <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">Cách thức tính toán hoàn tiền</h4>
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3 text-xs font-semibold">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Giá vé gốc booking:</span>
                              <span className="font-extrabold text-slate-800">{eligibilityData.refundCalculation.giaVeGoc.toLocaleString()} đ</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Chính sách áp dụng:</span>
                              <span className="text-slate-700 font-extrabold">{eligibilityData.refundCalculation.moTa}</span>
                            </div>
                            <div className="h-px bg-slate-200/60 my-2"></div>
                            <div className="flex justify-between items-center">
                              <span className="font-black text-slate-800">Số tiền hoàn trả:</span>
                              <span className={`text-lg font-black ${eligibilityData.refundCalculation.soTienHoan > 0 ? 'text-green-650' : 'text-red-500'}`}>
                                {eligibilityData.refundCalculation.soTienHoan.toLocaleString()} đ
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        {cancellationFilter === 'pending' && (
                          <div className="pt-2">
                            {!showRejectInput ? (
                              <div className="flex gap-3">
                                <Button
                                  onClick={() => handleProcessCancellation('approve')}
                                  disabled={!eligibilityData.eligibility.coTheHuy}
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black text-xs h-11 rounded-xl shadow-md shadow-green-600/10 disabled:opacity-50 border-none cursor-pointer"
                                >
                                  ✅ Phê duyệt hủy vé
                                </Button>
                                <Button
                                  onClick={() => setShowRejectInput(true)}
                                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 font-black text-xs h-11 rounded-xl cursor-pointer"
                                >
                                  ❌ Từ chối yêu cầu
                                </Button>
                              </div>
                            ) : (
                              <div className="bg-red-50/40 p-4 rounded-xl border border-red-100 space-y-3">
                                <label className="block font-black text-red-700 text-xs uppercase tracking-wider">Nhập lý do từ chối yêu cầu:</label>
                                <textarea
                                  value={rejectReason}
                                  onChange={(e) => setRejectReason(e.target.value)}
                                  className="w-full p-3 border border-red-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-red-500 resize-none bg-white"
                                  rows="3"
                                  placeholder="Lý do không đáp ứng chính sách hủy hoàn..."
                                ></textarea>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => { setShowRejectInput(false); setRejectReason('') }}
                                    className="flex-1 text-slate-600 border-slate-200 h-9 font-bold text-xs"
                                  >
                                    Hủy bỏ
                                  </Button>
                                  <Button
                                    onClick={() => handleProcessCancellation('reject')}
                                    className="flex-1 bg-red-650 hover:bg-red-700 text-white font-black text-xs h-9 border-none cursor-pointer"
                                  >
                                    Xác nhận từ chối
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-3 p-8">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-350">
                        <FileText className="w-8 h-8 opacity-30" />
                      </div>
                      <p className="text-sm font-bold text-slate-400">Chọn một yêu cầu để xem thẩm định chi tiết</p>
                    </div>
                  )
                })()}
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  )
}

export default SupportDashboard
