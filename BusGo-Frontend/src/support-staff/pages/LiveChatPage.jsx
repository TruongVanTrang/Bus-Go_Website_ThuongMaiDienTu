import React, { useState, useEffect, useRef } from 'react'
import { getChatSessionsAPI, getChatMessagesAPI, sendChatMessageAPI, closeChatSessionAPI, getCustomerTicketsAPI } from '../../services/supportService'
import { toast } from '../../utils/toastService'
import AdminSidebar from '../../admin/components/AdminSidebar'
import AdminTopbar from '../../admin/components/AdminTopbar'
import { AuthUtil } from '../../utils/helpers'
import { ROLE_MENU, USER_ROLES } from '../../utils/constants'
import './LiveChatPage.css'

function LiveChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userRole, setUserRole] = useState(null)
  const [userName, setUserName] = useState('')

  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [customerTickets, setCustomerTickets] = useState([])
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const pollIntervalRef = useRef(null)

  useEffect(() => {
    const role = AuthUtil.getCurrentRole()
    const user = AuthUtil.getCurrentUser()
    setUserRole(role)
    setUserName(user?.name || 'Support Staff')
    
    fetchSessions()

    // Polling cho chat sessions & messages
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
      
      // Load tickets nếu có khách hàng
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

  const menuItems = ROLE_MENU[USER_ROLES.SUPPORT_STAFF] || []

  return (
    <div className="admin-dashboard live-chat-page">
      <AdminSidebar isOpen={sidebarOpen} userRole={userRole} menuItems={menuItems} onClose={() => setSidebarOpen(false)} />
      
      <div className="admin-main">
        <AdminTopbar userName={userName} userRole={userRole} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="admin-content p-0">
          <div className="chat-layout">
            {/* Cột 1: Danh sách Chat */}
            <div className="chat-sidebar">
              <div className="chat-header">
                <h3>Phiên Chat</h3>
              </div>
              <div className="session-list">
                {sessions.map(session => (
                  <div 
                    key={session.maChatSession} 
                    className={`session-item ${activeSession?.maChatSession === session.maChatSession ? 'active' : ''} ${session.soTinChuaDoc > 0 ? 'unread' : ''}`}
                    onClick={() => handleSelectSession(session)}
                  >
                    <div className="session-info">
                      <h4 className="customer-name">{session.tenKhachHangTaiKhoan || session.tenKhachHang || 'Khách vãng lai'}</h4>
                      <span className={`status-badge ${session.trangThai}`}>{session.trangThai}</span>
                    </div>
                    <p className="last-message text-truncate">
                      {session.tinNhanCuoi || 'Chưa có tin nhắn...'}
                    </p>
                    {session.soTinChuaDoc > 0 && <span className="unread-badge">{session.soTinChuaDoc}</span>}
                  </div>
                ))}
                {sessions.length === 0 && <div className="p-4 text-center text-muted">Không có phiên chat nào</div>}
              </div>
            </div>

            {/* Cột 2: Nội dung Chat */}
            <div className="chat-main">
              {activeSession ? (
                <>
                  <div className="chat-header">
                    <div className="d-flex align-items-center justify-content-between w-100">
                      <div>
                        <h3>{activeSession.tenKhachHangTaiKhoan || activeSession.tenKhachHang || 'Khách vãng lai'}</h3>
                        <small className="text-muted">{activeSession.emailKhach}</small>
                      </div>
                      {activeSession.trangThai !== 'closed' && (
                        <button className="btn btn-sm btn-outline-danger" onClick={handleCloseSession}>Kết thúc chat</button>
                      )}
                    </div>
                  </div>
                  
                  <div className="chat-messages">
                    {messages.map(msg => (
                      <div key={msg.maTinNhan} className={`message-wrapper ${msg.nguoiGui === 'agent' ? 'sent' : 'received'}`}>
                        <div className="message-bubble">
                          <p>{msg.noiDung}</p>
                          <span className="time">{new Date(msg.thoiGianGui).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {activeSession.trangThai !== 'closed' ? (
                    <div className="chat-input-area">
                      <form onSubmit={handleSendMessage} className="d-flex gap-2">
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Nhập tin nhắn..." 
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary px-4" disabled={!newMessage.trim()}>Gửi</button>
                      </form>
                    </div>
                  ) : (
                    <div className="chat-input-area bg-light text-center p-3 text-muted">
                      Phiên chat này đã kết thúc
                    </div>
                  )}
                </>
              ) : (
                <div className="chat-empty-state">
                  <div className="empty-icon">💬</div>
                  <h3>Chọn một phiên chat</h3>
                  <p>Chọn một khách hàng từ danh sách bên trái để bắt đầu hỗ trợ</p>
                </div>
              )}
            </div>

            {/* Cột 3: Thông tin Vé */}
            <div className="chat-ticket-info">
              <div className="chat-header">
                <h3>Thông tin Vé</h3>
              </div>
              <div className="ticket-list p-3">
                {!activeSession ? (
                  <p className="text-muted text-center mt-5">Chưa chọn phiên chat</p>
                ) : customerTickets.length > 0 ? (
                  customerTickets.map(ticket => (
                    <div key={ticket.maVe} className="ticket-card mb-3">
                      <div className="d-flex justify-content-between mb-2">
                        <strong>Mã vé: #{ticket.maVe}</strong>
                        <span className={`badge ${ticket.trangThaiVe === 'da_thanh_toan' ? 'bg-success' : 'bg-secondary'}`}>
                          {ticket.trangThaiVe}
                        </span>
                      </div>
                      <p className="mb-1"><strong>Tuyến:</strong> {ticket.chuyenXe.diemDi} - {ticket.chuyenXe.diemDen}</p>
                      <p className="mb-1"><strong>Khởi hành:</strong> {new Date(ticket.chuyenXe.thoiGianDi).toLocaleString()}</p>
                      <p className="mb-1"><strong>Ghế:</strong> {ticket.soGhe || 'N/A'}</p>
                      <p className="mb-0"><strong>Giá:</strong> {ticket.giaThanhToan.toLocaleString()} VNĐ</p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted text-center mt-5">Khách hàng chưa có vé nào</p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default LiveChatPage
