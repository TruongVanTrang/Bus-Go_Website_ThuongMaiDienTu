import React, { useState, useEffect, useRef } from 'react'
import { getChatSessionsAPI, getChatMessagesAPI, sendChatMessageAPI, closeChatSessionAPI, getCustomerTicketsAPI } from '../../services/supportService'
import { toast } from '../../utils/toastService'
import { AuthUtil } from '../../utils/helpers'
import {
  MessageCircle, Send, X, LogOut, Search, Clock, CheckCircle,
  AlertCircle, ChevronRight, Menu, Bell, Phone, Mail, MapPin,
  Calendar, DollarSign, Ticket
} from 'lucide-react'
import './LiveChatPageNew.css'

function LiveChatPageNew() {
  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [customerTickets, setCustomerTickets] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const messagesEndRef = useRef(null)
  const pollIntervalRef = useRef(null)

  const currentUser = AuthUtil.getCurrentUser()

  useEffect(() => {
    fetchSessions()
    pollIntervalRef.current = setInterval(() => {
      fetchSessions(false)
      if (activeSession) {
        fetchMessages(activeSession.maChatSession, false)
      }
    }, 3000)

    return () => clearInterval(pollIntervalRef.current)
  }, [activeSession])

  const fetchSessions = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const data = await getChatSessionsAPI()
      setSessions(data.chatSessions || [])
    } catch (error) {
      console.error(error)
      if (showLoading) toast.error('Không thể tải danh sách chat')
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const fetchMessages = async (sessionId, showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const data = await getChatMessagesAPI(sessionId)
      setMessages(data.messages || [])
      scrollToBottom()

      if (data.session?.maKhachHang && showLoading) {
        const ticketData = await getCustomerTicketsAPI(data.session.maKhachHang)
        setCustomerTickets(ticketData.tickets || [])
      }
    } catch (error) {
      console.error(error)
      if (showLoading) toast.error('Không thể tải tin nhắn')
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const handleSelectSession = (session) => {
    setActiveSession(session)
    setCustomerTickets([])
    fetchMessages(session.maChatSession)
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeSession) return

    try {
      await sendChatMessageAPI(activeSession.maChatSession, newMessage)
      setNewMessage('')
      fetchMessages(activeSession.maChatSession, false)
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
      fetchSessions()
    } catch (error) {
      toast.error(error.message || 'Lỗi đóng phiên chat')
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const filteredSessions = sessions.filter(s =>
    s.tenKhachHang?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.emailKhach?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleLogout = () => {
    AuthUtil.logout()
    toast.info('Đang đăng xuất...')
    setTimeout(() => {
      window.location.href = '/login'
    }, 500)
  }

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden font-sans antialiased">
      {/* ==================== SIDEBAR ==================== */}
      <aside className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white border-r border-slate-200 flex flex-col overflow-hidden shadow-lg`}>
        
        {/* Header */}
        <div className="h-20 border-b border-slate-200 flex items-center justify-between px-6 bg-gradient-to-r from-[#004b87]/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#004b87] to-blue-600 rounded-xl flex items-center justify-center shadow-lg text-white font-black">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-slate-800 text-sm leading-tight">Hỗ Trợ</h2>
              <p className="text-[10px] text-slate-400 font-bold">Live Chat</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-all md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm khách..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 text-sm font-semibold focus:outline-none focus:border-[#004b87] focus:ring-2 focus:ring-[#004b87]/10 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          {filteredSessions.length > 0 ? (
            <div className="space-y-2 p-3">
              {filteredSessions.map(session => (
                <button
                  key={session.maChatSession}
                  onClick={() => handleSelectSession(session)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 border-none cursor-pointer group ${
                    activeSession?.maChatSession === session.maChatSession
                      ? 'bg-[#004b87] text-white shadow-lg shadow-[#004b87]/20'
                      : 'hover:bg-slate-50 text-slate-700 bg-white/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className={`font-bold text-sm truncate ${activeSession?.maChatSession === session.maChatSession ? 'text-white' : 'text-slate-800'}`}>
                      {session.tenKhachHangTaiKhoan || session.tenKhachHang || 'Khách vãng lai'}
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black whitespace-nowrap ${
                      session.trangThai === 'active'
                        ? activeSession?.maChatSession === session.maChatSession
                          ? 'bg-green-400 text-white'
                          : 'bg-green-100 text-green-700'
                        : activeSession?.maChatSession === session.maChatSession
                          ? 'bg-slate-400 text-white'
                          : 'bg-slate-200 text-slate-700'
                    }`}>
                      {session.trangThai === 'active' ? '🟢' : '⭕'}
                    </span>
                  </div>
                  <p className={`text-xs truncate line-clamp-1 opacity-75 ${activeSession?.maChatSession === session.maChatSession ? 'text-blue-100' : 'text-slate-500'}`}>
                    {session.tinNhanCuoi || 'Chưa có tin nhắn...'}
                  </p>
                  {session.soTinChuaDoc > 0 && (
                    <div className="mt-2 inline-block px-2 py-0.5 bg-red-500 text-white text-[10px] font-black rounded-full">
                      {session.soTinChuaDoc} tin chưa đọc
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 flex-col gap-3">
              <MessageCircle className="w-10 h-10 opacity-30" />
              <p className="text-sm font-semibold">Không có phiên chat</p>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <div className="border-t border-slate-200 p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-all border-none cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ==================== MAIN CONTENT ==================== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Toggle Sidebar Button (Mobile) */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden h-14 px-4 bg-white border-b border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-2 font-bold transition-all"
        >
          <Menu className="w-5 h-5" />
          Danh sách chat
        </button>

        {activeSession ? (
          <>
            {/* Chat Header */}
            <div className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
              <div>
                <h3 className="font-black text-slate-800 text-lg">
                  {activeSession.tenKhachHangTaiKhoan || activeSession.tenKhachHang || 'Khách vãng lai'}
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-1 flex items-center gap-2">
                  <Mail className="w-3 h-3" />
                  {activeSession.emailKhach}
                </p>
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

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-white p-6 space-y-4 flex flex-col">
              {messages.length > 0 ? (
                <>
                  {messages.map(msg => (
                    <div
                      key={msg.maTinNhan}
                      className={`flex ${msg.nguoiGui === 'agent' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                          msg.nguoiGui === 'agent'
                            ? 'bg-gradient-to-r from-[#004b87] to-blue-600 text-white rounded-br-sm'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                        }`}
                      >
                        <p className="text-sm leading-relaxed font-semibold break-words">
                          {msg.noiDung}
                        </p>
                        <p className={`text-xs mt-2 font-bold ${msg.nguoiGui === 'agent' ? 'text-blue-100 opacity-75' : 'text-slate-400'}`}>
                          {new Date(msg.thoiGianGui).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 flex-col gap-3">
                  <MessageCircle className="w-12 h-12 opacity-20" />
                  <p className="text-sm font-semibold">Chưa có tin nhắn</p>
                </div>
              )}
            </div>

            {/* Message Input */}
            {activeSession.trangThai !== 'closed' ? (
              <form
                onSubmit={handleSendMessage}
                className="h-20 bg-white border-t border-slate-200 px-6 py-3 flex items-center gap-3 shadow-lg"
              >
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-full bg-slate-50 text-slate-700 font-semibold text-sm focus:outline-none focus:border-[#004b87] focus:ring-2 focus:ring-[#004b87]/10 focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-4 py-3 bg-gradient-to-r from-[#004b87] to-blue-600 hover:shadow-lg hover:shadow-[#004b87]/30 text-white font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all border-none cursor-pointer flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="h-20 bg-slate-100 border-t border-slate-200 px-6 py-3 flex items-center justify-center text-slate-500 font-bold">
                ✓ Phiên chat đã kết thúc
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 flex-col gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#004b87] to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-[#004b87]/20">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h3 className="font-black text-slate-800 text-xl mb-2">Chọn một phiên chat</h3>
              <p className="text-slate-500 font-semibold max-w-xs">
                Chọn một khách hàng từ danh sách bên trái để bắt đầu hỗ trợ và trả lời các câu hỏi của họ
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ==================== TICKET INFO PANEL (RIGHT) ==================== */}
      {activeSession && (
        <aside className="w-96 bg-white border-l border-slate-200 flex flex-col overflow-hidden shadow-lg">
          
          {/* Header */}
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
                      <span className="truncate">{ticket.chuyenXe.diemDi}</span>
                    </div>
                    <div className="flex items-center justify-center px-2 py-1 bg-white rounded-lg text-[10px] text-slate-400 font-bold">
                      ↓
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-bold">
                      <MapPin className="w-3.5 h-3.5 text-[#004b87] flex-shrink-0" />
                      <span className="truncate">{ticket.chuyenXe.diemDen}</span>
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
                      <p className="text-xs text-slate-800 font-black mt-1">{ticket.chuyenXe.gioDi}</p>
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
      )}
    </div>
  )
}

export default LiveChatPageNew
