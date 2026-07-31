/**
 * Storage service — provider switch.
 *
 * Resolves the active storage implementation based on the environment:
 *  - STORAGE_PROVIDER=local    => local disk (SQLite local dev mode)
 *  - STORAGE_PROVIDER=supabase => Supabase Storage (PostgreSQL cloud mode)
 *  - unset                     => inferred from database mode
 */
const { storageProvider } = require('../utils/dbCompat');

const provider = storageProvider();
const impl = provider === 'local'
  ? require('./localStorageService')
  : require('./supabaseStorageService');

impl.provider = provider;

module.exports = impl;
