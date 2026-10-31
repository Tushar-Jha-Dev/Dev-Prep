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

const { readJson, writeJson, FILES } = require('../utils/fileDb');
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
    const { status, search } = req.query;

    const allApplications = await readJson(FILES.APPLICATIONS, []);

    // 1. Scope strictly to the logged-in user
    let userApplications = allApplications.filter((app) => app.userId === userId);

    // 2. Filter by Status if provided
    if (status && status.trim() !== '') {
      const statusLower = status.trim().toLowerCase();
      userApplications = userApplications.filter(
        (app) => app.status && app.status.toLowerCase() === statusLower
      );
    }

    // 3. Filter by Search Query (company, role, location, notes)
    if (search && search.trim() !== '') {
      const query = search.trim().toLowerCase();
      userApplications = userApplications.filter(
        (app) =>
          (app.company && app.company.toLowerCase().includes(query)) ||
          (app.role && app.role.toLowerCase().includes(query)) ||
          (app.location && app.location.toLowerCase().includes(query)) ||
          (app.notes && app.notes.toLowerCase().includes(query))
      );
    }

    // Sort by appliedDate descending (newest first)
    userApplications.sort((a, b) => new Date(b.appliedDate || 0) - new Date(a.appliedDate || 0));

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

    const allApplications = await readJson(FILES.APPLICATIONS, []);
    allApplications.push(newApplication);
    await writeJson(FILES.APPLICATIONS, allApplications);

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

    const allApplications = await readJson(FILES.APPLICATIONS, []);
    const index = allApplications.findIndex((app) => app.id === id && app.userId === userId);

    if (index === -1) {
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

    const current = allApplications[index];
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

    allApplications[index] = updatedApplication;
    await writeJson(FILES.APPLICATIONS, allApplications);

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

    const allApplications = await readJson(FILES.APPLICATIONS, []);
    const index = allApplications.findIndex((app) => app.id === id && app.userId === userId);

    if (index === -1) {
      return res.status(404).json({ error: `Application with ID "${id}" not found` });
    }

    allApplications.splice(index, 1);
    await writeJson(FILES.APPLICATIONS, allApplications);

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
