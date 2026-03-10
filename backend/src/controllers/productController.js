const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

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
const getProducts = async (req, res) => {
  try {
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

    // ── Build filters ──
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

    // ── Valid sort fields ──
    const validSortFields = ['createdAt', 'price', 'downloadsCount'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              reputationScore: true,
            }
          }
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
      }
    });

  } catch (err) {
    console.error('GetProducts error:', err);
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
};

// ────────────────────────────────────────────────
// GET SINGLE PRODUCT
// ────────────────────────────────────────────────
const getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            reputationScore: true,
            bio: true,
          }
        },
        reviews: {
          include: {
            reviewer: {
              select: { id: true, username: true, avatarUrl: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: { select: { orders: true } }
      }
    });

    if (!product || !product.isActive || product.deletedAt) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.json({ product: {
      ...safeProduct(product),
      reviews: product.reviews,
      totalSales: product._count.orders,
    }});

  } catch (err) {
    console.error('GetProduct error:', err);
    res.status(500).json({ error: 'Failed to fetch product.' });
  }
};

// ────────────────────────────────────────────────
// CREATE PRODUCT
// ────────────────────────────────────────────────
const createProduct = async (req, res) => {
  try {
    const { title, description, price, category, tags, previewUrl } = req.body;
    const sellerId = req.user.userId;

    // ── Validation ──
    if (!title || !description || !price || !category) {
      return res.status(400).json({ error: 'Title, description, price and category are required.' });
    }
    if (title.length < 5 || title.length > 100) {
      return res.status(400).json({ error: 'Title must be between 5 and 100 characters.' });
    }
    if (description.length < 20) {
      return res.status(400).json({ error: 'Description must be at least 20 characters.' });
    }
    if (parseFloat(price) < 0) {
      return res.status(400).json({ error: 'Price cannot be negative.' });
    }

    const validCategories = [
      'react-components',
      'node-packages',
      'python-scripts',
      'mobile-templates',
      'ui-kits',
      'apis',
      'tools',
      'blockchain',
      'other'
    ];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        error: 'Invalid category.',
        validCategories
      });
    }

    // ── Clean tags ──
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
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            reputationScore: true,
          }
        }
      }
    });

    res.status(201).json({
      message: 'Product listed successfully on DevChain!',
      product: safeProduct(product),
    });

  } catch (err) {
    console.error('CreateProduct error:', err);
    res.status(500).json({ error: 'Failed to create product.' });
  }
};

// ────────────────────────────────────────────────
// UPDATE PRODUCT
// ────────────────────────────────────────────────
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, category, tags, previewUrl } = req.body;
    const userId = req.user.userId;

    // ── Check ownership ──
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    if (existing.sellerId !== userId) {
      return res.status(403).json({ error: 'You can only edit your own products.' });
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
          select: { id: true, username: true, avatarUrl: true, reputationScore: true }
        }
      }
    });

    res.json({
      message: 'Product updated successfully.',
      product: safeProduct(updated),
    });

  } catch (err) {
    console.error('UpdateProduct error:', err);
    res.status(500).json({ error: 'Failed to update product.' });
  }
};

// ────────────────────────────────────────────────
// DELETE PRODUCT (soft delete)
// ────────────────────────────────────────────────
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    if (existing.sellerId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own products.' });
    }

    // Soft delete — never permanently delete (blockchain principle)
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false }
    });

    res.json({ message: 'Product removed from marketplace.' });

  } catch (err) {
    console.error('DeleteProduct error:', err);
    res.status(500).json({ error: 'Failed to delete product.' });
  }
};

// ────────────────────────────────────────────────
// GET MY PRODUCTS (seller dashboard)
// ────────────────────────────────────────────────
const getMyProducts = async (req, res) => {
  try {
    const sellerId = req.user.userId;

    const products = await prisma.product.findMany({
      where: { sellerId, deletedAt: null },
      include: {
        _count: { select: { orders: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      products: products.map(p => ({
        ...safeProduct(p),
        totalSales: p._count.orders,
      }))
    });

  } catch (err) {
    console.error('GetMyProducts error:', err);
    res.status(500).json({ error: 'Failed to fetch your products.' });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
};
