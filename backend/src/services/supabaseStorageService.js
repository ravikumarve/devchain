/**
 * Supabase Storage service.
 *
 * Used in CLOUD MODE (PostgreSQL) — production deployments on Supabase.
 * Thin wrapper around the Supabase admin client so the storage layer is
 * swappable (see services/storageService.js).
 */
const { adminClient: supabase } = require('../config/supabase');

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'devchain-files';

async function upload(buffer, storagePath, contentType) {
  return supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: contentType || 'application/octet-stream',
    upsert: true,
    cacheControl: '3600',
  });
}

async function remove(storagePath) {
  return supabase.storage.from(BUCKET).remove([storagePath]);
}

async function getSignedUrl(storagePath, expiresIn = 60) {
  return supabase.storage.from(BUCKET).createSignedUrl(storagePath, expiresIn);
}

async function list(folder) {
  return supabase.storage.from(BUCKET).list(folder);
}

module.exports = { upload, remove, getSignedUrl, list, BUCKET };
