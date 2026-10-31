/**
 * DevPrep - Express API Server Entry Point
 * 
 * Middleware Pipeline:
 * Request arrives -> CORS -> express.json() -> Routes (/api/health, /api/auth, /api/questions, /api/progress) -> 404 handler -> Central Error Handler
 */

const path = require('path');
// Load environment variables from server/.env regardless of working directory
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');

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

// Middleware
app.use(cors());

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
