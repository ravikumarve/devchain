// src/services/productService.ts
import { supabaseAdmin } from '../config/supabase.js';
import { cacheGet, cacheSet, cacheDel } from '../config/redis.js';
import { AppError } from '../middleware/errorHandler.js';

// ─── Types ────────────────────────────────────────────────────

export interface CreateProductInput {
  sellerId: string;
  title: string;
  description: string;
  shortDescription?: string;
  price: number;        // in cents
  currency: 'USD' | 'INR';
  category: string;
  tags: string[];
  techStack: string[];
  thumbnailUrl?: string;
  previewUrl?: string;
  version?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface ListProductsInput {
  page?: number;
  limit?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular';
  sellerId?: string;
}

// ─── Slug generator ───────────────────────────────────────────

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim() + '-' + Date.now().toString(36);
}

// ─── LIST PRODUCTS ────────────────────────────────────────────

export async function listProducts(input: ListProductsInput) {
  const {
    page = 1,
    limit = 20,
    category,
    minPrice,
    maxPrice,
    tags,
    sortBy = 'newest',
    sellerId,
  } = input;

  const offset = (page - 1) * limit;
  const cacheKey = `products:list:${JSON.stringify(input)}`;

  // Try cache first (5 min TTL)
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  let query = supabaseAdmin
    .from('products')
    .select(`
      id, title, slug, short_description, price, currency,
      category, tags, thumbnail_url, preview_url, tech_stack,
      download_count, rating, review_count, is_featured,
      created_at, version,
      seller:users(id, username, display_name, avatar_url, is_verified)
    `, { count: 'exact' })
    .eq('is_active', true);

  // Filters
  if (category) query = query.eq('category', category);
  if (minPrice !== undefined) query = query.gte('price', minPrice);
  if (maxPrice !== undefined) query = query.lte('price', maxPrice);
  if (sellerId) query = query.eq('seller_id', sellerId);
  if (tags && tags.length > 0) query = query.overlaps('tags', tags);

  // Sorting
  switch (sortBy) {
    case 'price_asc': query = query.order('price', { ascending: true }); break;
    case 'price_desc': query = query.order('price', { ascending: false }); break;
    case 'rating': query = query.order('rating', { ascending: false }); break;
    case 'popular': query = query.order('download_count', { ascending: false }); break;
    default: query = query.order('created_at', { ascending: false });
  }

  const { data, count, error } = await query.range(offset, offset + limit - 1);

  if (error) throw new AppError(500, 'Failed to fetch products');

  const result = {
    items: data || [],
    total: count || 0,
    page,
    limit,
    hasMore: (count || 0) > offset + limit,
  };

  // Cache for 5 minutes
  await cacheSet(cacheKey, result, 300);
  return result;
}

// ─── SEARCH PRODUCTS ──────────────────────────────────────────

export async function searchProducts(query: string, page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const { data, count, error } = await supabaseAdmin
    .from('products')
    .select(`
      id, title, slug, short_description, price, currency,
      category, tags, thumbnail_url, rating, download_count,
      seller:users(id, username, display_name, avatar_url)
    `, { count: 'exact' })
    .eq('is_active', true)
    .textSearch('title', query, { type: 'websearch', config: 'english' })
    .range(offset, offset + limit - 1);

  if (error) throw new AppError(500, 'Search failed');

  return {
    items: data || [],
    total: count || 0,
    page,
    limit,
    hasMore: (count || 0) > offset + limit,
    query,
  };
}

// ─── TRENDING PRODUCTS ────────────────────────────────────────

export async function getTrendingProducts(limit = 10) {
  const cacheKey = `products:trending:${limit}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabaseAdmin
    .from('products')
    .select(`
      id, title, slug, short_description, price, currency,
      category, tags, thumbnail_url, rating, download_count, review_count,
      seller:users(id, username, display_name, avatar_url, is_verified)
    `)
    .eq('is_active', true)
    .order('download_count', { ascending: false })
    .order('rating', { ascending: false })
    .limit(limit);

  if (error) throw new AppError(500, 'Failed to fetch trending products');

  // Cache trending for 10 minutes
  await cacheSet(cacheKey, data, 600);
  return data;
}

// ─── GET SINGLE PRODUCT ───────────────────────────────────────

export async function getProductById(id: string) {
  const cacheKey = `products:${id}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabaseAdmin
    .from('products')
    .select(`
      *,
      seller:users(id, username, display_name, avatar_url, bio, is_verified, rating, total_sales)
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error || !data) throw new AppError(404, 'Product not found');

  // Increment view count (fire and forget — don't await)
  supabaseAdmin
    .from('products')
    .update({ view_count: (data.view_count || 0) + 1 })
    .eq('id', id)
    .then(() => {});

  // Cache product for 5 minutes
  await cacheSet(cacheKey, data, 300);
  return data;
}

// ─── CREATE PRODUCT ───────────────────────────────────────────

export async function createProduct(input: CreateProductInput) {
  const slug = generateSlug(input.title);

  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({
      seller_id: input.sellerId,
      title: input.title,
      slug,
      description: input.description,
      short_description: input.shortDescription,
      price: input.price,
      currency: input.currency,
      category: input.category,
      tags: input.tags || [],
      tech_stack: input.techStack || [],
      thumbnail_url: input.thumbnailUrl,
      preview_url: input.previewUrl,
      version: input.version || '1.0.0',
      seo_title: input.seoTitle || input.title,
      seo_description: input.seoDescription || input.shortDescription,
      blockchain_cert_id: `DC-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') throw new AppError(409, 'Product with this title already exists');
    throw new AppError(500, 'Failed to create product');
  }

  // Invalidate list cache
  await cacheDel('products:list:*');
  return data;
}

// ─── UPDATE PRODUCT ───────────────────────────────────────────

export async function updateProduct(
  id: string,
  sellerId: string,
  updates: Partial<CreateProductInput>
) {
  // Verify ownership first
  const { data: existing } = await supabaseAdmin
    .from('products')
    .select('seller_id')
    .eq('id', id)
    .single();

  if (!existing) throw new AppError(404, 'Product not found');
  if (existing.seller_id !== sellerId) throw new AppError(403, 'You do not own this product');

  const { data, error } = await supabaseAdmin
    .from('products')
    .update({
      ...(updates.title && { title: updates.title }),
      ...(updates.description && { description: updates.description }),
      ...(updates.shortDescription && { short_description: updates.shortDescription }),
      ...(updates.price !== undefined && { price: updates.price }),
      ...(updates.category && { category: updates.category }),
      ...(updates.tags && { tags: updates.tags }),
      ...(updates.techStack && { tech_stack: updates.techStack }),
      ...(updates.thumbnailUrl && { thumbnail_url: updates.thumbnailUrl }),
      ...(updates.previewUrl && { preview_url: updates.previewUrl }),
      ...(updates.seoTitle && { seo_title: updates.seoTitle }),
      ...(updates.seoDescription && { seo_description: updates.seoDescription }),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError(500, 'Failed to update product');

  // Invalidate caches
  await cacheDel(`products:${id}`);
  return data;
}

// ─── DELETE PRODUCT ───────────────────────────────────────────

export async function deleteProduct(id: string, sellerId: string) {
  const { data: existing } = await supabaseAdmin
    .from('products')
    .select('seller_id')
    .eq('id', id)
    .single();

  if (!existing) throw new AppError(404, 'Product not found');
  if (existing.seller_id !== sellerId) throw new AppError(403, 'You do not own this product');

  // Soft delete — set is_active to false (never hard delete purchases)
  const { error } = await supabaseAdmin
    .from('products')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw new AppError(500, 'Failed to delete product');

  await cacheDel(`products:${id}`);
}
