/**
 * DevPrep - Express API Server Entry Point
 * 
 * Middleware Pipeline:
 * Request arrives -> CORS -> express.json() -> Routes (/api/health, /api/auth, /api/questions, /api/progress) -> 404 handler -> Central Error Handler
 */

const path = require('path');
// Load environment variables from server/.env regardless of working directory
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Validate production environment configuration before starting
const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET;

if (isProduction) {
  if (!jwtSecret || jwtSecret.length < 32 || jwtSecret.toLowerCase().includes('change') || jwtSecret.toLowerCase().includes('placeholder')) {
    throw new Error(
      '[Startup Error] In production, JWT_SECRET must be configured with a cryptographically strong string of at least 32 characters.'
    );
  }

  const driver = (process.env.STORAGE_DRIVER || '').trim().toLowerCase();
  if (driver === 'postgres' || (!driver && !process.env.DATABASE_URL)) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        '[Startup Error] In production, DATABASE_URL must be configured for PostgreSQL persistent storage.'
      );
    }
  }
}

const express = require('express');
const cors = require('cors');
const { getStorage } = require('./storage');

// Import modular routes
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const questionRoutes = require('./routes/questionRoutes');
const progressRoutes = require('./routes/progressRoutes');
const solutionRoutes = require('./routes/solutionRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const mockTestRoutes = require('./routes/mockTestRoutes');
const adminMcqRoutes = require('./routes/adminMcqRoutes');
const profileRoutes = require('./routes/profileRoutes');

// Import central middleware
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy (Vercel / AWS / load balancers)
app.set('trust proxy', 1);

// CORS Policy: permissive for same-origin requests through the frontend rewrite,
// and allowed development hosts in local testing
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. serverless rewrites, curl, mobile apps)
      if (!origin) return callback(null, true);
      if (!isProduction) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true
  })
);

// Route-specific 200 KB body limit for avatar uploads (preserves 100 KB global limit)
app.use('/api/profile/avatar', express.json({ limit: '200kb' }));
app.use(express.json());

// Mount API routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/solutions', solutionRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/mock-test', mockTestRoutes);
app.use('/api/admin/mcq', adminMcqRoutes);
app.use('/api/profile', profileRoutes);

// Catch-all 404 handler for unknown routes
app.use(notFound);

// Central error handler for internal errors
app.use(errorHandler);

// Start server if executed directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
