/**
 * Database compatibility helpers.
 *
 * DevChain supports two database modes:
 *  - PostgreSQL  (production — Supabase/Render) — native String[] scalar lists
 *  - SQLite      (local dev — zero dependencies) — arrays stored as JSON strings
 *
 * These helpers keep the application code database-agnostic so a single
 * codebase runs on both without branching everywhere.
 */
const isSqlite = () => (process.env.DATABASE_URL || '').trim().startsWith('file:');

/**
 * Serialize an array for writes.
 * - PostgreSQL: pass through as native scalar list
 * - SQLite: JSON-encode into a String column
 */
function serializeArray(arr) {
  const list = Array.isArray(arr) ? arr : [];
  return isSqlite() ? JSON.stringify(list) : list;
}

/**
 * Deserialize an array read from the database.
 * - PostgreSQL: already an array — pass through
 * - SQLite: JSON string — parse it (tolerant of already-parsed values)
 */
function deserializeArray(value) {
  if (!isSqlite()) return value || [];
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Serialize a JSON-able value for writes.
 * - PostgreSQL: native Json column — pass through
 * - SQLite: JSON-encode into a String column
 */
function serializeJson(value) {
  if (!isSqlite()) return value === undefined ? null : value;
  if (value === undefined || value === null) return null;
  return typeof value === 'string' ? value : JSON.stringify(value);
}

/**
 * Deserialize a JSON-able value read from the database.
 * - PostgreSQL: native Json column — pass through
 * - SQLite: JSON string — parse it (tolerant of already-parsed values)
 */
function deserializeJson(value) {
  if (!isSqlite()) return value === undefined ? null : value;
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/**
 * Build a "field contains value" where-filter that works on both databases.
 * - PostgreSQL: native `has` filter on scalar lists
 * - SQLite: loose `contains` on the JSON-encoded string
 */
function arrayHas(field, value) {
  if (isSqlite()) return { [field]: { contains: value } };
  return { [field]: { has: value } };
}

/**
 * Resolve the active storage provider.
 * Explicit STORAGE_PROVIDER wins; otherwise infer from the database mode
 * (SQLite => local disk, PostgreSQL => Supabase).
 */
function storageProvider() {
  const explicit = (process.env.STORAGE_PROVIDER || '').trim().toLowerCase();
  if (explicit) return explicit;
  return isSqlite() ? 'local' : 'supabase';
}

module.exports = {
  isSqlite,
  serializeArray,
  deserializeArray,
  serializeJson,
  deserializeJson,
  arrayHas,
  storageProvider,
};
