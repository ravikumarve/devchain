/**
 * CORS configuration for DevChain API
 * Tightened per environment — allows known origins only in production
 */
const cors = require('cors');

const isProd = process.env.NODE_ENV === 'production';

// In production, only allow known frontend URLs
const allowedOrigins = isProd
  ? [
      'https://devchain-app.vercel.app',
      'https://devchain.onrender.com',
      'https://web-vert-mu-22.vercel.app',
      // Allow all Vercel deployment preview URLs
      /^https:\/\/web-[\w-]+-ravikumarves-projects\.vercel\.app$/,
      process.env.FRONTEND_URL,
    ].filter(Boolean)
  : [true]; // In development, allow all origins

const corsOptions = {
  origin: isProd
    ? (origin, callback) => {
        // Allow requests with no origin (server-to-server, curl, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.some(a => {
          if (typeof a === 'string') return a === origin || origin.startsWith(a);
          if (a instanceof RegExp) return a.test(origin);
          return false;
        })) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by DevChain CORS policy`));
        }
      }
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Stripe-Signature'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400, // 24 hours — browser can cache preflight
};

module.exports = cors(corsOptions);
