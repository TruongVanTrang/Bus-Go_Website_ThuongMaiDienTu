import { useState, useRef, useEffect } from 'react'
import { FiX, FiSend } from 'react-icons/fi'
import './ChatBot.css'

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Xin chào! 👋 Tôi là trợ lý AI của BusGo. Tôi có thể giúp bạn về:',
      sender: 'bot',
      suggestions: [
        'Cách đặt vé',
        'Thanh toán',
        'Hủy vé & Hoàn phí',
        'Hỗ trợ khác'
      ]
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Knowledge base for AI responses
  const knowledgeBase = {
    'cách đặt vé': {
      text: `📝 **Hướng dẫn đặt vé BusGo:**

1. **Tìm kiếm chuyến xe**
   - Nhập điểm đi, điểm đến
   - Chọn ngày khởi hành
   - Nhấn "Tìm kiếm"

2. **Chọn chuyến xe**
   - Xem chi tiết giá, thời gian, tiện nghi
   - Nhấn nút "Chọn"

3. **Đặt vé & Thanh toán**
   - Nhập thông tin hành khách
   - Chọn ghế ngồi
   - Xác nhận thanh toán

4. **Nhận vé**
   - Vé sẽ được gửi qua email
   - Xem QR code ở "Lịch sử đặt vé"`,
      suggestions: ['Thanh toán', 'Hủy vé & Hoàn phí', 'Hỏi khác']
    },
    'thanh toán': {
      text: `💳 **Phương thức thanh toán:**

**BusGo hỗ trợ:**
- 💰 Thẻ tín dụng/Ghi nợ (Visa, Mastercard)
- 🏦 Chuyển khoản ngân hàng
- 📱 Ví điện tử (Momo, ZaloPay)
- 💵 Thanh toán tại quầy

**Lưu ý:**
- Thanh toán an toàn 100% (SSL certificate)
- Tiền được nhà xe xác nhận trong 24h
- Nếu lỗi thanh toán, vui lòng thử lại hoặc liên hệ hotline`,
      suggestions: ['Cách đặt vé', 'Hủy vé & Hoàn phí', 'Hỏi khác']
    },
    'hủy vé & hoàn phí': {
      text: `❌ **Chính sách hủy vé & hoàn phí:**

**Thời gian hủy vé:**

| Thời gian | Hoàn phí |
|-----------|----------|
| Trước **24h** khởi hành | ✅ Hoàn 100% |
| **6-24h** trước khởi hành | ✅ Hoàn 80% |
| **Dưới 6h** trước khởi hành | ✅ Hoàn 50% |
| **Sau** khởi hành | ❌ Không hoàn |

**Cách hủy vé:**
1. Vào "Lịch sử đặt vé"
2. Chọn chuyến xe muốn hủy
3. Nhấn "Hủy vé"
4. Xác nhận hủy
5. Tiền hoàn lại trong 2-3 ngày làm việc

**Lưu ý:** Tiền hoàn lại sẽ được chuyển về tài khoản ngân hàng đăng ký`,
      suggestions: ['Cách đặt vé', 'Thanh toán', 'Hỏi khác']
    },
    'hỗ trợ khác': {
      text: `☎️ **Liên hệ hỗ trợ khác:**

**Hotline:** 1900 123 456
**Email:** support@busgo.vn
**Chat:** Mở 24/7 (Giờ làm việc: 7h - 22h)

**Thời gian phản hồi:**
- Chat: < 5 phút
- Email: < 2 giờ
- Hotline: Kết nối tức thì

**Các vấn đề thường gặp:**
- Không nhận được vé
- Lỗi thanh toán
- Hành lý & hàng hóa
- Khiếu nại dịch vụ

Chúng tôi sẵn sàng hỗ trợ bạn! 😊`,
      suggestions: ['Cách đặt vé', 'Thanh toán', 'Hủy vé & Hoàn phí']
    }
  }

  const handleSendMessage = (messageText) => {
    if (!messageText.trim()) return

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: messageText,
      sender: 'user'
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')

    // Simulate AI response delay
    setTimeout(() => {
      const lowerCaseInput = messageText.toLowerCase()
      
      // Try to find matching response
      let botResponse = null
      for (const [key, value] of Object.entries(knowledgeBase)) {
        if (lowerCaseInput.includes(key.split('&')[0].trim()) || 
            key.split('&').some(k => lowerCaseInput.includes(k.trim()))) {
          botResponse = value
          break
        }
      }

      // If no match, try keyword matching
      if (!botResponse) {
        if (lowerCaseInput.includes('đặt') || lowerCaseInput.includes('vé')) {
          botResponse = knowledgeBase['cách đặt vé']
        } else if (lowerCaseInput.includes('thanh') && lowerCaseInput.includes('toán')) {
          botResponse = knowledgeBase['thanh toán']
        } else if (lowerCaseInput.includes('hủy') || lowerCaseInput.includes('hoàn')) {
          botResponse = knowledgeBase['hủy vé & hoàn phí']
        } else {
          botResponse = knowledgeBase['hỗ trợ khác']
        }
      }

      const aiMessage = {
        id: messages.length + 2,
        text: botResponse.text,
        sender: 'bot',
        suggestions: botResponse.suggestions
      }

      setMessages(prev => [...prev, aiMessage])
    }, 500)
  }

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="chat-button"
        title={isOpen ? 'Đóng chat' : 'Mở chat hỗ trợ'}
      >
        {isOpen ? (
          <FiX size={24} />
        ) : (
          <span className="chat-icon">💬</span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <h6 className="mb-0 fw-bold">BusGo AI Assistant</h6>
            <button
              onClick={() => setIsOpen(false)}
              className="btn-close"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <FiX size={20} />
            </button>
          </div>

          <div className="chat-messages">
            {messages.map(message => (
              <div key={message.id} className={`message message-${message.sender}`}>
                <div className="message-content">
                  {message.text.split('\n').map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
                
                {message.suggestions && (
                  <div className="message-suggestions">
                    {message.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        className="suggestion-btn"
                        onClick={() => handleSendMessage(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <input
              type="text"
              className="chat-input"
              placeholder="Nhập câu hỏi của bạn..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage(inputValue)
                }
              }}
            />
            <button
              className="send-btn"
              onClick={() => handleSendMessage(inputValue)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem'
              }}
            >
              <FiSend size={20} style={{ color: 'var(--color-primary-600)' }} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
