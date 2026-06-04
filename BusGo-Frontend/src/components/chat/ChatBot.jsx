import { useState, useRef, useEffect } from 'react'
import { FiX, FiSend, FiMessageSquare } from 'react-icons/fi'
import { getMyChatSessionAPI, createMyChatSessionAPI, getMyChatMessagesAPI, sendMyChatMessageAPI } from '../../services/customerService'
import { AuthUtil } from '../../utils/helpers'
import { toast } from '../../utils/toastService'
import './ChatBot.css'

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  
  const [session, setSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  
  const messagesEndRef = useRef(null)
  const pollIntervalRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isOpen])

  // Check login status
  useEffect(() => {
    const user = AuthUtil.getCurrentUser()
    setIsLoggedIn(!!user)
  }, [])

  // Poll for messages when chat is open and session exists
  useEffect(() => {
    if (isOpen && isLoggedIn) {
      checkExistingSession()
      
      pollIntervalRef.current = setInterval(() => {
        if (session && session.trangThai !== 'closed') {
          fetchMessages(session.maChatSession, false)
        } else if (!session) {
          checkExistingSession(false)
        }
      }, 3000)
    } else {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [isOpen, isLoggedIn, session?.maChatSession]) // Add dependency on session ID

  const checkExistingSession = async (showError = true) => {
    try {
      const data = await getMyChatSessionAPI()
      if (data.session) {
        setSession(data.session)
        fetchMessages(data.session.maChatSession, false)
      } else {
        setSession(null)
      }
    } catch (error) {
      if (showError) console.error("Không thể lấy phiên chat", error)
    }
  }

  const fetchMessages = async (sessionId, showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const data = await getMyChatMessagesAPI(sessionId)
      setMessages(data.messages || [])
    } catch (error) {
      if (showLoading) console.error("Lỗi lấy tin nhắn:", error)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const handleStartChat = async () => {
    if (!isLoggedIn) {
      toast.error('Vui lòng đăng nhập để sử dụng tính năng Chat')
      return
    }
    setLoading(true)
    try {
      const data = await createMyChatSessionAPI('Cần hỗ trợ từ hệ thống')
      await checkExistingSession() // Lấy lại thông tin session
    } catch (error) {
      toast.error('Không thể bắt đầu chat. ' + (error.response?.data?.message || ''))
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !session) return

    const messageText = inputValue.trim()
    setInputValue('') // Clear input fast for UX
    
    // Optimistic UI update
    const optimisticMsg = {
      maTinNhan: Date.now(),
      nguoiGui: 'customer',
      noiDung: messageText,
      thoiGianGui: new Date().toISOString()
    }
    setMessages(prev => [...prev, optimisticMsg])

    try {
      await sendMyChatMessageAPI(session.maChatSession, messageText)
      fetchMessages(session.maChatSession, false)
    } catch (error) {
      toast.error('Gửi tin nhắn thất bại')
      // Remove optimistic message if failed
      setMessages(prev => prev.filter(m => m.maTinNhan !== optimisticMsg.maTinNhan))
    }
  }

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="chat-button shadow-lg"
        title={isOpen ? 'Đóng' : 'Chat với chúng tôi'}
      >
        {isOpen ? (
          <FiX size={24} />
        ) : (
          <FiMessageSquare size={24} />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window shadow-lg border-0 rounded-4 overflow-hidden" style={{ bottom: '90px', right: '30px', zIndex: 1050 }}>
          <div className="chat-header bg-primary text-white p-3 d-flex justify-content-between align-items-center">
            <h6 className="mb-0 fw-bold">Trợ lý Hỗ trợ BusGo</h6>
            <button
              onClick={() => setIsOpen(false)}
              className="btn text-white p-0 border-0"
              style={{ background: 'none' }}
            >
              <FiX size={22} />
            </button>
          </div>

          <div className="chat-messages p-3" style={{ height: '350px', overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
            {!isLoggedIn ? (
              <div className="text-center mt-5 text-muted">
                <div className="mb-3">👤</div>
                <p>Vui lòng đăng nhập để bắt đầu trò chuyện với nhân viên hỗ trợ.</p>
              </div>
            ) : !session ? (
              <div className="text-center mt-5">
                <p className="text-muted mb-4">Chào bạn! Nhấn nút bên dưới để kết nối với Nhân viên Hỗ trợ của BusGo.</p>
                <button 
                  className="btn btn-primary rounded-pill px-4" 
                  onClick={handleStartChat}
                  disabled={loading}
                >
                  {loading ? 'Đang kết nối...' : 'Bắt đầu trò chuyện'}
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-3">
                  <small className="bg-light text-muted rounded px-2 py-1">Cuộc trò chuyện đã bắt đầu</small>
                </div>
                
                {messages.length === 0 && (
                  <div className="text-center text-muted my-4">
                    <small>Gửi tin nhắn đầu tiên của bạn để nhân viên hỗ trợ nhận được thông báo.</small>
                  </div>
                )}
                
                {messages.map(message => (
                  <div key={message.maTinNhan} className={`message mb-3 d-flex ${message.nguoiGui === 'customer' ? 'justify-content-end' : 'justify-content-start'}`}>
                    <div 
                      className={`message-content p-2 px-3 rounded-4 ${message.nguoiGui === 'customer' ? 'bg-primary text-white' : 'bg-white border'}`}
                      style={{ maxWidth: '80%', wordBreak: 'break-word', borderBottomRightRadius: message.nguoiGui === 'customer' ? '4px' : '16px', borderBottomLeftRadius: message.nguoiGui !== 'customer' ? '4px' : '16px' }}
                    >
                      {message.noiDung}
                    </div>
                  </div>
                ))}
                
                {session.trangThai === 'closed' && (
                  <div className="text-center mt-3 mb-2">
                    <small className="bg-secondary text-white rounded px-2 py-1">Phiên chat đã kết thúc</small>
                    <div className="mt-2">
                      <button className="btn btn-sm btn-outline-primary" onClick={handleStartChat}>Bắt đầu phiên mới</button>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <div className="chat-input-area border-top bg-white p-2">
            <div className="input-group">
              <input
                type="text"
                className="form-control border-0 bg-light rounded-pill px-3"
                placeholder={session?.trangThai === 'closed' ? "Chat đã kết thúc" : "Nhập tin nhắn..."}
                value={inputValue}
                disabled={!session || session.trangThai === 'closed'}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleSendMessage()
                }}
              />
              <button
                className="btn btn-primary rounded-circle ms-2 d-flex align-items-center justify-content-center"
                style={{ width: '40px', height: '40px' }}
                disabled={!session || session.trangThai === 'closed' || !inputValue.trim()}
                onClick={handleSendMessage}
              >
                <FiSend size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
