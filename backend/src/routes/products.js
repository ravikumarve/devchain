const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');

router.get('/', getProducts);
router.get('/seller/me', protect, getMyProducts);
router.get('/:id', getProduct);
router.post('/', protect, createProduct);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;
