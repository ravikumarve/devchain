const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// ── Generate unique ownership hash ──
const generateOwnershipHash = (buyerId, productId, timestamp) => {
  const data = `${buyerId}:${productId}:${timestamp}:${process.env.OWNERSHIP_HASH_SECRET}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};

// ────────────────────────────────────────────────
// PURCHASE PRODUCT + GENERATE OWNERSHIP CERTIFICATE
// ────────────────────────────────────────────────
const purchaseProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const buyerId = req.user.userId;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required.' });
    }

    // ── Check product exists ──
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        seller: {
          select: { id: true, username: true }
        }
      }
    });

    if (!product || !product.isActive || product.deletedAt) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // ── Can't buy your own product ──
    if (product.sellerId === buyerId) {
      return res.status(400).json({ error: "You can't purchase your own product." });
    }

    // ── Check if already purchased ──
    const existingOrder = await prisma.order.findFirst({
      where: { buyerId, productId }
    });

    if (existingOrder) {
      return res.status(409).json({
        error: 'You already own this product.',
        ownershipHash: existingOrder.ownershipHash,
        certificateUrl: `/api/v1/ownership/verify/${existingOrder.ownershipHash}`
      });
    }

    // ── Generate ownership hash ──
    const timestamp = Date.now().toString();
    const ownershipHash = generateOwnershipHash(buyerId, productId, timestamp);

    // ── Create order + ownership record in one transaction ──
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          buyerId,
          productId,
          amountPaid: product.price,
          paymentMethod: 'simulated',
          ownershipHash,
          status: 'completed',
        }
      });

      const ownershipRecord = await tx.ownershipRecord.create({
        data: {
          orderId: order.id,
          buyerId,
          productId,
          ownershipHash,
          isOnChain: false,
        }
      });

      // ── Increment download count ──
      await tx.product.update({
        where: { id: productId },
        data: { downloadsCount: { increment: 1 } }
      });

      return { order, ownershipRecord };
    });

    res.status(201).json({
      message: '🎉 Purchase successful! Your ownership certificate has been issued.',
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
        certificateUrl: `${process.env.APP_URL || 'http://localhost:5000'}/api/v1/ownership/verify/${ownershipHash}`,
        verifyUrl: `/api/v1/ownership/verify/${ownershipHash}`,
      }
    });

  } catch (err) {
    console.error('PurchaseProduct error:', err);
    res.status(500).json({ error: 'Purchase failed. Please try again.' });
  }
};

// ────────────────────────────────────────────────
// VERIFY OWNERSHIP CERTIFICATE (public)
// ────────────────────────────────────────────────
const verifyCertificate = async (req, res) => {
  try {
    const { hash } = req.params;

    const record = await prisma.ownershipRecord.findUnique({
      where: { ownershipHash: hash },
      include: {
        order: {
          include: {
            buyer: {
              select: { id: true, username: true, avatarUrl: true }
            },
            product: {
              include: {
                seller: {
                  select: { id: true, username: true, avatarUrl: true }
                }
              }
            }
          }
        }
      }
    });

    if (!record) {
      return res.status(404).json({
        valid: false,
        error: 'Invalid certificate. This ownership hash does not exist on DevChain.'
      });
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
      }
    });

  } catch (err) {
    console.error('VerifyCertificate error:', err);
    res.status(500).json({ error: 'Failed to verify certificate.' });
  }
};

// ────────────────────────────────────────────────
// GET MY PURCHASES
// ────────────────────────────────────────────────
const getMyPurchases = async (req, res) => {
  try {
    const buyerId = req.user.userId;

    const orders = await prisma.order.findMany({
      where: { buyerId },
      include: {
        product: {
          include: {
            seller: {
              select: { id: true, username: true, avatarUrl: true }
            }
          }
        },
        ownershipRecord: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      purchases: orders.map(order => ({
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
        }
      }))
    });

  } catch (err) {
    console.error('GetMyPurchases error:', err);
    res.status(500).json({ error: 'Failed to fetch purchases.' });
  }
};

// ────────────────────────────────────────────────
// GET MY SALES (seller view)
// ────────────────────────────────────────────────
const getMySales = async (req, res) => {
  try {
    const sellerId = req.user.userId;

    const orders = await prisma.order.findMany({
      where: {
        product: { sellerId }
      },
      include: {
        product: {
          select: { id: true, title: true, category: true }
        },
        buyer: {
          select: { id: true, username: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalRevenue = orders.reduce((sum, o) => sum + o.amountPaid, 0);

    res.json({
      totalSales: orders.length,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      sales: orders.map(order => ({
        id: order.id,
        product: order.product,
        buyer: order.buyer,
        amountPaid: order.amountPaid,
        ownershipHash: order.ownershipHash,
        soldAt: order.createdAt,
      }))
    });

  } catch (err) {
    console.error('GetMySales error:', err);
    res.status(500).json({ error: 'Failed to fetch sales.' });
  }
};

module.exports = {
  purchaseProduct,
  verifyCertificate,
  getMyPurchases,
  getMySales,
};
