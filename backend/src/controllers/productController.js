const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { getLogger } = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} = require('../utils/errors');

const log = getLogger('products');

const VALID_CATEGORIES = [
  'react-components', 'node-packages', 'python-scripts',
  'mobile-templates', 'ui-kits', 'apis', 'tools', 'blockchain', 'other',
];

const VALID_SORT_FIELDS = ['createdAt', 'price', 'downloadsCount'];

// ── Helper: safe product object ──
const safeProduct = (product) => ({
  id: product.id,
  title: product.title,
  description: product.description,
  price: product.price,
  category: product.category,
  previewUrl: product.previewUrl,
  tags: product.tags,
  downloadsCount: product.downloadsCount,
  createdAt: product.createdAt,
  seller: product.seller ? {
    id: product.seller.id,
    username: product.seller.username,
    avatarUrl: product.seller.avatarUrl,
    reputationScore: product.seller.reputationScore,
  } : null,
});

// ────────────────────────────────────────────────
// GET ALL PRODUCTS (with search + filter)
// ────────────────────────────────────────────────
const getProducts = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
    order = 'desc',
    page = 1,
    limit = 12,
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = { isActive: true, deletedAt: null };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { tags: { has: search.toLowerCase() } },
    ];
  }

  if (category) where.category = category;
  if (minPrice) where.price = { ...where.price, gte: parseFloat(minPrice) };
  if (maxPrice) where.price = { ...where.price, lte: parseFloat(maxPrice) };

  const sortField = VALID_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        seller: {
          select: { id: true, username: true, avatarUrl: true, reputationScore: true },
        },
      },
      orderBy: { [sortField]: order === 'asc' ? 'asc' : 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    products: products.map(safeProduct),
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// ────────────────────────────────────────────────
// GET SINGLE PRODUCT
// ────────────────────────────────────────────────
const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      seller: {
        select: { id: true, username: true, avatarUrl: true, reputationScore: true, bio: true },
      },
      reviews: {
        include: {
          reviewer: { select: { id: true, username: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: { select: { orders: true } },
    },
  });

  if (!product || !product.isActive || product.deletedAt) {
    throw new NotFoundError('Product not found.');
  }

  res.json({
    product: {
      ...safeProduct(product),
      reviews: product.reviews,
      totalSales: product._count.orders,
    },
  });
});

// ────────────────────────────────────────────────
// CREATE PRODUCT
// ────────────────────────────────────────────────
const createProduct = asyncHandler(async (req, res) => {
  const { title, description, price, category, tags, previewUrl } = req.body;
  const sellerId = req.user.userId;

  // ── Validation ──
  if (!title || !description || !price || !category) {
    throw new BadRequestError('Title, description, price and category are required.');
  }
  if (title.length < 5 || title.length > 100) {
    throw new BadRequestError('Title must be between 5 and 100 characters.');
  }
  if (description.length < 20) {
    throw new BadRequestError('Description must be at least 20 characters.');
  }
  if (parseFloat(price) < 0) {
    throw new BadRequestError('Price cannot be negative.');
  }
  if (!VALID_CATEGORIES.includes(category)) {
    throw new BadRequestError(`Invalid category. Valid: ${VALID_CATEGORIES.join(', ')}`);
  }

  const cleanTags = Array.isArray(tags)
    ? tags.map(t => t.toLowerCase().trim()).slice(0, 10)
    : [];

  const product = await prisma.product.create({
    data: {
      sellerId,
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
      category,
      tags: cleanTags,
      previewUrl: previewUrl || null,
    },
    include: {
      seller: {
        select: { id: true, username: true, avatarUrl: true, reputationScore: true },
      },
    },
  });

  log.info({ productId: product.id, sellerId }, 'Product created');

  res.status(201).json({
    message: 'Product listed successfully on DevChain!',
    product: safeProduct(product),
  });
});

// ────────────────────────────────────────────────
// UPDATE PRODUCT
// ────────────────────────────────────────────────
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, price, category, tags, previewUrl } = req.body;
  const userId = req.user.userId;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) {
    throw new NotFoundError('Product not found.');
  }
  if (existing.sellerId !== userId) {
    throw new ForbiddenError('You can only edit your own products.');
  }

  if (category && !VALID_CATEGORIES.includes(category)) {
    throw new BadRequestError('Invalid category.');
  }

  const updated = await prisma.product.update({
    where: { id },
    data: {
      ...(title && { title: title.trim() }),
      ...(description && { description: description.trim() }),
      ...(price !== undefined && { price: parseFloat(price) }),
      ...(category && { category }),
      ...(tags && { tags: tags.map(t => t.toLowerCase().trim()).slice(0, 10) }),
      ...(previewUrl !== undefined && { previewUrl }),
    },
    include: {
      seller: {
        select: { id: true, username: true, avatarUrl: true, reputationScore: true },
      },
    },
  });

  res.json({
    message: 'Product updated successfully.',
    product: safeProduct(updated),
  });
});

// ────────────────────────────────────────────────
// DELETE PRODUCT (soft delete)
// ────────────────────────────────────────────────
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) {
    throw new NotFoundError('Product not found.');
  }
  if (existing.sellerId !== userId) {
    throw new ForbiddenError('You can only delete your own products.');
  }

  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  log.info({ productId: id, sellerId: userId }, 'Product deleted');

  res.json({ message: 'Product removed from marketplace.' });
});

// ────────────────────────────────────────────────
// GET MY PRODUCTS (seller dashboard)
// ────────────────────────────────────────────────
const getMyProducts = asyncHandler(async (req, res) => {
  const sellerId = req.user.userId;

  const products = await prisma.product.findMany({
    where: { sellerId, deletedAt: null },
    include: { _count: { select: { orders: true } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    products: products.map(p => ({
      ...safeProduct(p),
      totalSales: p._count.orders,
    })),
  });
});

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
};
