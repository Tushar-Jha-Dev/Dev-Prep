/**
 * DevPrep - User Solutions Controller (`solutionController.js`)
 * 
 * Concepts explained:
 * 1. Safe Code Notepad: Code is strictly treated as text; it is never executed,
 *    evaluated, or compiled, eliminating remote code execution vulnerabilities.
 * 2. Multi-Tenant Isolation: Every solution record is keyed to `req.user.id` from
 *    the verified JWT token. A user can never read, modify, or delete another user's code.
 * 3. Defensive Storage Limits: Code payloads are capped at 20,000 characters to prevent
 *    disk exhaustion or denial-of-service on JSON persistence files.
 * 4. Per-Language Storage: Students can save separate code implementations per language
 *    (JavaScript, Python, Java, C++) for the same problem.
 */

const crypto = require('crypto');
const { getStorage } = require('../storage');
const { ALLOWED_LANGUAGES, MAX_CODE_LENGTH } = require('../utils/validators');

/**
 * GET /api/solutions
 * Returns list of questions for which the user has saved solutions (questionId, language, updatedAt)
 */
async function getUserSolutions(req, res, next) {
  try {
    const userId = req.user.id;
    const storage = getStorage();
    const userSolutions = await storage.listSolutions(userId);
    res.status(200).json(userSolutions);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/solutions/:questionId
 * Returns all saved language solutions for a specific question for the authenticated user
 */
async function getQuestionSolutions(req, res, next) {
  try {
    const userId = req.user.id;
    const { questionId } = req.params;

    // Verify question exists in question bank
    const storage = getStorage();
    const question = await storage.findQuestionById(questionId);
    if (!question) {
      return res.status(404).json({ error: `Question with ID "${questionId}" not found` });
    }

    const questionSolutions = await storage.findSolutionsByQuestion(userId, questionId);
    res.status(200).json(questionSolutions);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/solutions/:questionId
 * Creates or updates a saved solution for a given language
 * Body: { language: "JavaScript" | "Python" | "Java" | "C++", code: string }
 */
async function saveSolution(req, res, next) {
  try {
    const userId = req.user.id;
    const { questionId } = req.params;
    const { language, code } = req.body;

    // 1. Verify question exists
    const storage = getStorage();
    const question = await storage.findQuestionById(questionId);
    if (!question) {
      return res.status(404).json({ error: `Question with ID "${questionId}" not found` });
    }

    // 2. Validate language
    if (!language || !ALLOWED_LANGUAGES.includes(language)) {
      return res.status(400).json({
        error: `Invalid language "${language}". Allowed: ${ALLOWED_LANGUAGES.join(', ')}`
      });
    }

    // 3. Validate code string and length
    if (typeof code !== 'string') {
      return res.status(400).json({ error: 'Code must be a string' });
    }

    if (code.length > MAX_CODE_LENGTH) {
      return res.status(400).json({
        error: `Code exceeds maximum allowed length of ${MAX_CODE_LENGTH} characters (${code.length} characters provided)`
      });
    }

    const savedRecord = await storage.saveSolution(userId, questionId, { language, code });

    res.status(200).json({
      id: savedRecord.id,
      questionId: savedRecord.questionId,
      language: savedRecord.language,
      code: savedRecord.code,
      updatedAt: savedRecord.updatedAt
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/solutions/:questionId?language=...
 * Deletes saved solution for a specific language
 */
async function deleteSolution(req, res, next) {
  try {
    const userId = req.user.id;
    const { questionId } = req.params;
    const { language } = req.query;

    if (language && !ALLOWED_LANGUAGES.includes(language)) {
      return res.status(400).json({
        error: `Invalid language "${language}". Allowed: ${ALLOWED_LANGUAGES.join(', ')}`
      });
    }

    const storage = getStorage();
    await storage.deleteSolution(userId, questionId, language);

    res.status(200).json({
      message: language
        ? `Saved ${language} solution deleted successfully`
        : 'Saved solutions deleted successfully'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getUserSolutions,
  getQuestionSolutions,
  saveSolution,
  deleteSolution
};
