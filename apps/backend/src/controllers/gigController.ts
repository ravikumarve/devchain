// src/controllers/gigController.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { listGigs, searchGigs, getGigById, createGig, updateGig, deleteGig } from '../services/gigService.js';

const createSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(20),
  priceFrom: z.number().int().min(1),
  priceTo: z.number().int().optional(),
  currency: z.enum(['USD', 'INR']).default('USD'),
  deliveryDays: z.number().int().min(1).max(365),
  category: z.enum(['frontend','backend','mobile','devops','blockchain','ai_ml','design','other']),
  tags: z.array(z.string()).max(10).default([]),
  skills: z.array(z.string()).max(15).default([]),
  thumbnailUrl: z.string().url().optional(),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
});

const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  category: z.string().optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  sortBy: z.enum(['newest','price_asc','price_desc','rating','popular']).default('newest'),
  freelancerId: z.string().uuid().optional(),
});

export async function list(req: Request, res: Response): Promise<void> {
  const filters = listSchema.parse(req.query);
  const result = await listGigs(filters);
  res.json({ success: true, data: result });
}

export async function search(req: Request, res: Response): Promise<void> {
  const q = z.string().min(2).parse(req.query.q);
  const page = z.coerce.number().default(1).parse(req.query.page);
  const result = await searchGigs(q, page);
  res.json({ success: true, data: result });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const result = await getGigById(req.params.id);
  res.json({ success: true, data: result });
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = createSchema.parse(req.body);
  const result = await createGig({ ...input, freelancerId: req.user!.userId });
  res.status(201).json({ success: true, message: 'Gig created successfully', data: result });
}

export async function update(req: Request, res: Response): Promise<void> {
  const input = createSchema.partial().parse(req.body);
  const result = await updateGig(req.params.id, req.user!.userId, input);
  res.json({ success: true, message: 'Gig updated', data: result });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await deleteGig(req.params.id, req.user!.userId);
  res.json({ success: true, message: 'Gig removed' });
}
