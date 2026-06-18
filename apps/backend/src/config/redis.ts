// src/config/redis.ts
// Upstash Redis — rate limiting, caching, JWT blocklist.
// Free tier: 10,000 requests/day = $0
import { Redis } from '@upstash/redis';
import { env } from './env.js';

export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

export async function cacheGet<T>(key: string): Promise<T | null> {
  try { return await redis.get<T>(key); }
  catch { return null; }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  try { await redis.set(key, value, { ex: ttlSeconds }); }
  catch { console.warn(`[cache] Failed to write key: ${key}`); }
}

export async function cacheDel(key: string): Promise<void> {
  try { await redis.del(key); }
  catch { console.warn(`[cache] Failed to delete key: ${key}`); }
}
