const express = require('express');
const router = express.Router();
const {
  purchaseProduct,
  verifyCertificate,
  getMyPurchases,
  getMySales,
} = require('../controllers/ownershipController');
const { protect } = require('../middleware/auth');

// Public — anyone can verify a certificate
router.get('/verify/:hash', verifyCertificate);

// Protected
router.post('/purchase', protect, purchaseProduct);
router.get('/my-purchases', protect, getMyPurchases);
router.get('/my-sales', protect, getMySales);

module.exports = router;
