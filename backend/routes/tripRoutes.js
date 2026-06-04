const express = require('express');
const { searchTrips, getTripById, getDriverTrips } = require('../controllers/tripController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Tìm kiếm chuyến xe / lấy tất cả (có filter driverId)
router.get('/search', searchTrips);
// Lấy danh sách chuyến xe theo tài xế (driverId trong query string)
router.get('/', protect, getDriverTrips);
// Lấy chi tiết chuyến xe
router.get('/:id', getTripById);

module.exports = router;
