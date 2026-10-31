/**
 * DevPrep - Question Routes (`questionRoutes.js`)
 * 
 * Endpoints:
 * - GET    /api/questions       -> List questions (public, supports ?topic=&difficulty=&search=)
 * - GET    /api/questions/:id   -> Get question details (public)
 * - POST   /api/questions       -> Create new question (Admin only)
 * - PUT    /api/questions/:id   -> Update existing question (Admin only)
 * - DELETE /api/questions/:id   -> Delete question (Admin only)
 */

const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Public read routes
router.get('/', questionController.getQuestions);
router.get('/:id', questionController.getQuestionById);

// Protected admin routes
router.post('/', requireAuth, requireAdmin, questionController.createQuestion);
router.put('/:id', requireAuth, requireAdmin, questionController.updateQuestion);
router.delete('/:id', requireAuth, requireAdmin, questionController.deleteQuestion);

module.exports = router;
