const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { upload, uploadProductFile, downloadProductFile, getFileInfo } = require('../controllers/uploadController');

// Upload file for a product (seller only)
router.post('/product/:productId', protect, upload.single('file'), uploadProductFile);

// Download product file (buyer or seller)
router.get('/product/:productId/download', protect, downloadProductFile);

// Get file info
router.get('/product/:productId/info', protect, getFileInfo);

module.exports = router;
