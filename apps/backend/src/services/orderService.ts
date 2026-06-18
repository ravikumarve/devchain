// src/services/orderService.ts
// ─────────────────────────────────────────────────────────────
// Order business logic.
// Payment is simulated for now — Stripe drops in at Step 11.
// On completion: order saved + certificate issued automatically.
// ─────────────────────────────────────────────────────────────
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/supabase.js';
import { cacheDel } from '../config/redis.js';
import { AppError } from '../middleware/errorHandler.js';

// ─── Types ────────────────────────────────────────────────────

export interface CreateOrderInput {
  buyerId: string;
  productId: string;
  paymentMethod?: string;
}

// ─── Generate certificate ID ──────────────────────────────────

function generateCertId(): string {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `DC-${year}-${rand}`;
}

// ─── Simulate payment ─────────────────────────────────────────
// Returns a fake payment intent ID.
// Replace with Stripe.paymentIntents.create() later.

function simulatePayment(amount: number): {
  paymentIntentId: string;
  status: 'completed';
} {
  return {
    paymentIntentId: `pi_simulated_${uuidv4().replace(/-/g, '').substring(0, 24)}`,
    status: 'completed',
  };
}

// ─── CREATE ORDER ─────────────────────────────────────────────

export async function createOrder(input: CreateOrderInput) {
  const { buyerId, productId } = input;

  // 1. Get product details
  const { data: product, error: productError } = await supabaseAdmin
    .from('products')
    .select('id, title, price, currency, seller_id, is_active, blockchain_cert_id')
    .eq('id', productId)
    .single();

  if (productError || !product) throw new AppError(404, 'Product not found');
  if (!product.is_active) throw new AppError(400, 'Product is no longer available');
  if (product.seller_id === buyerId) throw new AppError(400, 'You cannot buy your own product');

  // 2. Check not already purchased
  const { data: existingOrder } = await supabaseAdmin
    .from('order_items')
    .select('id')
    .eq('product_id', productId)
    .eq('seller_id', product.seller_id)
    .limit(1);

  // Check if buyer already owns this
  const { data: alreadyOwned } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('buyer_id', buyerId)
    .eq('status', 'completed')
    .limit(1);

  if (alreadyOwned && alreadyOwned.length > 0) {
    // Check specifically for this product
    const { data: ownedItem } = await supabaseAdmin
      .from('order_items')
      .select('orders!inner(buyer_id, status)')
      .eq('product_id', productId)
      .limit(1);
    // Simple check — if cert exists for this buyer+product
    const { data: existingCert } = await supabaseAdmin
      .from('certificates')
      .select('id')
      .eq('owner_id', buyerId)
      .eq('product_id', productId)
      .single();

    if (existingCert) throw new AppError(409, 'You already own this product');
  }

  // 3. Simulate payment processing
  const payment = simulatePayment(product.price);

  // 4. Create order
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      buyer_id: buyerId,
      amount: product.price,
      currency: product.currency,
      status: 'completed',           // Simulated — always succeeds
      payment_intent_id: payment.paymentIntentId,
      payment_method: 'simulated',
      blockchain_tx_id: `tx_${uuidv4().replace(/-/g, '').substring(0, 16)}`,
    })
    .select()
    .single();

  if (orderError || !order) throw new AppError(500, 'Failed to create order');

  // 5. Create order item
  const { error: itemError } = await supabaseAdmin
    .from('order_items')
    .insert({
      order_id: order.id,
      product_id: productId,
      seller_id: product.seller_id,
      price: product.price,
      currency: product.currency,
    });

  if (itemError) {
    // Rollback order
    await supabaseAdmin.from('orders').delete().eq('id', order.id);
    throw new AppError(500, 'Failed to create order item');
  }

  // 6. Issue blockchain certificate automatically
  const certId = generateCertId();
  const { data: certificate, error: certError } = await supabaseAdmin
    .from('certificates')
    .insert({
      cert_id: certId,
      owner_id: buyerId,
      product_id: productId,
      order_id: order.id,
      chain: 'simulated',
      tx_hash: order.blockchain_tx_id,
      metadata: {
        product_title: product.title,
        product_price: product.price,
        currency: product.currency,
        purchased_at: new Date().toISOString(),
        payment_method: 'simulated',
      },
      is_valid: true,
    })
    .select()
    .single();

  if (certError) {
    console.error('[orderService] Failed to issue certificate:', certError);
    // Don't fail the order — cert can be reissued
  }

  // 7. Update seller stats
  await supabaseAdmin.rpc('increment_seller_stats', {
    p_seller_id: product.seller_id,
    p_amount: product.price,
  }).then(() => {}).catch(() => {}); // fire and forget

  // 8. Update product download count
  await supabaseAdmin
    .from('products')
    .update({ download_count: product.price }) // will fix with RPC
    .eq('id', productId)
    .then(() => {}).catch(() => {});

  // Increment download count properly
  const { data: currentProduct } = await supabaseAdmin
    .from('products')
    .select('download_count')
    .eq('id', productId)
    .single();

  if (currentProduct) {
    await supabaseAdmin
      .from('products')
      .update({ download_count: (currentProduct.download_count || 0) + 1 })
      .eq('id', productId);
  }

  // 9. Invalidate product cache
  await cacheDel(`products:${productId}`);

  return {
    order: {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      createdAt: order.created_at,
    },
    certificate: certificate ? {
      certId: certificate.cert_id,
      txHash: certificate.tx_hash,
      chain: certificate.chain,
      issuedAt: certificate.issued_at,
      metadata: certificate.metadata,
    } : null,
    product: {
      id: product.id,
      title: product.title,
    },
  };
}

// ─── LIST MY ORDERS ───────────────────────────────────────────

export async function getMyOrders(buyerId: string, page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const { data, count, error } = await supabaseAdmin
    .from('orders')
    .select(`
      id, amount, currency, status, created_at,
      order_items(
        product_id,
        price,
        product:products(id, title, slug, thumbnail_url, category)
      )
    `, { count: 'exact' })
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new AppError(500, 'Failed to fetch orders');

  return {
    items: data || [],
    total: count || 0,
    page,
    limit,
    hasMore: (count || 0) > offset + limit,
  };
}

// ─── GET ORDER BY ID ──────────────────────────────────────────

export async function getOrderById(orderId: string, buyerId: string) {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(`
      *,
      order_items(
        *,
        product:products(id, title, slug, thumbnail_url, category, description)
      )
    `)
    .eq('id', orderId)
    .eq('buyer_id', buyerId)
    .single();

  if (error || !data) throw new AppError(404, 'Order not found');

  // Also get certificate
  const { data: cert } = await supabaseAdmin
    .from('certificates')
    .select('*')
    .eq('order_id', orderId)
    .single();

  return { ...data, certificate: cert || null };
}

// ─── REQUEST REFUND ───────────────────────────────────────────

export async function requestRefund(orderId: string, buyerId: string) {
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('id, status, created_at, amount')
    .eq('id', orderId)
    .eq('buyer_id', buyerId)
    .single();

  if (error || !order) throw new AppError(404, 'Order not found');
  if (order.status !== 'completed') throw new AppError(400, 'Only completed orders can be refunded');

  // 7-day refund window
  const orderDate = new Date(order.created_at);
  const daysSincePurchase = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSincePurchase > 7) {
    throw new AppError(400, 'Refund window has expired (7 days)');
  }

  const { error: updateError } = await supabaseAdmin
    .from('orders')
    .update({ status: 'refunded' })
    .eq('id', orderId);

  if (updateError) throw new AppError(500, 'Failed to process refund');

  // Invalidate certificate
  await supabaseAdmin
    .from('certificates')
    .update({ is_valid: false })
    .eq('order_id', orderId);

  return { refunded: true, amount: order.amount };
}

// ─── GET MY CERTIFICATES ──────────────────────────────────────

export async function getMyCertificates(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('certificates')
    .select(`
      cert_id, chain, tx_hash, is_valid, issued_at, metadata,
      product:products(id, title, slug, category, thumbnail_url)
    `)
    .eq('owner_id', userId)
    .eq('is_valid', true)
    .order('issued_at', { ascending: false });

  if (error) throw new AppError(500, 'Failed to fetch certificates');
  return data || [];
}

// ─── VERIFY CERTIFICATE ───────────────────────────────────────

export async function verifyCertificate(certId: string) {
  const { data, error } = await supabaseAdmin
    .from('certificates')
    .select(`
      cert_id, chain, tx_hash, is_valid, issued_at, metadata,
      owner:users(username, display_name),
      product:products(id, title, slug, category)
    `)
    .eq('cert_id', certId)
    .single();

  if (error || !data) throw new AppError(404, 'Certificate not found');
  return data;
}
