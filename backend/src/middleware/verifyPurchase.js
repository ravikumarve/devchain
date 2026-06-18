const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Middleware to verify that a user has purchased a product before allowing file download
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyPurchase = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.user?.id;

    // If no user is authenticated, deny access
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required. Please login to download files.',
      });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if user is the seller (they can download their own files)
    if (product.sellerId === userId) {
      req.isSeller = true;
      return next();
    }

    // Check if user has purchased this product
    const order = await prisma.order.findFirst({
      where: {
        buyerId: userId,
        productId,
        status: 'completed',
      },
      include: {
        ownershipRecord: true,
      },
    });

    if (!order) {
      return res.status(403).json({
        error: 'Purchase required. You need to buy this product to download files.',
        productId,
        purchaseUrl: `/product/${productId}`,
      });
    }

    // Attach purchase info to request
    req.purchaseInfo = {
      orderId: order.id,
      ownershipHash: order.ownershipRecord?.ownershipHash,
      purchasedAt: order.createdAt,
    };

    next();
  } catch (err) {
    console.error('VerifyPurchase error:', err);
    res.status(500).json({ error: 'Failed to verify purchase' });
  }
};

module.exports = { verifyPurchase };
