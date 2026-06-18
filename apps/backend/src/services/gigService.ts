// src/services/gigService.ts
import { supabaseAdmin } from '../config/supabase.js';
import { cacheGet, cacheSet, cacheDel } from '../config/redis.js';
import { AppError } from '../middleware/errorHandler.js';

export interface CreateGigInput {
  freelancerId: string;
  title: string;
  description: string;
  priceFrom: number;
  priceTo?: number;
  currency: 'USD' | 'INR';
  deliveryDays: number;
  category: string;
  tags: string[];
  skills: string[];
  thumbnailUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface ListGigsInput {
  page?: number;
  limit?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular';
  freelancerId?: string;
}

// ─── LIST ─────────────────────────────────────────────────────
export async function listGigs(input: ListGigsInput) {
  const { page = 1, limit = 20, category, minPrice, maxPrice, sortBy = 'newest', freelancerId } = input;
  const offset = (page - 1) * limit;
  const cacheKey = `gigs:list:${JSON.stringify(input)}`;

  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  let query = supabaseAdmin
    .from('gigs')
    .select(`
      id, title, description, price_from, price_to, currency,
      delivery_days, category, tags, skills, thumbnail_url,
      rating, review_count, order_count, created_at,
      freelancer:users(id, username, display_name, avatar_url, is_verified, rating)
    `, { count: 'exact' })
    .eq('is_active', true);

  if (category) query = query.eq('category', category);
  if (minPrice !== undefined) query = query.gte('price_from', minPrice);
  if (maxPrice !== undefined) query = query.lte('price_from', maxPrice);
  if (freelancerId) query = query.eq('freelancer_id', freelancerId);

  switch (sortBy) {
    case 'price_asc': query = query.order('price_from', { ascending: true }); break;
    case 'price_desc': query = query.order('price_from', { ascending: false }); break;
    case 'rating': query = query.order('rating', { ascending: false }); break;
    case 'popular': query = query.order('order_count', { ascending: false }); break;
    default: query = query.order('created_at', { ascending: false });
  }

  const { data, count, error } = await query.range(offset, offset + limit - 1);
  if (error) throw new AppError(500, 'Failed to fetch gigs');

  const result = { items: data || [], total: count || 0, page, limit, hasMore: (count || 0) > offset + limit };
  await cacheSet(cacheKey, result, 300);
  return result;
}

// ─── SEARCH ───────────────────────────────────────────────────
export async function searchGigs(query: string, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const { data, count, error } = await supabaseAdmin
    .from('gigs')
    .select(`
      id, title, description, price_from, price_to, currency,
      delivery_days, category, tags, skills, rating, order_count,
      freelancer:users(id, username, display_name, avatar_url, is_verified)
    `, { count: 'exact' })
    .eq('is_active', true)
    .textSearch('title', query, { type: 'websearch', config: 'english' })
    .range(offset, offset + limit - 1);

  if (error) throw new AppError(500, 'Search failed');
  return { items: data || [], total: count || 0, page, limit, hasMore: (count || 0) > offset + limit, query };
}

// ─── GET ONE ──────────────────────────────────────────────────
export async function getGigById(id: string) {
  const cacheKey = `gigs:${id}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabaseAdmin
    .from('gigs')
    .select(`*, freelancer:users(id, username, display_name, avatar_url, bio, is_verified, rating, total_sales)`)
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error || !data) throw new AppError(404, 'Gig not found');
  await cacheSet(cacheKey, data, 300);
  return data;
}

// ─── CREATE ───────────────────────────────────────────────────
export async function createGig(input: CreateGigInput) {
  const { data, error } = await supabaseAdmin
    .from('gigs')
    .insert({
      freelancer_id: input.freelancerId,
      title: input.title,
      description: input.description,
      price_from: input.priceFrom,
      price_to: input.priceTo,
      currency: input.currency,
      delivery_days: input.deliveryDays,
      category: input.category,
      tags: input.tags || [],
      skills: input.skills || [],
      thumbnail_url: input.thumbnailUrl,
      seo_title: input.seoTitle || input.title,
      seo_description: input.seoDescription,
    })
    .select()
    .single();

  if (error) throw new AppError(500, 'Failed to create gig');
  return data;
}

// ─── UPDATE ───────────────────────────────────────────────────
export async function updateGig(id: string, freelancerId: string, updates: Partial<CreateGigInput>) {
  const { data: existing } = await supabaseAdmin.from('gigs').select('freelancer_id').eq('id', id).single();
  if (!existing) throw new AppError(404, 'Gig not found');
  if (existing.freelancer_id !== freelancerId) throw new AppError(403, 'You do not own this gig');

  const { data, error } = await supabaseAdmin
    .from('gigs')
    .update({
      ...(updates.title && { title: updates.title }),
      ...(updates.description && { description: updates.description }),
      ...(updates.priceFrom !== undefined && { price_from: updates.priceFrom }),
      ...(updates.priceTo !== undefined && { price_to: updates.priceTo }),
      ...(updates.deliveryDays && { delivery_days: updates.deliveryDays }),
      ...(updates.category && { category: updates.category }),
      ...(updates.tags && { tags: updates.tags }),
      ...(updates.skills && { skills: updates.skills }),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError(500, 'Failed to update gig');
  await cacheDel(`gigs:${id}`);
  return data;
}

// ─── DELETE ───────────────────────────────────────────────────
export async function deleteGig(id: string, freelancerId: string) {
  const { data: existing } = await supabaseAdmin.from('gigs').select('freelancer_id').eq('id', id).single();
  if (!existing) throw new AppError(404, 'Gig not found');
  if (existing.freelancer_id !== freelancerId) throw new AppError(403, 'You do not own this gig');

  const { error } = await supabaseAdmin.from('gigs').update({ is_active: false }).eq('id', id);
  if (error) throw new AppError(500, 'Failed to delete gig');
  await cacheDel(`gigs:${id}`);
}
