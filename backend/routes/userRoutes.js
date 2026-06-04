const express = require('express');
const { 
  getProfile, updateProfile, 
  getMyChatSession, createMyChatSession, getMyChatMessages, sendMyChatMessage,
  requestTicketCancellation
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Routes yêu cầu xác thực
router.route('/profile')
  .get(protect, getProfile)
  .put(protect, updateProfile);

// Customer Chat Routes
router.route('/chat')
  .get(protect, getMyChatSession)
  .post(protect, createMyChatSession);

router.route('/chat/:sessionId/messages')
  .get(protect, getMyChatMessages)
  .post(protect, sendMyChatMessage);

// Customer Cancellation Request
router.post('/tickets/:ticketId/cancel', protect, requestTicketCancellation);

module.exports = router;
