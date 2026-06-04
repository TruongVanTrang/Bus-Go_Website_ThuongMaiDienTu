const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getDriverTrips,
  updateTripStatus,
  getTripPassengers,
  checkInPassenger,
  getTripCargo,
  updateCargoStatus
} = require('../controllers/driverController');

const router = express.Router();

// Tất cả các endpoints đều bắt buộc phải đăng nhập tài khoản tài xế
router.use(protect);

router.get('/my-trips', getDriverTrips);
router.put('/trips/:tripId/status', updateTripStatus);
router.get('/trips/:tripId/passengers', getTripPassengers);
router.put('/passengers/:ticketId/check-in', checkInPassenger);
router.get('/trips/:tripId/cargo', getTripCargo);
router.put('/cargo/:cargoId/status', updateCargoStatus);

module.exports = router;
