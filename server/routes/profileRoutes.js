/**
 * DevPrep - Profile Routes (`profileRoutes.js`)
 * 
 * Endpoints:
 * - GET    /api/profile/avatar   -> Get authenticated user's avatar
 * - PUT    /api/profile/avatar   -> Upload/update avatar (200 KB limit enforced)
 * - DELETE /api/profile/avatar   -> Remove avatar
 */

const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { requireAuth } = require('../middleware/auth');

// All profile endpoints require authentication
router.use(requireAuth);

router.get('/avatar', profileController.getAvatar);
router.put('/avatar', profileController.updateAvatar);
router.delete('/avatar', profileController.deleteAvatar);

module.exports = router;
