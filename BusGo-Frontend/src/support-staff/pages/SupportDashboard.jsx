import React, { useState, useEffect, useRef } from 'react'
import { getChatSessionsAPI, getCancellationRequestsAPI, checkCancellationAPI, processCancellationAPI, getChatMessagesAPI, getCustomerTicketsAPI, closeChatSessionAPI } from '../../services/supportService'
import { toast } from '../../utils/toastService'
import { AuthUtil } from '../../utils/helpers'
import {
  MessageCircle, FileText, LogOut, Menu, X, Send, Search, Bell,
  CheckCircle, AlertCircle, Clock, DollarSign, Phone, Mail, MapPin,
  BarChart3, Users, Ticket, Calendar
} from 'lucide-react'
import './SupportDashboard.css'

function SupportDashboard() {
  // Layout
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('overview') // overview, chat, cancellation

  // User
  const currentUser = AuthUtil.getCurrentUser()

  // ==================== CHAT STATES ====================
  const [chatSessions, setChatSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [chatSearch, setChatSearch] = useState('')
  const [loadingChat, setLoadingChat] = useState(false)
  const [customerTickets, setCustomerTickets] = useState([])
  const messagesEndRef = useRef(null)

  // ==================== CANCELLATION STATES ====================
  const [cancellations, setCancellations] = useState([])
  const [cancellationFilter, setCancellationFilter] = useState('pending')
  const [selectedTicketId, setSelectedTicketId] = useState(null)
  const [eligibilityData, setEligibilityData] = useState(null)
  const [loadingCancellation, setLoadingCancellation] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [cancellationSearch, setCancellationSearch] = useState('')

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
      if (activeSession) fetchChatMessages(activeSession.maChatSession, false)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (activeTab === 'cancellation') {
      fetchCancellations()
    }
  }, [cancellationFilter])

  // ==================== CHAT FUNCTIONS ====================
  const fetchChatMessages = async (sessionId, showLoading = true) => {
    if (showLoading) setLoadingChat(true)
    try {
      const data = await getChatMessagesAPI(sessionId)
      setMessages(data.messages || [])
      scrollToBottom()
      
      // Load tickets nếu có khách hàng
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
    e.preventDefault()
    if (!newMessage.trim() || !activeSession) return

    try {
      const { sendChatMessageAPI } = await import('../../services/supportService')
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

  const filteredChatSessions = chatSessions.filter(s =>
    s.tenKhachHang?.toLowerCase().includes(chatSearch.toLowerCase()) ||
    s.emailKhach?.toLowerCase().includes(chatSearch.toLowerCase())
  )

  const filteredCancellations = cancellations.filter(c =>
    c.hoTenHanhKhach?.toLowerCase().includes(cancellationSearch.toLowerCase()) ||
    c.soDienThoaiHanhKhach?.includes(cancellationSearch)
  )

  // ==================== RENDER ====================
  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden font-sans antialiased">
      {/* ==================== SIDEBAR ==================== */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 bg-white border-r border-slate-200 flex flex-col overflow-hidden shadow-lg`}>

        {/* Header */}
        <div className="h-20 border-b border-slate-200 flex items-center justify-between px-6 bg-gradient-to-r from-[#004b87]/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#004b87] to-blue-600 rounded-xl flex items-center justify-center shadow-lg text-white font-black">
              {currentUser?.name?.charAt(0) || 'S'}
            </div>
            <div>
              <h2 className="font-black text-slate-800 text-sm leading-tight">Hỗ trợ</h2>
              <p className="text-[10px] text-slate-400 font-bold">Nhân viên</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg md:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-[#004b87] text-white shadow-lg shadow-[#004b87]/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Tổng quan</span>
          </button>

          <button
            onClick={() => { setActiveTab('chat'); fetchChatSessions() }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all relative ${
              activeTab === 'chat'
                ? 'bg-[#004b87] text-white shadow-lg shadow-[#004b87]/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span>Chat</span>
            {stats.activeSessions > 0 && (
              <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs font-black rounded-full">
                {stats.activeSessions}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('cancellation'); setCancellationFilter('pending') }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all relative ${
              activeTab === 'cancellation'
                ? 'bg-[#004b87] text-white shadow-lg shadow-[#004b87]/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Hoàn/Hủy vé</span>
            {stats.pendingCancellations > 0 && (
              <span className="ml-auto px-2 py-0.5 bg-orange-500 text-white text-xs font-black rounded-full">
                {stats.pendingCancellations}
              </span>
            )}
          </button>
        </nav>

        {/* Logout */}
        <div className="border-t border-slate-200 p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ==================== MAIN CONTENT ==================== */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Toggle Sidebar */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden h-14 px-4 bg-white border-b border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-2 font-bold"
        >
          <Menu className="w-5 h-5" />
          Menu
        </button>

        {/* ==================== TAB: OVERVIEW ==================== */}
        {activeTab === 'overview' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl font-black text-slate-800 mb-8">Bảng Điều Khiển</h1>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[
                  { icon: MessageCircle, label: 'Chat Hoạt Động', value: stats.activeSessions, color: 'blue' },
                  { icon: Ticket, label: 'Hủy/Hoàn Chờ', value: stats.pendingCancellations, color: 'orange' },
                  { icon: CheckCircle, label: 'Hoàn Thành', value: stats.completedToday, color: 'green' },
                  { icon: Users, label: 'Khách Hàng', value: stats.totalCustomers, color: 'purple' }
                ].map((stat, i) => {
                  const colorClass = {
                    blue: 'from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20',
                    orange: 'from-orange-500 to-orange-600 shadow-lg shadow-orange-500/20',
                    green: 'from-green-500 to-green-600 shadow-lg shadow-green-500/20',
                    purple: 'from-purple-500 to-purple-600 shadow-lg shadow-purple-500/20'
                  }[stat.color]

                  return (
                    <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center mb-4`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-slate-500 font-bold text-sm mb-1">{stat.label}</p>
                      <p className="text-3xl font-black text-slate-800">{stat.value}</p>
                    </div>
                  )
                })}
              </div>

              {/* Quick Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  onClick={() => setActiveTab('chat')}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#004b87] to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MessageCircle className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-2xl font-black text-blue-600">{stats.activeSessions}</span>
                  </div>
                  <h3 className="font-black text-slate-800 mb-2">Tin nhắn Chat</h3>
                  <p className="text-slate-600 font-semibold text-sm">Hỗ trợ khách hàng qua chat trực tiếp</p>
                </div>

                <div
                  onClick={() => { setActiveTab('cancellation'); setCancellationFilter('pending') }}
                  className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileText className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-2xl font-black text-orange-600">{stats.pendingCancellations}</span>
                  </div>
                  <h3 className="font-black text-slate-800 mb-2">Yêu cầu Hủy/Hoàn</h3>
                  <p className="text-slate-600 font-semibold text-sm">Phê duyệt hoặc từ chối các yêu cầu</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: CHAT ==================== */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex overflow-hidden gap-4 p-4 bg-slate-100">
            {/* Chat List */}
            <div className="w-96 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden shadow-lg">
              <div className="p-4 border-b border-slate-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm khách..."
                    value={chatSearch}
                    onChange={(e) => setChatSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm font-semibold focus:outline-none focus:border-[#004b87] focus:ring-2 focus:ring-[#004b87]/10"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 p-3">
                {filteredChatSessions.length > 0 ? (
                  filteredChatSessions.map(session => (
                    <button
                      key={session.maChatSession}
                      onClick={() => handleSelectSession(session)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                        activeSession?.maChatSession === session.maChatSession
                          ? 'bg-[#004b87] text-white'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-sm truncate">{session.tenKhachHang}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-black">🟢</span>
                      </div>
                      <p className={`text-xs truncate ${activeSession?.maChatSession === session.maChatSession ? 'text-blue-100' : 'text-slate-500'}`}>
                        {session.tinNhanCuoi || 'Chưa có tin...'}
                      </p>
                    </button>
                  ))
                ) : (
                  <div className="flex justify-center items-center h-full text-slate-400">Không có chat</div>
                )}
              </div>
            </div>

            {/* Chat Area + Ticket Info */}
            <div className="flex-1 flex gap-4 overflow-hidden">
              {activeSession ? (
                <>
                  <div className="flex-1 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden shadow-lg">
                    {/* Chat Header */}
                    <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-[#004b87]/5 to-transparent">
                      <div>
                        <h3 className="font-black text-slate-800">{activeSession.tenKhachHang}</h3>
                        <p className="text-xs text-slate-400">{activeSession.emailKhach}</p>
                      </div>
                      {activeSession.trangThai !== 'closed' && (
                        <button
                          onClick={handleCloseSession}
                          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg transition-all border-none cursor-pointer flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Kết thúc
                        </button>
                      )}
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-slate-50 to-white flex flex-col">
                      {messages.map(msg => (
                        <div key={msg.maTinNhan} className={`flex ${msg.nguoiGui === 'agent' ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-xs px-4 py-3 rounded-2xl ${
                              msg.nguoiGui === 'agent'
                                ? 'bg-gradient-to-r from-[#004b87] to-blue-600 text-white'
                                : 'bg-white border border-slate-200 text-slate-800'
                            }`}
                          >
                            <p className="text-sm font-semibold break-words">{msg.noiDung}</p>
                            <p className={`text-xs mt-2 ${msg.nguoiGui === 'agent' ? 'text-blue-100' : 'text-slate-400'}`}>
                              {new Date(msg.thoiGianGui).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    {activeSession.trangThai !== 'closed' ? (
                      <form onSubmit={handleSendMessage} className="h-20 bg-white border-t border-slate-200 px-6 py-3 flex items-center gap-3">
                        <input
                          type="text"
                          placeholder="Nhập tin nhắn..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="flex-1 px-4 py-2 border border-slate-200 rounded-full bg-slate-50 text-sm font-semibold focus:outline-none focus:border-[#004b87]"
                        />
                        <button
                          type="submit"
                          disabled={!newMessage.trim()}
                          className="px-4 py-2 bg-gradient-to-r from-[#004b87] to-blue-600 hover:shadow-lg text-white font-bold rounded-full disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    ) : (
                      <div className="h-20 bg-slate-100 border-t border-slate-200 px-6 py-3 flex items-center justify-center text-slate-500 font-bold">
                        ✓ Phiên chat đã kết thúc
                      </div>
                    )}
                  </div>

                  {/* Ticket Info Panel */}
                  <aside className="w-80 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden shadow-lg">
                    <div className="h-16 border-b border-slate-200 px-6 flex items-center bg-gradient-to-r from-[#004b87]/5 to-transparent">
                      <div className="flex items-center gap-3">
                        <Ticket className="w-5 h-5 text-[#004b87]" />
                        <h3 className="font-black text-slate-800 text-sm">Thông tin Vé</h3>
                      </div>
                    </div>

                    {/* Ticket List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {customerTickets.length > 0 ? (
                        customerTickets.map(ticket => (
                          <div
                            key={ticket.maVe}
                            className="bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all"
                          >
                            {/* Ticket Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-black text-slate-800 text-sm">Mã vé #{ticket.maVe}</h4>
                                <p className="text-[10px] text-slate-500 font-bold mt-1">
                                  {new Date(ticket.ngayDatVe).toLocaleDateString('vi-VN')}
                                </p>
                              </div>
                              <span className={`px-2 py-1 rounded-lg text-[10px] font-black whitespace-nowrap ${
                                ticket.trangThaiVe === 'da_thanh_toan'
                                  ? 'bg-green-100 text-green-700'
                                  : ticket.trangThaiVe === 'da_su_dung'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {ticket.trangThaiVe === 'da_thanh_toan' ? '✓ Đã thanh toán' : ticket.trangThaiVe === 'da_su_dung' ? '✓ Đã sử dụng' : 'Đã hủy'}
                              </span>
                            </div>

                            {/* Route Info */}
                            <div className="space-y-2 mb-3 pb-3 border-b border-slate-200">
                              <div className="flex items-center gap-2 text-xs text-slate-600 font-bold">
                                <MapPin className="w-3.5 h-3.5 text-[#004b87] flex-shrink-0" />
                                <span className="truncate">{ticket.chuyenXe?.diemDi || 'N/A'}</span>
                              </div>
                              <div className="flex items-center justify-center px-2 py-1 bg-white rounded-lg text-[10px] text-slate-400 font-bold">
                                ↓
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-600 font-bold">
                                <MapPin className="w-3.5 h-3.5 text-[#004b87] flex-shrink-0" />
                                <span className="truncate">{ticket.chuyenXe?.diemDen || 'N/A'}</span>
                              </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-white rounded-lg p-2 border border-slate-100">
                                <p className="text-[10px] text-slate-500 font-bold">Ghế</p>
                                <p className="text-xs text-slate-800 font-black mt-1">{ticket.soGhe || 'N/A'}</p>
                              </div>
                              <div className="bg-white rounded-lg p-2 border border-slate-100">
                                <p className="text-[10px] text-slate-500 font-bold">Giờ khởi hành</p>
                                <p className="text-xs text-slate-800 font-black mt-1">{ticket.chuyenXe?.gioDi || 'N/A'}</p>
                              </div>
                              <div className="bg-white rounded-lg p-2 border border-slate-100">
                                <p className="text-[10px] text-slate-500 font-bold">Giá vé</p>
                                <p className="text-xs text-green-600 font-black mt-1">{(ticket.giaVe || 0).toLocaleString()} VNĐ</p>
                              </div>
                              <div className="bg-white rounded-lg p-2 border border-slate-100">
                                <p className="text-[10px] text-slate-500 font-bold">Tổng cộng</p>
                                <p className="text-xs text-green-600 font-black mt-1">{(ticket.giaThanhToan || 0).toLocaleString()} VNĐ</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 flex-col gap-3">
                          <Ticket className="w-10 h-10 opacity-30" />
                          <p className="text-sm font-semibold">Khách hàng chưa có vé</p>
                        </div>
                      )}
                    </div>
                  </aside>
                </>
              ) : (
                <div className="flex-1 bg-white rounded-xl border border-slate-200 flex items-center justify-center">
                  <p className="text-slate-400 font-semibold">Chọn một cuộc trò chuyện</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB: CANCELLATION ==================== */}
        {activeTab === 'cancellation' && (
          <div className="flex-1 overflow-hidden flex gap-4 p-4 bg-slate-100">
            {/* Requests List */}
            <div className="w-full md:w-1/2 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden shadow-lg">
              <div className="p-4 border-b border-slate-200 space-y-3">
                <div className="flex gap-2">
                  {['pending', 'approved', 'rejected', 'all'].map(status => (
                    <button
                      key={status}
                      onClick={() => setCancellationFilter(status)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        cancellationFilter === status
                          ? 'bg-[#004b87] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {status === 'pending' ? 'Chờ' : status === 'approved' ? 'Duyệt' : status === 'rejected' ? 'Từ' : 'Tất cả'}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm khách..."
                    value={cancellationSearch}
                    onChange={(e) => setCancellationSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm font-semibold focus:outline-none focus:border-[#004b87]"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loadingCancellation ? (
                  <div className="flex justify-center items-center h-full">Đang tải...</div>
                ) : filteredCancellations.length > 0 ? (
                  <div className="divide-y divide-slate-200">
                    {filteredCancellations.map(req => (
                      <button
                        key={req.maYeuCau}
                        onClick={() => handleCheckEligibility(req.maVe)}
                        className={`w-full text-left p-4 hover:bg-slate-50 transition-all border-l-4 ${
                          selectedTicketId === req.maVe
                            ? 'border-[#004b87] bg-blue-50'
                            : 'border-transparent'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-bold text-slate-800">#{req.maVe}</div>
                            <div className="text-xs text-slate-500 font-semibold mt-1">({req.soVeInBooking} vé trong booking)</div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded font-bold ${
                            req.trangThai === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            req.trangThai === 'approved' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {req.trangThai}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mb-1">{req.hoTenHanhKhach}</p>
                        <p className="text-xs text-slate-500">{req.diemDi} - {req.diemDen}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-full text-slate-400">Không có yêu cầu</div>
                )}
              </div>
            </div>

            {/* Details Panel */}
            <div className="w-full md:w-1/2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-lg flex flex-col">
              {selectedTicketId && eligibilityData ? (
                <>
                  <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-transparent">
                    <h3 className="font-black text-slate-800 mb-4">Kết quả Kiểm tra Vé #{selectedTicketId}</h3>

                    {/* Status Alert */}
                    {eligibilityData.eligibility.coTheHoan ? (
                      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                        <p className="font-bold">✅ Đủ điều kiện hoàn tiền</p>
                        <p className="text-sm mt-1">{eligibilityData.eligibility.hoursUntilDeparture} giờ trước khởi hành</p>
                      </div>
                    ) : eligibilityData.eligibility.coTheHuy ? (
                      <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-lg mb-4">
                        <p className="font-bold">⚠️ Có thể hủy nhưng KHÔNG hoàn tiền</p>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                        <p className="font-bold">❌ KHÔNG thể hủy vé</p>
                        <p className="text-sm mt-1">{eligibilityData.eligibility.lyDoKhongHuy}</p>
                      </div>
                    )}
                  </div>

                  {/* Refund Calculator */}
                  <div className="p-6 flex-1 overflow-y-auto">
                    <h4 className="font-bold text-slate-800 mb-4">Tính toán Hoàn tiền</h4>
                    <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-lg">
                      <div className="flex justify-between">
                        <span className="text-slate-600 font-semibold">Giá vé gốc:</span>
                        <span className="font-black text-slate-800">{eligibilityData.refundCalculation.giaVeGoc.toLocaleString()} đ</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 font-semibold">Chính sách:</span>
                        <span className="font-semibold text-slate-700">{eligibilityData.refundCalculation.moTa}</span>
                      </div>
                      <div className="h-px bg-slate-200"></div>
                      <div className="flex justify-between pt-2">
                        <span className="font-black text-slate-800">Hoàn tiền:</span>
                        <span className={`text-xl font-black ${eligibilityData.refundCalculation.soTienHoan > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {eligibilityData.refundCalculation.soTienHoan.toLocaleString()} đ
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    {cancellationFilter === 'pending' && (
                      <div className="space-y-3">
                        {!showRejectInput ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleProcessCancellation('approve')}
                              disabled={!eligibilityData.eligibility.coTheHuy}
                              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg disabled:opacity-50"
                            >
                              ✅ Phê duyệt
                            </button>
                            <button
                              onClick={() => setShowRejectInput(true)}
                              className="flex-1 px-4 py-3 bg-red-100 hover:bg-red-200 text-red-600 font-bold rounded-lg"
                            >
                              ❌ Từ chối
                            </button>
                          </div>
                        ) : (
                          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                            <label className="block font-bold text-red-700 mb-2">Lý do từ chối:</label>
                            <textarea
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              className="w-full p-2 border border-red-300 rounded mb-3 text-sm"
                              rows="3"
                              placeholder="Nhập lý do..."
                            ></textarea>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setShowRejectInput(false)}
                                className="flex-1 px-3 py-2 bg-slate-200 hover:bg-slate-300 font-bold rounded"
                              >
                                Hủy
                              </button>
                              <button
                                onClick={() => handleProcessCancellation('reject')}
                                className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded"
                              >
                                Xác nhận
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <Ticket className="w-12 h-12 mx-auto opacity-30 mb-2" />
                    <p className="font-semibold">Chọn một yêu cầu để xem chi tiết</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SupportDashboard
