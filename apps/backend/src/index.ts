// src/index.ts — DevChain API Entry Point
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { redis } from './config/redis.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';

const app = express();

// Security headers
app.use(helmet());

// CORS
const allowedOrigins = env.NODE_ENV === 'production'
  ? ['https://devchain.app', 'https://www.devchain.app']
  : ['http://localhost:8081', 'http://localhost:3001', 'http://localhost:19006'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
app.use(globalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Health check — no auth, no rate limit
app.get('/health', async (_req: Request, res: Response) => {
  let redisStatus = 'ok';
  try { await redis.ping(); } catch { redisStatus = 'error'; }
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    services: { redis: redisStatus },
  });
});

// API routes
app.use('/api', apiRoutes);

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start
const PORT = parseInt(env.PORT, 10);
app.listen(PORT, () => {
  console.log(`\n🚀 DevChain API running`);
  console.log(`   Environment : ${env.NODE_ENV}`);
  console.log(`   Port        : ${PORT}`);
  console.log(`   Health      : http://localhost:${PORT}/health`);
  console.log(`   API         : http://localhost:${PORT}/api\n`);
});

export default app;
