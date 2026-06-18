const crypto = require('crypto');

const prisma = require('../config/database');
const { getLogger } = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');
const {
  BadRequestError,
  NotFoundError,
} = require('../utils/errors');

const log = getLogger('ownership');

// ── Generate unique ownership hash ──
const generateOwnershipHash = (buyerId, productId, timestamp) => {
  const data = `${buyerId}:${productId}:${timestamp}:${process.env.OWNERSHIP_HASH_SECRET || 'devchain-secret'}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};

// ────────────────────────────────────────────────
// PURCHASE PRODUCT
// ────────────────────────────────────────────────
const purchaseProduct = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const buyerId = req.user.userId;

  if (!productId) {
    throw new BadRequestError('Product ID is required.');
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      seller: { select: { id: true, username: true } },
    },
  });

  if (!product || !product.isActive || product.deletedAt) {
    throw new NotFoundError('Product not found.');
  }

  if (product.sellerId === buyerId) {
    throw new BadRequestError("You can't purchase your own product.");
  }

  // Check if already purchased
  const existingOrder = await prisma.order.findFirst({
    where: { buyerId, productId },
  });

  if (existingOrder) {
    return res.status(409).json({
      error: 'You already own this product.',
      ownershipHash: existingOrder.ownershipHash,
      certificateUrl: `/api/v1/ownership/verify/${existingOrder.ownershipHash}`,
    });
  }

  // Create order + ownership in transaction
  const timestamp = Date.now().toString();
  const ownershipHash = generateOwnershipHash(buyerId, productId, timestamp);

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        buyerId,
        productId,
        amountPaid: product.price,
        paymentMethod: 'simulated',
        ownershipHash,
        status: 'completed',
      },
    });

    const ownershipRecord = await tx.ownershipRecord.create({
      data: {
        orderId: order.id,
        buyerId,
        productId,
        ownershipHash,
        isOnChain: false,
      },
    });

    await tx.product.update({
      where: { id: productId },
      data: { downloadsCount: { increment: 1 } },
    });

    return { order, ownershipRecord };
  });

  log.info({ productId, buyerId, ownershipHash }, 'Product purchased');

  res.status(201).json({
    message: 'Purchase successful! Your ownership certificate has been issued.',
    order: {
      id: result.order.id,
      productId,
      amountPaid: result.order.amountPaid,
      status: result.order.status,
      purchasedAt: result.order.createdAt,
    },
    certificate: {
      ownershipHash,
      isOnChain: false,
      blockchainStatus: 'Simulated — Polygon integration coming in Phase 2',
      certificateUrl: `/api/v1/ownership/verify/${ownershipHash}`,
    },
  });

  // Fire-and-forget email notifications
  sendEmailNotifications(buyerId, product).catch(err =>
    log.warn({ err }, 'Email notification failed')
  );
});

// ── Non-blocking email notifications ──
async function sendEmailNotifications(buyerId, product) {
  try {
    const emailService = require('../services/emailService');
    const [buyer, seller] = await Promise.all([
      prisma.user.findUnique({ where: { id: buyerId } }),
      prisma.user.findUnique({ where: { id: product.sellerId } }),
    ]);

    if (!buyer || !seller) return;

    const downloadUrl = `${process.env.APP_URL || 'http://localhost:3000'}/product/${product.id}`;

    await Promise.allSettled([
      emailService.sendPurchaseReceipt(buyer.email, buyer.username, product.title, product.price, downloadUrl),
      emailService.sendSaleNotification(seller.email, seller.username, product.title, buyer.username, product.price),
    ]);
  } catch (err) {
    log.warn({ err }, 'Email notification error');
  }
}

// ────────────────────────────────────────────────
// VERIFY OWNERSHIP CERTIFICATE (public)
// ────────────────────────────────────────────────
const verifyCertificate = asyncHandler(async (req, res) => {
  const { hash } = req.params;

  if (!hash || hash.length !== 64) {
    throw new BadRequestError('Invalid certificate hash format.');
  }

  const record = await prisma.ownershipRecord.findUnique({
    where: { ownershipHash: hash },
    include: {
      order: {
        include: {
          buyer: { select: { id: true, username: true, avatarUrl: true } },
          product: {
            include: {
              seller: { select: { id: true, username: true, avatarUrl: true } },
            },
          },
        },
      },
    },
  });

  if (!record) {
    res.json({
      valid: false,
      error: 'Invalid certificate. This ownership hash does not exist on DevChain.',
    });
    return;
  }

  res.json({
    valid: true,
    certificate: {
      ownershipHash: record.ownershipHash,
      issuedAt: record.issuedAt,
      isOnChain: record.isOnChain,
      blockchainTx: record.blockchainTx,
      blockchainStatus: record.isOnChain
        ? `Verified on Polygon — TX: ${record.blockchainTx}`
        : 'Simulated certificate — Polygon integration coming in Phase 2',
      owner: {
        id: record.order.buyer.id,
        username: record.order.buyer.username,
        avatarUrl: record.order.buyer.avatarUrl,
      },
      product: {
        id: record.order.product.id,
        title: record.order.product.title,
        category: record.order.product.category,
        price: record.order.amountPaid,
        seller: record.order.product.seller,
      },
      purchasedAt: record.order.createdAt,
    },
  });
});

// ────────────────────────────────────────────────
// GET MY PURCHASES
// ────────────────────────────────────────────────
const getMyPurchases = asyncHandler(async (req, res) => {
  const buyerId = req.user.userId;

  const orders = await prisma.order.findMany({
    where: { buyerId },
    include: {
      product: {
        include: {
          seller: { select: { id: true, username: true, avatarUrl: true } },
        },
      },
      ownershipRecord: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    purchases: orders.map((order) => ({
      id: order.id,
      product: {
        id: order.product.id,
        title: order.product.title,
        category: order.product.category,
        seller: order.product.seller,
      },
      amountPaid: order.amountPaid,
      purchasedAt: order.createdAt,
      certificate: {
        ownershipHash: order.ownershipHash,
        isOnChain: order.ownershipRecord?.isOnChain || false,
        verifyUrl: `/api/v1/ownership/verify/${order.ownershipHash}`,
      },
    })),
  });
});

// ────────────────────────────────────────────────
// GET MY SALES
// ────────────────────────────────────────────────
const getMySales = asyncHandler(async (req, res) => {
  const sellerId = req.user.userId;

  const orders = await prisma.order.findMany({
    where: { product: { sellerId } },
    include: {
      product: { select: { id: true, title: true, category: true } },
      buyer: { select: { id: true, username: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalRevenue = orders.reduce((sum, o) => sum + (o.amountPaid || 0), 0);

  res.json({
    totalSales: orders.length,
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    sales: orders.map((order) => ({
      id: order.id,
      product: order.product,
      buyer: order.buyer,
      amountPaid: order.amountPaid,
      ownershipHash: order.ownershipHash,
      soldAt: order.createdAt,
    })),
  });
});

module.exports = {
  purchaseProduct,
  verifyCertificate,
  getMyPurchases,
  getMySales,
};
