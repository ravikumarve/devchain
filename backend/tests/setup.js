/**
 * Global test setup for DevChain Backend tests
 * Sets required environment variables for all tests
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-that-is-at-least-32-chars!!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-that-is-also-32-chars!!';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.OWNERSHIP_HASH_SECRET = 'test-hash-secret';
process.env.LOG_LEVEL = 'silent';
process.env.PORT = '0';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock';
