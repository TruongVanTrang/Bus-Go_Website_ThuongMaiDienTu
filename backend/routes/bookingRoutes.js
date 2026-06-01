const express = require('express');
const {
  createBooking,
  getMyTickets,
  getTicketDetail,
  cancelBooking,
  getFeedback,
  submitFeedback
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createBooking);
router.get('/my-tickets', protect, getMyTickets);
router.get('/:id', protect, getTicketDetail);
router.get('/:id/feedback', protect, getFeedback);
router.post('/:id/cancel', protect, cancelBooking);
router.post('/:id/feedback', protect, submitFeedback);

module.exports = router;
