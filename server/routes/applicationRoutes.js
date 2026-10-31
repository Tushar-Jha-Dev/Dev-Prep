/**
 * DevPrep - Job & Internship Application Routes (`applicationRoutes.js`)
 * 
 * Endpoints (All require authentication and are scoped to req.user.id):
 * - GET    /api/applications       -> List user's applications (supports ?status=&search=)
 * - POST   /api/applications       -> Create new application
 * - PUT    /api/applications/:id   -> Update existing application
 * - DELETE /api/applications/:id   -> Delete application
 */

const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { requireAuth } = require('../middleware/auth');

// All application routes require an authenticated student session
router.use(requireAuth);

router.get('/', applicationController.getApplications);
router.post('/', applicationController.createApplication);
router.put('/:id', applicationController.updateApplication);
router.delete('/:id', applicationController.deleteApplication);

module.exports = router;
