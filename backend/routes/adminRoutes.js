const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const staffController = require('../controllers/staffController');
const { protect, admin } = require('../middleware/authMiddleware');

// Quản lý Users
router.get('/users', protect, admin, adminController.getAllUsers);
router.put('/users/:id', protect, admin, adminController.updateUserStatus);

// Quản lý Nhân sự
router.get('/staff', protect, admin, staffController.getAllStaff);
router.post('/staff', protect, admin, staffController.createStaff);
router.put('/staff/:id', protect, admin, staffController.updateStaff);

module.exports = router;
