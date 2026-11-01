/**
 * DevPrep - Health Check Route
 * 
 * Concepts explained:
 * 1. Express Router: Modular, mountable route handlers that keep server.js clean.
 * 2. Uptime and Status: Gives observability into whether the API server is healthy.
 */

const express = require('express');
const router = express.Router();
const { getStorage } = require('../storage');

router.get('/', async (req, res) => {
  try {
    const storage = getStorage();
    const dbReachable = await storage.ping();

    res.status(200).json({
      status: 'ok',
      message: 'DevPrep API server is running',
      storageDriver: storage.getDriverName(),
      dbReachable: Boolean(dbReachable),
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime())
    });
  } catch (err) {
    res.status(200).json({
      status: 'degraded',
      message: 'DevPrep API server is running with storage warnings',
      storageDriver: 'unknown',
      dbReachable: false,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime())
    });
  }
});

module.exports = router;
