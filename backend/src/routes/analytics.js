const express = require('express');
const router = express.Router();
const { getSellerAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.get('/seller', protect, getSellerAnalytics);

module.exports = router;
