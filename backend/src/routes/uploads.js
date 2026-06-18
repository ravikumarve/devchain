const express = require('express');
const Joi = require('joi');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { upload, uploadProductFile, downloadProductFile, getFileInfo } = require('../controllers/uploadController');

// ── Validation schemas ──
const productIdParam = {
  params: Joi.object({
    productId: Joi.string().uuid().required(),
  }),
};

// ── Routes ──
router.post('/product/:productId', protect, validate(productIdParam), upload.single('file'), uploadProductFile);
router.get('/product/:productId/download', protect, validate(productIdParam), downloadProductFile);
router.get('/product/:productId/info', protect, validate(productIdParam), getFileInfo);

module.exports = router;
