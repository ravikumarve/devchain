const express = require('express');
const Joi = require('joi');
const router = express.Router();
const {
  purchaseProduct,
  verifyCertificate,
  getMyPurchases,
  getMySales,
} = require('../controllers/ownershipController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// ── Validation schemas ──
const purchaseSchema = {
  body: Joi.object({
    productId: Joi.string().uuid().required(),
  }),
};

const verifySchema = {
  params: Joi.object({
    hash: Joi.string().length(64).hex().required(),
  }),
};

// ── Routes ──
router.get('/verify/:hash', validate(verifySchema), verifyCertificate);
router.post('/purchase', protect, validate(purchaseSchema), purchaseProduct);
router.get('/my-purchases', protect, getMyPurchases);
router.get('/my-sales', protect, getMySales);

module.exports = router;
