/**
 * Express Application Setup
 * 
 * Configures Express with CORS, middleware, and routes.
 * Socket.io is initialized separately in index.ts
 */

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authRouter } from './controllers/authController';

// =============================================================================
// APP CONFIGURATION
// =============================================================================

const app = express();

// Environment
// Normalize FRONTEND_URL - remove trailing slash for CORS matching
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
const isProduction = process.env.NODE_ENV === 'production';

// =============================================================================
// MIDDLEWARE
// =============================================================================

// CORS - Allow frontend to send/receive cookies
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,  // CRITICAL: Allows cookies
  methods: ['GET', 'POST', 'OPTIONS'], // Include OPTIONS for preflight
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200, // Some legacy browsers (IE11) choke on 204
}));

// Log CORS configuration
console.log('🌐 CORS configured for:', FRONTEND_URL);

// Parse JSON bodies
app.use(express.json());

// Parse cookies
app.use(cookieParser());

// =============================================================================
// ROUTES
// =============================================================================

// Health check
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: isProduction ? 'production' : 'development',
    frontendUrl: FRONTEND_URL, // Debug: show configured frontend URL
  });
});

// CORS middleware already handles OPTIONS requests automatically
// No need for explicit OPTIONS handler - cors() does it

// Auth routes
app.use('/api/auth', authRouter);

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ Unhandled error:', err);
  
  res.status(500).json({ 
    error: isProduction ? 'Internal server error' : err.message,
  });
});

export { app };
