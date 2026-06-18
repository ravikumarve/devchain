const express = require('express');
const router = express.Router();
const Joi = require('joi');
const {
  createReview,
  getProductReviews,
  getMyReview,
  updateReview,
  deleteReview,
  getSellerReviews,
} = require('../controllers/reviewController');
const { protect, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// ── Validation schemas ──
const productIdParam = {
  params: Joi.object({
    productId: Joi.string().uuid().required(),
  }),
};

const reviewIdParam = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

const sellerIdParam = {
  params: Joi.object({
    sellerId: Joi.string().uuid().required(),
  }),
};

const createReviewSchema = {
  body: Joi.object({
    productId: Joi.string().uuid().required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().trim().max(2000).optional().allow('', null),
  }),
};

const updateReviewSchema = {
  body: Joi.object({
    rating: Joi.number().integer().min(1).max(5),
    comment: Joi.string().trim().max(2000).optional().allow('', null),
  }).min(1).message('At least rating or comment must be provided'),
};

// ── Routes ──
router.post('/', protect, validate(createReviewSchema), createReview);
router.get('/product/:productId', optionalAuth, validate(productIdParam), getProductReviews);
router.get('/product/:productId/mine', protect, validate(productIdParam), getMyReview);
router.put('/:id', protect, validate(reviewIdParam), validate(updateReviewSchema), updateReview);
router.delete('/:id', protect, validate(reviewIdParam), deleteReview);
router.get('/seller/:sellerId', validate(sellerIdParam), getSellerReviews);

module.exports = router;
