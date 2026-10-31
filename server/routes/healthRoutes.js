/**
 * DevPrep - Health Check Route
 * 
 * Concepts explained:
 * 1. Express Router: Modular, mountable route handlers that keep server.js clean.
 * 2. Uptime and Status: Gives observability into whether the API server is healthy.
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'DevPrep API server is running',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime())
  });
});

module.exports = router;
