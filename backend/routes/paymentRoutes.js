const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Tạo link thanh toán VNPay
router.post('/vnpay/create_payment_url', paymentController.createPaymentUrl);

// VNPay trả kết quả về (IPN)
router.get('/vnpay/ipn', paymentController.vnpayIpn);

module.exports = router;
