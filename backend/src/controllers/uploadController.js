const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const prisma = require('../config/database');
const storage = require('../services/storageService');
const { getLogger } = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} = require('../utils/errors');

const log = getLogger('uploads');

const BUCKET = storage.BUCKET || 'devchain-files';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// ── Allowed MIME types and extensions ──
const ALLOWED_EXTENSIONS = new Set([
  '.zip', '.tar', '.gz', '.tgz',
  '.pdf', '.js', '.ts', '.tsx', '.jsx',
  '.json', '.md', '.txt', '.yaml', '.yml',
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp',
  '.css', '.scss', '.html',
  '.py', '.rb', '.go', '.rs', '.java', '.cpp', '.h',
  '.sh', '.bash', '.zsh',
  '.sql', '.graphql',
  '.env.example', '.gitignore',
  '.toml', '.cfg', '.ini',
]);

// ── Multer with memory storage ──
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error(`File type "${ext}" is not allowed. Allowed: ${[...ALLOWED_EXTENSIONS].join(', ')}`));
    }

    // Sanitize filename — remove path traversal and special chars
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    if (sanitized.length > 255) {
      return cb(new Error('Filename is too long. Maximum 255 characters.'));
    }

    file.originalname = sanitized;
    cb(null, true);
  },
});

// ────────────────────────────────────────────────
// UPLOAD PRODUCT FILE
// ────────────────────────────────────────────────
const uploadProductFile = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const sellerId = req.user.userId;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new NotFoundError('Product not found');
  if (product.sellerId !== sellerId) throw new ForbiddenError('You can only upload files to your own products');
  if (!req.file) throw new BadRequestError('No file uploaded');

  const ext = path.extname(req.file.originalname);
  const storagePath = `products/${productId}/${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;

  // Remove old file if exists
  if (product.fileKey) {
    const oldPath = product.fileKey.replace(`${BUCKET}/`, '');
    const { error: removeError } = await storage.remove(oldPath);
    if (removeError) {
      log.warn({ error: removeError }, 'Failed to remove old file');
    }
  }

  // Upload to active storage provider (local disk or Supabase)
  const { error: uploadError } = await storage.upload(
    req.file.buffer,
    storagePath,
    req.file.mimetype || 'application/octet-stream'
  );

  if (uploadError) {
    log.error({ error: uploadError }, 'File upload failed');
    throw new Error('File upload to storage failed');
  }

  const fileUrl = `${BUCKET}/${storagePath}`;

  await prisma.product.update({
    where: { id: productId },
    data: { fileKey: fileUrl },
  });

  log.info({ productId, fileSize: req.file.size, storagePath }, 'File uploaded');

  res.json({
    success: true,
    fileUrl,
    originalName: req.file.originalname,
    fileSize: req.file.size,
    message: `File uploaded to ${storage.provider} storage`,
  });
});

// ────────────────────────────────────────────────
// DOWNLOAD PRODUCT FILE
// ────────────────────────────────────────────────
const downloadProductFile = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.userId;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { seller: { select: { id: true } } },
  });

  if (!product) throw new NotFoundError('Product not found');
  if (!product.fileKey) throw new NotFoundError('No file uploaded for this product');

  // Check access: seller or buyer with completed order
  const isSeller = product.seller.id === userId;
  if (!isSeller) {
    const order = await prisma.order.findFirst({
      where: { productId, buyerId: userId, status: 'completed' },
    });
    if (!order) {
      throw new ForbiddenError('Purchase this product to download files.');
    }
  }

  // Generate a download link (Supabase signed URL or local marker)
  const storagePath = product.fileKey.replace(`${BUCKET}/`, '');
  const { data, error } = await storage.getSignedUrl(storagePath, 60);

  if (error) {
    log.error({ error }, 'Failed to generate download link');
    throw new Error('Failed to generate download link');
  }

  // Increment download count
  await prisma.product.update({
    where: { id: productId },
    data: { downloadsCount: { increment: 1 } },
  }).catch(err => log.warn({ err }, 'Failed to increment download count'));

  log.info({ productId, userId, isSeller }, 'File downloaded');

  // Local mode: stream the file directly (ownership already verified above)
  if (data.signedUrl.startsWith('local://')) {
    return storage.downloadStream(storagePath, res);
  }

  // Cloud mode: redirect to the signed Supabase URL
  res.redirect(data.signedUrl);
});

// ────────────────────────────────────────────────
// GET FILE INFO
// ────────────────────────────────────────────────
const getFileInfo = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.userId;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, fileKey: true, sellerId: true, title: true },
  });

  if (!product) throw new NotFoundError('Product not found');

  const isSeller = product.sellerId === userId;
  const order = isSeller
    ? null
    : await prisma.order.findFirst({
        where: { productId, buyerId: userId, status: 'completed' },
      });

  const hasAccess = isSeller || !!order;
  const hasFile = !!product.fileKey;

  let fileSize = null;
  let fileName = null;

  if (hasFile) {
    const storagePath = product.fileKey.replace(`${BUCKET}/`, '');
    fileName = path.basename(storagePath);

    const parts = storagePath.split('/');
    const folder = parts.slice(0, -1).join('/');
    const { data: files } = await storage.list(folder);
    if (files) {
      const f = files.find(f => f.name === parts[parts.length - 1]);
      if (f) fileSize = f.metadata?.size || null;
    }
  }

  res.json({ hasFile, hasAccess, isSeller, fileSize, fileName });
});

module.exports = { upload, uploadProductFile, downloadProductFile, getFileInfo };
