const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { protect } = require('../middleware/authMiddleware');

// ==================== TICKET STAFF ====================
// Ticket staff operations - require authentication
router.get('/tickets', protect, staffController.getTicketsList);
router.post('/tickets/check-in', protect, staffController.checkInTicket);
router.post('/tickets/offline', protect, staffController.createOfflineTicket);
router.put('/tickets/:id/refund', protect, staffController.refundTicket);

// ==================== SUPPORT STAFF – LIVE CHAT ====================
// GET  /api/staff/support/chats               - Danh sách phiên chat của agent
// POST /api/staff/support/chats               - Tạo phiên chat mới
router.get('/support/chats', protect, staffController.getChatSessions);
router.post('/support/chats', protect, staffController.createChatSession);

// GET  /api/staff/support/chats/:id/messages  - Lịch sử tin nhắn
// POST /api/staff/support/chats/:id/messages  - Gửi tin nhắn
// PUT  /api/staff/support/chats/:id/close     - Đóng phiên chat
router.get('/support/chats/:sessionId/messages', protect, staffController.getChatMessages);
router.post('/support/chats/:sessionId/messages', protect, staffController.sendChatMessage);
router.put('/support/chats/:sessionId/close', protect, staffController.closeChatSession);

// GET  /api/staff/support/customers/:id/tickets - Vé của khách hàng (xem trong chat)
router.get('/support/customers/:customerId/tickets', protect, staffController.getCustomerTickets);

// ==================== SUPPORT STAFF – CANCELLATION/REFUND ====================
// GET  /api/staff/support/cancellations                   - Danh sách yêu cầu hủy
// POST /api/staff/support/cancellations                   - Tạo yêu cầu hủy (pending)
router.get('/support/cancellations', protect, staffController.getCancellationRequests);
router.post('/support/cancellations', protect, staffController.createCancellationRequest);

// GET  /api/staff/support/cancellations/:ticketId/check   - Kiểm tra điều kiện + tính hoàn tiền
// POST /api/staff/support/cancellations/:ticketId/process - Phê duyệt/Từ chối
router.get('/support/cancellations/:ticketId/check', protect, staffController.checkCancellationEligibility);
router.post('/support/cancellations/:ticketId/process', protect, staffController.processCancellationRequest);

module.exports = router;
