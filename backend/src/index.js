const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security Middleware ──
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// ── Rate Limiting ──
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// ── Body Parser ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health Check ──
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'DevChain API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ── Routes (we'll add these next) ──
// app.use('/api/v1/auth', require('./routes/auth'));
// app.use('/api/v1/products', require('./routes/products'));
// app.use('/api/v1/orders', require('./routes/orders'));
// app.use('/api/v1/jobs', require('./routes/jobs'));
// app.use('/api/v1/users', require('./routes/users'));

// ── 404 Handler ──
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global Error Handler ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`🚀 DevChain API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
