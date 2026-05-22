const express = require('express');
const { searchTrips, getTripById } = require('../controllers/tripController');

const router = express.Router();

router.get('/search', searchTrips);
router.get('/:id', getTripById);

module.exports = router;
