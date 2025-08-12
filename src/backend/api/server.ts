/**
 * API Server
 * Main Express server for handling all API requests
 */

import express from 'express';
import dotenv from 'dotenv';
// Optional Sentry (API)
let sentryExpress: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Sentry = require('@sentry/node');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  sentryExpress = require('@sentry/node');
  if (process.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.VITE_SENTRY_DSN,
      environment: process.env.VITE_APP_ENV || process.env.NODE_ENV || 'production',
      tracesSampleRate: 0.1,
    });
  }
} catch {}
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dexscreenerRoutes from './dexscreenerRoutes';
import watchlistRoutes, { initializeWatchlistRoutes } from './watchlistRoutes';
import { DatabaseManager } from '../database/DatabaseManager';

// Load environment variables early
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration (env-driven)
const corsOrigins = (process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
const defaultDevOrigins = ['http://localhost:3000', 'http://localhost:5173'];
const allowOrigins = process.env.NODE_ENV === 'production' ? corsOrigins : defaultDevOrigins;
const allowNullOrigin = process.env.ALLOW_NULL_ORIGIN === 'true'; // for file:// origins in packaged Electron

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      // Allow non-browser or same-origin requests
      return callback(null, true);
    }
    if (allowNullOrigin && origin === 'null') {
      return callback(null, true);
    }
    if (allowOrigins.length === 0) {
      // If no explicit origins configured in prod, deny cross-origin
      return callback(new Error('CORS not allowed: no origins configured'), false as any);
    }
    if (allowOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS origin not allowed: ${origin}`), false as any);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sentry request handler (if enabled)
try {
  if (sentryExpress && process.env.VITE_SENTRY_DSN) {
    app.use(sentryExpress.Handlers.requestHandler());
    app.use(sentryExpress.Handlers.tracingHandler());
  }
} catch {
  // noop
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Initialize database manager for watchlist routes
const dbManager = new DatabaseManager();
initializeWatchlistRoutes(dbManager);

// API routes
app.use('/api/dexscreener', dexscreenerRoutes);
app.use('/api/watchlists', watchlistRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
  });
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Global error handler:', err);
  try {
    if (sentryExpress && process.env.VITE_SENTRY_DSN) {
      sentryExpress.captureException(err);
    }
  } catch {
    // noop
  }

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 API Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 DexScreener API: http://localhost:${PORT}/api/dexscreener`);
  });
}

export default app; 
