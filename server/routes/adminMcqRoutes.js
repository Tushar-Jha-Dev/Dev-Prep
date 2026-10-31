/**
 * DevPrep - Admin MCQ Bank Routes (`adminMcqRoutes.js`)
 * 
 * Enforces requireAuth and requireAdmin across all endpoints.
 * Mount target in server.js: /api/admin/mcq
 */

const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const {
  listMcqs,
  getMcqById,
  createMcq,
  updateMcq,
  deleteMcq
} = require('../controllers/adminMcqController');

// All routes require authentication and admin role
router.use(requireAuth);
router.use(requireAdmin);

router.get('/', listMcqs);
router.get('/:id', getMcqById);
router.post('/', createMcq);
router.put('/:id', updateMcq);
router.delete('/:id', deleteMcq);

module.exports = router;
