/**
 * DevPrep - User Progress Routes (`progressRoutes.js`)
 * 
 * Endpoints:
 * - GET  /api/progress -> Fetch current authenticated user's progress
 * - POST /api/progress -> Update progress (action: "markSolved" | "unmarkSolved" | "updateProfile")
 */

const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const { requireAuth } = require('../middleware/auth');

// All progress endpoints require authentication
router.use(requireAuth);

router.get('/', progressController.getProgress);
router.post('/', progressController.updateProgress);

module.exports = router;
