const express = require('express');
const router = express.Router();
const Joi = require('joi');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// ── Validation schemas ──
const createProductSchema = {
  body: Joi.object({
    title: Joi.string().trim().min(5).max(100).required(),
    description: Joi.string().trim().min(20).max(10000).required(),
    price: Joi.number().positive().precision(2).required(),
    category: Joi.string().valid(
      'react-components', 'node-packages', 'python-scripts',
      'mobile-templates', 'ui-kits', 'apis', 'tools', 'blockchain', 'other'
    ).required(),
    tags: Joi.array().items(Joi.string().trim().lowercase().max(30)).max(10).default([]),
    previewUrl: Joi.string().uri().optional().allow('', null),
  }),
};

const updateProductSchema = {
  body: Joi.object({
    title: Joi.string().trim().min(5).max(100),
    description: Joi.string().trim().min(20).max(10000),
    price: Joi.number().positive().precision(2),
    category: Joi.string().valid(
      'react-components', 'node-packages', 'python-scripts',
      'mobile-templates', 'ui-kits', 'apis', 'tools', 'blockchain', 'other'
    ),
    tags: Joi.array().items(Joi.string().trim().lowercase().max(30)).max(10),
    previewUrl: Joi.string().uri().optional().allow('', null),
  }).min(1).message('At least one field must be provided for update'),
};

const productIdParam = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

// ── Routes ──
router.get('/', getProducts);
router.get('/seller/me', protect, getMyProducts);
router.get('/:id', validate(productIdParam), getProduct);
router.post('/', protect, validate(createProductSchema), createProduct);
router.put('/:id', protect, validate(productIdParam), validate(updateProductSchema), updateProduct);
router.delete('/:id', protect, validate(productIdParam), deleteProduct);

module.exports = router;
