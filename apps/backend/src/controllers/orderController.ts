// src/controllers/orderController.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import {
  createOrder, getMyOrders, getOrderById,
  requestRefund, getMyCertificates, verifyCertificate,
} from '../services/orderService.js';

const createOrderSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function create(req: Request, res: Response): Promise<void> {
  const { productId } = createOrderSchema.parse(req.body);
  const result = await createOrder({ buyerId: req.user!.userId, productId });

  res.status(201).json({
    success: true,
    message: 'Purchase successful! Your ownership certificate has been issued.',
    data: result,
  });
}

export async function listMyOrders(req: Request, res: Response): Promise<void> {
  const { page, limit } = paginationSchema.parse(req.query);
  const result = await getMyOrders(req.user!.userId, page, limit);
  res.json({ success: true, data: result });
}

export async function getOrder(req: Request, res: Response): Promise<void> {
  const result = await getOrderById(req.params.id, req.user!.userId);
  res.json({ success: true, data: result });
}

export async function refund(req: Request, res: Response): Promise<void> {
  const result = await requestRefund(req.params.id, req.user!.userId);
  res.json({ success: true, message: 'Refund processed successfully', data: result });
}

export async function myCertificates(req: Request, res: Response): Promise<void> {
  const result = await getMyCertificates(req.user!.userId);
  res.json({ success: true, data: result });
}

export async function verifyCert(req: Request, res: Response): Promise<void> {
  const { certId } = z.object({ certId: z.string().min(1) }).parse(req.body);
  const result = await verifyCertificate(certId);
  res.json({ success: true, data: result });
}
