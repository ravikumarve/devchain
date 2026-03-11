const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Store files locally in /uploads folder
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.zip', '.tar', '.gz', '.pdf', '.js', '.ts', '.json', '.md', '.txt', '.png', '.jpg', '.svg'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error(`File type ${ext} not allowed`), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Upload product file (seller only)
const uploadProductFile = async (req, res) => {
  try {
    const { productId } = req.params;
    const sellerId = req.user.userId;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.sellerId !== sellerId) return res.status(403).json({ error: 'Not your product' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const fileUrl = `/uploads/${req.file.filename}`;
    const originalName = req.file.originalname;
    const fileSize = req.file.size;

    await prisma.product.update({
      where: { id: productId },
      data: {
        fileUrl,
        previewUrl: product.previewUrl || null,
      },
    });

    res.json({
      success: true,
      fileUrl,
      originalName,
      fileSize,
      message: 'File uploaded successfully',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
};

// Download product file (buyers + seller only)
const downloadProductFile = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.userId;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { seller: { select: { id: true } } },
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (!product.fileUrl) return res.status(404).json({ error: 'No file uploaded for this product' });

    // Check access: seller OR buyer with completed order
    const isSeller = product.seller.id === userId;
    if (!isSeller) {
      const order = await prisma.order.findFirst({
        where: { productId, buyerId: userId, status: 'completed' },
      });
      if (!order) return res.status(403).json({ error: 'Purchase this product to download' });
    }

    const filePath = path.join(__dirname, '../../', product.fileUrl);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on server' });

    // Increment download count
    await prisma.product.update({
      where: { id: productId },
      data: { downloadsCount: { increment: 1 } },
    });

    res.download(filePath);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Download failed' });
  }
};

// Get file info for a product
const getFileInfo = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.userId;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, fileUrl: true, sellerId: true, title: true },
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const isSeller = product.sellerId === userId;
    const order = isSeller ? null : await prisma.order.findFirst({
      where: { productId, buyerId: userId, status: 'completed' },
    });

    const hasAccess = isSeller || !!order;
    const hasFile = !!product.fileUrl;

    let fileSize = null;
    let fileName = null;
    if (hasFile && hasAccess) {
      const filePath = path.join(__dirname, '../../', product.fileUrl);
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        fileSize = stat.size;
        fileName = path.basename(filePath);
      }
    }

    res.json({ hasFile, hasAccess, isSeller, fileSize, fileName });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get file info' });
  }
};

module.exports = { upload, uploadProductFile, downloadProductFile, getFileInfo };
