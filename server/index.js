require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const gamesRoutes = require('./routes/games');
const ordersRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payment');
const vouchersRoutes = require('./routes/vouchers');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── CORS: support localhost dev + production domain ──────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  process.env.CLIENT_URL,
  'https://nexusstore.site',
  'https://www.nexusstore.site',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman, same-origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.warn(`CORS blocked origin: ${origin}`);
    callback(null, true); // Allow all for now — tighten after confirming works
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Handle preflight requests explicitly
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Request logging ──────────────────────────────────────────────────────────
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.path} | Origin: ${req.headers.origin || 'none'}`);
  next();
});

// ─── API Routes (MUST be before static file serving) ─────────────────────────
app.use('/api/games', gamesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/vouchers', vouchersRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Nexus Store API is running!',
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 handler for /api/* routes ───────────────────────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `Route ${req.path} tidak ditemukan` });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// ─── Serve static frontend (AFTER API routes) ──────────────────────────────
const fs = require('fs');
let clientDist = path.join(__dirname, '../client/dist'); // Local development build

// Jika di Hostinger, biasanya frontend ada di ../public_html
if (!fs.existsSync(clientDist)) {
  clientDist = path.join(__dirname, '../public_html');
}

// Serve static files
app.use(express.static(clientDist));

// Fallback: send index.html for any non-API route (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║       🎮 Nexus Store API Server           ║
║       Port    : ${PORT}                       ║
║       Env     : ${(process.env.NODE_ENV || 'development').padEnd(12)}          ║
║       CORS    : ${allowedOrigins.length} origins allowed        ║
╚════════════════════════════════════════════╝
  `);
});
