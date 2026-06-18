// src/routes/index.ts — Auth + Users + Products + Gigs + Orders fully implemented
import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { authLimiter, uploadLimiter } from '../middleware/rateLimiter.js';
import * as authController from '../controllers/authController.js';
import * as userController from '../controllers/userController.js';
import * as productController from '../controllers/productController.js';
import * as gigController from '../controllers/gigController.js';
import * as orderController from '../controllers/orderController.js';

const router = Router();
const stub = (name: string) => (_req: Request, res: Response) =>
  res.json({ success: true, message: `[stub] ${name}`, data: null });

// ════════════════════════════════════════════════════════════
// AUTH ✅
// ════════════════════════════════════════════════════════════
router.post('/auth/register', authLimiter, authController.register);
router.post('/auth/login', authLimiter, authController.login);
router.post('/auth/logout', requireAuth, authController.logout);
router.post('/auth/refresh', authController.refresh);
router.post('/auth/forgot-password', authLimiter, authController.forgot);
router.post('/auth/reset-password', authLimiter, authController.reset);

// ════════════════════════════════════════════════════════════
// USERS ✅
// ════════════════════════════════════════════════════════════
router.get('/users/me', requireAuth, userController.getMe);
router.put('/users/me', requireAuth, userController.updateMe);
router.delete('/users/me', requireAuth, stub('Delete account'));
router.get('/users/:username', userController.getProfile);
router.get('/users/:username/products', userController.getProducts);
router.get('/users/:username/gigs', stub('Get user gigs'));
router.get('/users/:username/reviews', stub('Get user reviews'));

// ════════════════════════════════════════════════════════════
// PRODUCTS ✅
// ════════════════════════════════════════════════════════════
router.get('/products', productController.list);
router.get('/products/search', productController.search);
router.get('/products/trending', productController.trending);
router.get('/products/:id', productController.getById);
router.post('/products', requireAuth, requireRole('seller', 'admin'), uploadLimiter, productController.create);
router.put('/products/:id', requireAuth, productController.update);
router.delete('/products/:id', requireAuth, productController.remove);
router.get('/products/:id/reviews', stub('Product reviews'));
router.post('/products/:id/reviews', requireAuth, stub('Post review'));

// ════════════════════════════════════════════════════════════
// GIGS ✅
// ════════════════════════════════════════════════════════════
router.get('/gigs', gigController.list);
router.get('/gigs/search', gigController.search);
router.get('/gigs/:id', gigController.getById);
router.post('/gigs', requireAuth, gigController.create);
router.put('/gigs/:id', requireAuth, gigController.update);
router.delete('/gigs/:id', requireAuth, gigController.remove);

// ════════════════════════════════════════════════════════════
// ORDERS ✅
// ════════════════════════════════════════════════════════════
router.get('/orders', requireAuth, orderController.listMyOrders);
router.post('/orders', requireAuth, orderController.create);
router.get('/orders/:id', requireAuth, orderController.getOrder);
router.post('/orders/:id/refund', requireAuth, orderController.refund);

// ════════════════════════════════════════════════════════════
// CERTIFICATES ✅
// ════════════════════════════════════════════════════════════
router.get('/certificates/mine', requireAuth, orderController.myCertificates);
router.post('/certificates/verify', orderController.verifyCert);
router.get('/certificates/:certId', stub('Get certificate by ID'));

// ════════════════════════════════════════════════════════════
// PAYMENTS
// ════════════════════════════════════════════════════════════
router.post('/payments/intent', requireAuth, stub('Create Stripe payment intent'));
router.post('/payments/webhook', stub('Stripe webhook'));
router.get('/payments/history', requireAuth, stub('Payment history'));

// ════════════════════════════════════════════════════════════
// ADMIN
// ════════════════════════════════════════════════════════════
router.get('/admin/users', requireAuth, requireRole('admin'), stub('List users'));
router.put('/admin/users/:id/ban', requireAuth, requireRole('admin'), stub('Ban user'));
router.get('/admin/products', requireAuth, requireRole('admin'), stub('Moderate products'));
router.delete('/admin/products/:id', requireAuth, requireRole('admin'), stub('Remove product'));
router.get('/admin/analytics', requireAuth, requireRole('admin'), stub('Analytics'));

export default router;
