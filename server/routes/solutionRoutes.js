/**
 * DevPrep - Solution Routes (`solutionRoutes.js`)
 * 
 * Endpoints:
 * - GET    /api/solutions               -> List user's saved solutions summary
 * - GET    /api/solutions/:questionId   -> Get saved solutions for a question
 * - PUT    /api/solutions/:questionId   -> Save or update a solution
 * - DELETE /api/solutions/:questionId   -> Delete saved solution (?language=...)
 */

const express = require('express');
const router = express.Router();
const solutionController = require('../controllers/solutionController');
const { requireAuth } = require('../middleware/auth');

// All solution endpoints require authentication
router.use(requireAuth);

router.get('/', solutionController.getUserSolutions);
router.get('/:questionId', solutionController.getQuestionSolutions);
router.put('/:questionId', solutionController.saveSolution);
router.delete('/:questionId', solutionController.deleteSolution);

module.exports = router;
