const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { protect } = require('../middleware/authMiddleware');

// Ticket staff operations - require authentication
router.get('/tickets', protect, staffController.getTicketsList);
router.post('/tickets/check-in', protect, staffController.checkInTicket);
router.post('/tickets/offline', protect, staffController.createOfflineTicket);
router.put('/tickets/:id/refund', protect, staffController.refundTicket);

module.exports = router;
