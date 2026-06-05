const express = require('express');
const router = express.Router();
const cargoController = require('../controllers/cargoController');
const { protect } = require('../middleware/authMiddleware');

// Customer routes (authenticated)
router.post('/consignment', protect, cargoController.createConsignment);
router.put('/consignment/:id', protect, cargoController.updateConsignment);
router.get('/my-consignments', protect, cargoController.getCustomerConsignments);

// Customer: Hủy đơn ký gửi (chưa thanh toán → hủy ngay; đã thanh toán → gửi yêu cầu)
router.put('/consignment/:id/cancel', protect, cargoController.cancelConsignment);

// Driver routes (authenticated)
router.get('/driver/consignments', protect, cargoController.getDriverConsignments);

// Staff routes (authenticated)
router.get('/staff/consignments', protect, cargoController.getStaffConsignments);
router.get('/staff/drivers', protect, cargoController.getStaffDrivers);
router.get('/staff/vehicles', protect, cargoController.getAvailableVehicles);
// Staff: Duyệt yêu cầu hủy đơn sau thanh toán
router.put('/consignment/:id/approve-cancel', protect, cargoController.approveCancel);

// Staff: Duyệt đơn bị khách chỉnh sửa
router.put('/consignment/:id/approve-edit', protect, cargoController.approveEditConsignment);

// Details and status updates (public - internal API)
router.get('/consignment/:id', cargoController.getConsignmentById);
router.put('/consignment/:id/status', cargoController.updateConsignmentStatus);
router.post('/consignment/:id/pay', cargoController.processConsignmentPayment);

module.exports = router;
