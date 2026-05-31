const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// Quản lý Users
router.get('/users', protect, admin, adminController.getAllUsers);
router.put('/users/:id', protect, admin, adminController.updateUserStatus);

module.exports = router;
