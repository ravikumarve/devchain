const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const prisma = new PrismaClient();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const BUCKET = 'devchain-files';

// Use memory storage — file goes straight to Supabase
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.zip', '.tar', '.gz', '.pdf', '.js', '.ts', '.json', '.md', '.txt', '.png', '.jpg', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error(`File type ${ext} not allowed`), false);
  },
});

const uploadProductFile = async (req, res) => {
  try {
    const { productId } = req.params;
    const sellerId = req.user.userId;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.sellerId !== sellerId) return res.status(403).json({ error: 'Not your product' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const ext = path.extname(req.file.originalname);
    const storagePath = `products/${productId}/${Date.now()}${ext}`;

    // Delete old file if exists
    if (product.fileUrl) {
      const oldPath = product.fileUrl.replace(`${BUCKET}/`, '');
      await supabase.storage.from(BUCKET).remove([oldPath]);
    }

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const fileUrl = `${BUCKET}/${storagePath}`;

    await prisma.product.update({
      where: { id: productId },
      data: { fileUrl },
    });

    res.json({
      success: true,
      fileUrl,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      message: 'File uploaded to Supabase Storage',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
};

const downloadProductFile = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.userId;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { seller: { select: { id: true } } },
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (!product.fileUrl) return res.status(404).json({ error: 'No file uploaded' });

    const isSeller = product.seller.id === userId;
    if (!isSeller) {
      const order = await prisma.order.findFirst({
        where: { productId, buyerId: userId, status: 'completed' },
      });
      if (!order) return res.status(403).json({ error: 'Purchase this product to download' });
    }

    // Generate signed URL (valid 60 seconds)
    const storagePath = product.fileUrl.replace(`${BUCKET}/`, '');
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 60);

    if (error) throw error;

    // Increment downloads
    await prisma.product.update({
      where: { id: productId },
      data: { downloadsCount: { increment: 1 } },
    });

    // Redirect to signed URL
    res.redirect(data.signedUrl);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Download failed' });
  }
};

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

    if (hasFile) {
      const storagePath = product.fileUrl.replace(`${BUCKET}/`, '');
      fileName = path.basename(storagePath);
      // Get file metadata from Supabase
      const parts = storagePath.split('/');
      const folder = parts.slice(0, -1).join('/');
      const { data: files } = await supabase.storage.from(BUCKET).list(folder);
      if (files) {
        const f = files.find(f => f.name === parts[parts.length - 1]);
        if (f) fileSize = f.metadata?.size || null;
      }
    }

    res.json({ hasFile, hasAccess, isSeller, fileSize, fileName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get file info' });
  }
};

module.exports = { upload, uploadProductFile, downloadProductFile, getFileInfo };
