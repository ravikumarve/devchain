// src/controllers/productController.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import {
  listProducts,
  searchProducts,
  getTrendingProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../services/productService.js';

// ─── Validation schemas ───────────────────────────────────────

const createSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(20),
  shortDescription: z.string().max(160).optional(),
  price: z.number().int().min(0),   // cents — 0 = free
  currency: z.enum(['USD', 'INR']).default('USD'),
  category: z.enum(['template','tool','library','script','component','api','other']),
  tags: z.array(z.string()).max(10).default([]),
  techStack: z.array(z.string()).max(15).default([]),
  thumbnailUrl: z.string().url().optional(),
  previewUrl: z.string().url().optional(),
  version: z.string().default('1.0.0'),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
});

const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  category: z.enum(['template','tool','library','script','component','api','other']).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  tags: z.string().transform(t => t.split(',')).optional(),
  sortBy: z.enum(['newest','price_asc','price_desc','rating','popular']).default('newest'),
  sellerId: z.string().uuid().optional(),
});

// ─── Controllers ──────────────────────────────────────────────

export async function list(req: Request, res: Response): Promise<void> {
  const filters = listSchema.parse(req.query);
  const result = await listProducts(filters);
  res.json({ success: true, data: result });
}

export async function search(req: Request, res: Response): Promise<void> {
  const q = z.string().min(2).parse(req.query.q);
  const page = z.coerce.number().default(1).parse(req.query.page);
  const limit = z.coerce.number().default(20).parse(req.query.limit);
  const result = await searchProducts(q, page, limit);
  res.json({ success: true, data: result });
}

export async function trending(req: Request, res: Response): Promise<void> {
  const limit = z.coerce.number().default(10).parse(req.query.limit);
  const result = await getTrendingProducts(limit);
  res.json({ success: true, data: result });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const result = await getProductById(req.params.id);
  res.json({ success: true, data: result });
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = createSchema.parse(req.body);
  const result = await createProduct({ ...input, sellerId: req.user!.userId });
  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: result,
  });
}

export async function update(req: Request, res: Response): Promise<void> {
  const input = createSchema.partial().parse(req.body);
  const result = await updateProduct(req.params.id, req.user!.userId, input);
  res.json({ success: true, message: 'Product updated', data: result });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await deleteProduct(req.params.id, req.user!.userId);
  res.json({ success: true, message: 'Product removed' });
}
