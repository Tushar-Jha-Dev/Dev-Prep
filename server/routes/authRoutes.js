/**
 * DevPrep - Authentication Routes (`authRoutes.js`)
 * 
 * Endpoints:
 * - POST /api/auth/signup -> Register new user
 * - POST /api/auth/login  -> Log in and obtain JWT
 * - GET  /api/auth/me     -> Get authenticated user profile (requires Bearer token)
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/me', requireAuth, authController.getMe);

module.exports = router;
