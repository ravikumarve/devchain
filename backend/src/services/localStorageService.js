/**
 * Local disk storage service.
 *
 * Used in LOCAL MODE (SQLite) so the entire stack runs with zero external
 * dependencies. Files are written to backend/uploads/ and streamed back
 * through the ownership-checked download endpoint (never served publicly).
 *
 * API mirrors Supabase Storage so storageService.js can swap transparently.
 */
const fs = require('fs');
const path = require('path');
const { getLogger } = require('../utils/logger');

const log = getLogger('storage-local');

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'devchain-files';
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

/** Resolve a storage path safely inside UPLOADS_DIR (prevents traversal). */
function resolveStoragePath(storagePath) {
  const normalized = path.normalize(storagePath || '');
  if (path.isAbsolute(normalized) || normalized.startsWith('..')) {
    throw new Error(`Invalid storage path: ${storagePath}`);
  }
  return path.join(UPLOADS_DIR, normalized);
}

async function upload(buffer, storagePath, contentType) {
  const full = resolveStoragePath(storagePath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, buffer);
  return { error: null };
}

async function remove(storagePath) {
  try {
    const full = resolveStoragePath(storagePath);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  } catch (err) {
    log.warn({ err }, 'Failed to remove local file');
    return { error: err };
  }
  return { error: null };
}

/**
 * Return a marker URL for local files. The download controller detects the
 * `local://` prefix and streams the file directly (after ownership checks).
 */
async function getSignedUrl(storagePath) {
  return { data: { signedUrl: `local://${storagePath}` }, error: null };
}

async function list(folder) {
  try {
    const dir = path.join(UPLOADS_DIR, folder || '');
    if (!fs.existsSync(dir)) return { data: [], error: null };

    const data = fs.readdirSync(dir, { withFileTypes: true })
      .filter(e => e.isFile())
      .map(e => {
        const stat = fs.statSync(path.join(dir, e.name));
        return { name: e.name, metadata: { size: stat.size } };
      });
    return { data, error: null };
  } catch (err) {
    return { data: [], error: err };
  }
}

/**
 * Stream a stored file to the response. Caller is responsible for
 * authorization checks before invoking this.
 */
async function downloadStream(storagePath, res) {
  const full = resolveStoragePath(storagePath);
  if (!fs.existsSync(full)) {
    const error = new Error('File not found in local storage');
    error.statusCode = 404;
    throw error;
  }
  return new Promise((resolve, reject) => {
    res.download(full, (err) => {
      if (err && !res.headersSent) reject(err);
      else resolve();
    });
  });
}

module.exports = { upload, remove, getSignedUrl, list, downloadStream, BUCKET, UPLOADS_DIR };
