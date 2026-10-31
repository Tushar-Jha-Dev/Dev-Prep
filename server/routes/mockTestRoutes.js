/**
 * DevPrep - Mock Test Routes (`mockTestRoutes.js`)
 * 
 * Endpoints:
 * - GET    /api/mock-test           -> Start/fetch test questions (anti-cheat: answers stripped)
 * - POST   /api/mock-test/submit    -> Submit answers for server evaluation
 * - GET    /api/mock-test/attempts  -> Fetch historical attempts for authenticated user
 */

const express = require('express');
const router = express.Router();
const mockTestController = require('../controllers/mockTestController');
const { requireAuth } = require('../middleware/auth');

// All mock test routes require authentication
router.use(requireAuth);

router.get('/', mockTestController.getMockTest);
router.get('/counts', mockTestController.getTopicCounts);
router.post('/submit', mockTestController.submitMockTest);
router.get('/attempts', mockTestController.getUserAttempts);
router.get('/attempts/:id', mockTestController.getAttemptById);

module.exports = router;
