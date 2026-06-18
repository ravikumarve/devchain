const prisma = require('../config/database');
const { getLogger } = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');
const {
  BadRequestError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
} = require('../utils/errors');
const { notifyNewReview } = require('../services/notificationService');

const log = getLogger('review');

// ────────────────────────────────────────────────
// CREATE REVIEW (only by verified purchasers)
// ────────────────────────────────────────────────
const createReview = asyncHandler(async (req, res) => {
  const { productId, rating, comment } = req.body;
  const reviewerId = req.user.userId;

  // ── Validate product exists ──
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) {
    throw new NotFoundError('Product not found.');
  }

  // ── Only purchasers can review ──
  const order = await prisma.order.findFirst({
    where: {
      buyerId: reviewerId,
      productId,
      status: 'completed',
    },
  });
  if (!order) {
    throw new BadRequestError('You can only review products you have purchased.');
  }

  // ── One review per product ──
  const existing = await prisma.review.findFirst({
    where: { reviewerId, productId },
  });
  if (existing) {
    throw new ConflictError('You have already reviewed this product.');
  }

  // ── Create review ──
  const review = await prisma.review.create({
    data: {
      reviewerId,
      revieweeId: product.sellerId,
      productId,
      rating,
      comment: comment || null,
    },
    include: {
      reviewer: { select: { id: true, username: true, avatarUrl: true } },
    },
  });

  log.info({ reviewId: review.id, productId, rating }, 'Review created');

  // Notify seller of new review
  notifyNewReview({
    id: review.id,
    rating: review.rating,
    revieweeId: product.sellerId,
    productId,
    product: { title: product.title },
  }).catch(err => log.warn({ err }, 'Review notification failed'));

  res.status(201).json({ data: review });
});

// ────────────────────────────────────────────────
// GET REVIEWS FOR A PRODUCT
// ────────────────────────────────────────────────
const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const [reviews, total, avgResult] = await Promise.all([
    prisma.review.findMany({
      where: { productId },
      include: {
        reviewer: { select: { id: true, username: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.review.count({ where: { productId } }),
    prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
    }).catch(() => ({ _avg: { rating: null } })),
  ]);

  res.json({
    data: reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    averageRating: avgResult._avg.rating || 0,
    totalReviews: total,
  });
});

// ────────────────────────────────────────────────
// GET CURRENT USER'S REVIEW FOR A PRODUCT
// ────────────────────────────────────────────────
const getMyReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const review = await prisma.review.findFirst({
    where: { reviewerId: req.user.userId, productId },
    include: {
      reviewer: { select: { id: true, username: true, avatarUrl: true } },
    },
  });

  res.json({ data: review || null });
});

// ────────────────────────────────────────────────
// UPDATE REVIEW
// ────────────────────────────────────────────────
const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) {
    throw new NotFoundError('Review not found.');
  }
  if (review.reviewerId !== req.user.userId) {
    throw new UnauthorizedError('You can only edit your own reviews.');
  }

  const updated = await prisma.review.update({
    where: { id },
    data: {
      ...(rating !== undefined && { rating }),
      ...(comment !== undefined && { comment }),
    },
    include: {
      reviewer: { select: { id: true, username: true, avatarUrl: true } },
    },
  });

  log.info({ reviewId: id }, 'Review updated');
  res.json({ data: updated });
});

// ────────────────────────────────────────────────
// DELETE REVIEW
// ────────────────────────────────────────────────
const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) {
    throw new NotFoundError('Review not found.');
  }
  if (review.reviewerId !== req.user.userId) {
    throw new UnauthorizedError('You can only delete your own reviews.');
  }

  await prisma.review.delete({ where: { id } });

  log.info({ reviewId: id }, 'Review deleted');
  res.json({ message: 'Review deleted successfully.' });
});

// ────────────────────────────────────────────────
// GET REVIEWS FOR A SELLER
// ────────────────────────────────────────────────
const getSellerReviews = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const [reviews, total, avgResult] = await Promise.all([
    prisma.review.findMany({
      where: { revieweeId: sellerId },
      include: {
        reviewer: { select: { id: true, username: true, avatarUrl: true } },
        product: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.review.count({ where: { revieweeId: sellerId } }),
    prisma.review.aggregate({
      where: { revieweeId: sellerId },
      _avg: { rating: true },
    }).catch(() => ({ _avg: { rating: null } })),
  ]);

  res.json({
    data: reviews,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    averageRating: avgResult._avg.rating || 0,
    totalReviews: total,
  });
});

module.exports = {
  createReview,
  getProductReviews,
  getMyReview,
  updateReview,
  deleteReview,
  getSellerReviews,
};
