// src/controllers/userController.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { getMyProfile, updateMyProfile, getPublicProfile, getUserProducts } from '../services/userService.js';

const updateSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
  twitterUrl: z.string().url().optional().or(z.literal('')),
  avatarUrl: z.string().url().optional(),
});

export async function getMe(req: Request, res: Response): Promise<void> {
  const result = await getMyProfile(req.user!.userId);
  res.json({ success: true, data: result });
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const input = updateSchema.parse(req.body);
  const result = await updateMyProfile(req.user!.userId, input);
  res.json({ success: true, message: 'Profile updated', data: result });
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  const result = await getPublicProfile(req.params.username);
  res.json({ success: true, data: result });
}

export async function getProducts(req: Request, res: Response): Promise<void> {
  const page = z.coerce.number().default(1).parse(req.query.page);
  const limit = z.coerce.number().default(20).parse(req.query.limit);
  const result = await getUserProducts(req.params.username, page, limit);
  res.json({ success: true, data: result });
}
