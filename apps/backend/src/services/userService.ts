// src/services/userService.ts
import { supabaseAdmin } from '../config/supabase.js';
import { cacheGet, cacheSet, cacheDel } from '../config/redis.js';
import { AppError } from '../middleware/errorHandler.js';

// ─── GET MY PROFILE (with real stats) ────────────────────────

export async function getMyProfile(userId: string) {
  const cacheKey = `user:profile:${userId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, username, display_name, email, avatar_url, bio, website_url, github_url, twitter_url, role, is_verified, rating, review_count, created_at')
    .eq('id', userId)
    .single();

  if (error || !user) throw new AppError(404, 'User not found');

  // Get real stats
  const [productsRes, salesRes, purchasesRes, certsRes] = await Promise.all([
    supabaseAdmin.from('products').select('id', { count: 'exact' }).eq('seller_id', userId).eq('is_active', true),
    supabaseAdmin.from('order_items').select('id', { count: 'exact' }).eq('seller_id', userId),
    supabaseAdmin.from('orders').select('id', { count: 'exact' }).eq('buyer_id', userId).eq('status', 'completed'),
    supabaseAdmin.from('certificates').select('id', { count: 'exact' }).eq('owner_id', userId).eq('is_valid', true),
  ]);

  const result = {
    ...user,
    stats: {
      products: productsRes.count || 0,
      sales: salesRes.count || 0,
      purchases: purchasesRes.count || 0,
      certificates: certsRes.count || 0,
    },
  };

  await cacheSet(cacheKey, result, 300);
  return result;
}

// ─── UPDATE MY PROFILE ────────────────────────────────────────

export interface UpdateProfileInput {
  displayName?: string;
  bio?: string;
  websiteUrl?: string;
  githubUrl?: string;
  twitterUrl?: string;
  avatarUrl?: string;
}

export async function updateMyProfile(userId: string, input: UpdateProfileInput) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({
      ...(input.displayName && { display_name: input.displayName }),
      ...(input.bio !== undefined && { bio: input.bio }),
      ...(input.websiteUrl !== undefined && { website_url: input.websiteUrl }),
      ...(input.githubUrl !== undefined && { github_url: input.githubUrl }),
      ...(input.twitterUrl !== undefined && { twitter_url: input.twitterUrl }),
      ...(input.avatarUrl !== undefined && { avatar_url: input.avatarUrl }),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw new AppError(500, 'Failed to update profile');
  await cacheDel(`user:profile:${userId}`);
  return data;
}

// ─── GET PUBLIC PROFILE ───────────────────────────────────────

export async function getPublicProfile(username: string) {
  const cacheKey = `user:public:${username}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, username, display_name, avatar_url, bio, website_url, github_url, twitter_url, role, is_verified, rating, review_count, created_at')
    .eq('username', username.toLowerCase())
    .eq('is_banned', false)
    .single();

  if (error || !user) throw new AppError(404, 'User not found');

  const [productsRes, salesRes] = await Promise.all([
    supabaseAdmin.from('products').select('id', { count: 'exact' }).eq('seller_id', user.id).eq('is_active', true),
    supabaseAdmin.from('order_items').select('id', { count: 'exact' }).eq('seller_id', user.id),
  ]);

  const result = {
    ...user,
    stats: {
      products: productsRes.count || 0,
      sales: salesRes.count || 0,
    },
  };

  await cacheSet(cacheKey, result, 600);
  return result;
}

// ─── GET USER'S PRODUCTS ──────────────────────────────────────

export async function getUserProducts(username: string, page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  // Get user ID first
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('username', username.toLowerCase())
    .single();

  if (!user) throw new AppError(404, 'User not found');

  const { data, count, error } = await supabaseAdmin
    .from('products')
    .select('id, title, slug, short_description, price, currency, category, tags, thumbnail_url, rating, download_count, created_at', { count: 'exact' })
    .eq('seller_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new AppError(500, 'Failed to fetch products');
  return { items: data || [], total: count || 0, page, limit, hasMore: (count || 0) > offset + limit };
}
