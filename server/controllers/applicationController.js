/**
 * DevPrep - Job & Internship Application Controller (`applicationController.js`)
 * 
 * Concepts explained:
 * 1. User Scoping: All read, write, update, and delete actions are strictly scoped
 *    to `req.user.id` so students can never view or modify another student's applications.
 * 2. Multi-Param Filtering: Supports filtering by `status` ('Applied', 'Interview',
 *    'Selected', 'Rejected') and text search across company, role, location, or notes.
 * 3. Validation Enums: Validates input fields and enums before modifying JSON files.
 * 4. Atomic File Persistence: Uses `readJson` and `writeJson` from `fileDb.js` for safe concurrency.
 */

const { getStorage } = require('../storage');
const {
  ALLOWED_APPLICATION_STATUSES,
  validateRequiredFields,
  validateEnum
} = require('../utils/validators');

/**
 * GET /api/applications
 * Returns all applications for the authenticated user, optionally filtered by status or search text
 */
async function getApplications(req, res, next) {
  try {
    const userId = req.user.id;
    const storage = getStorage();
    const userApplications = await storage.listApplications(userId, req.query);
    res.status(200).json(userApplications);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/applications
 * Creates a new job or internship application for the authenticated user
 */
async function createApplication(req, res, next) {
  try {
    const userId = req.user.id;
    const { company, role, location, appliedDate, status, notes } = req.body;

    // 1. Validate required fields
    const missingError = validateRequiredFields(req.body, ['company', 'role', 'appliedDate', 'status']);
    if (missingError) {
      return res.status(400).json({ error: missingError });
    }

    // 2. Validate status enum
    const statusError = validateEnum(status, ALLOWED_APPLICATION_STATUSES, 'status');
    if (statusError) {
      return res.status(400).json({ error: statusError });
    }

    // 3. Generate unique application ID
    const id = `app-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    const newApplication = {
      id,
      userId,
      company: company.trim(),
      role: role.trim(),
      location: typeof location === 'string' ? location.trim() : '',
      appliedDate: appliedDate.trim(),
      status,
      notes: typeof notes === 'string' ? notes.trim() : ''
    };

    const storage = getStorage();
    await storage.createApplication(newApplication);

    res.status(201).json(newApplication);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/applications/:id
 * Updates an existing application owned by the authenticated user
 */
async function updateApplication(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { company, role, location, appliedDate, status, notes } = req.body;

    const storage = getStorage();
    const current = await storage.findApplicationById(userId, id);

    if (!current) {
      return res.status(404).json({ error: `Application with ID "${id}" not found` });
    }

    // Validate status if provided
    if (status !== undefined) {
      const statusError = validateEnum(status, ALLOWED_APPLICATION_STATUSES, 'status');
      if (statusError) {
        return res.status(400).json({ error: statusError });
      }
    }

    if (company !== undefined && (typeof company !== 'string' || company.trim() === '')) {
      return res.status(400).json({ error: 'Company cannot be empty' });
    }

    if (role !== undefined && (typeof role !== 'string' || role.trim() === '')) {
      return res.status(400).json({ error: 'Role cannot be empty' });
    }

    if (appliedDate !== undefined && (typeof appliedDate !== 'string' || appliedDate.trim() === '')) {
      return res.status(400).json({ error: 'Applied date cannot be empty' });
    }

    const updatedApplication = {
      ...current,
      id, // Preserve ID
      userId, // Preserve User ID
      company: company !== undefined ? company.trim() : current.company,
      role: role !== undefined ? role.trim() : current.role,
      location: location !== undefined ? location.trim() : current.location,
      appliedDate: appliedDate !== undefined ? appliedDate.trim() : current.appliedDate,
      status: status !== undefined ? status : current.status,
      notes: notes !== undefined ? notes.trim() : current.notes
    };

    await storage.updateApplication(userId, id, updatedApplication);

    res.status(200).json(updatedApplication);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/applications/:id
 * Deletes an application owned by the authenticated user
 */
async function deleteApplication(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const storage = getStorage();
    const deleted = await storage.deleteApplication(userId, id);

    if (!deleted) {
      return res.status(404).json({ error: `Application with ID "${id}" not found` });
    }

    res.status(200).json({
      message: 'Application deleted successfully',
      id
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getApplications,
  createApplication,
  updateApplication,
  deleteApplication
};
