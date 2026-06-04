const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const staffController = require('../controllers/staffController');
const vehicleController = require('../controllers/vehicleController');
const routeController = require('../controllers/routeController');
const tripAdminController = require('../controllers/tripAdminController');
const analyticsController = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/authMiddleware');

// Quản lý Users
router.get('/users', protect, admin, adminController.getAllUsers);
router.put('/users/:id', protect, admin, adminController.updateUserStatus);

// Quản lý Nhân sự
router.get('/staff', protect, admin, staffController.getAllStaff);
router.post('/staff', protect, admin, staffController.createStaff);
router.put('/staff/:id', protect, admin, staffController.updateStaff);

// Quản lý Phương tiện
router.get('/vehicles', protect, admin, vehicleController.getAllVehicles);
router.post('/vehicles', protect, admin, vehicleController.createVehicle);
router.put('/vehicles/:id', protect, admin, vehicleController.updateVehicle);
router.delete('/vehicles/:id', protect, admin, vehicleController.deleteVehicle);

// Quản lý Tuyến đường
router.get('/routes', protect, admin, routeController.getAllRoutes);
router.post('/routes', protect, admin, routeController.createRoute);
router.put('/routes/:id', protect, admin, routeController.updateRoute);
router.delete('/routes/:id', protect, admin, routeController.deleteRoute);

// Quản lý Chuyến xe
router.get('/trips', protect, admin, tripAdminController.getAllTrips);
router.post('/trips', protect, admin, tripAdminController.createTrip);
router.put('/trips/:id', protect, admin, tripAdminController.updateTrip);

// Báo cáo Dashboard
router.get('/analytics/revenue', protect, admin, analyticsController.getRevenue);
router.get('/analytics/routes', protect, admin, analyticsController.getRouteAnalytics);
router.get('/analytics/ratings', protect, admin, analyticsController.getRatings);

// Quản lý Sự cố và Thông báo Admin
router.get('/incidents', protect, admin, adminController.getIncidents);
router.put('/incidents/:id/resolve', protect, admin, adminController.resolveIncident);
router.get('/notifications', protect, admin, adminController.getAdminNotifications);
router.put('/notifications/mark-read', protect, admin, adminController.markAdminNotificationsAsRead);

module.exports = router;
