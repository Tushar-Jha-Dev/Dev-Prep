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
const { readJson, writeJson, FILES } = require('../utils/fileDb');
const { ALLOWED_LANGUAGES, MAX_CODE_LENGTH } = require('../utils/validators');

/**
 * GET /api/solutions
 * Returns list of questions for which the user has saved solutions (questionId, language, updatedAt)
 */
async function getUserSolutions(req, res, next) {
  try {
    const userId = req.user.id;
    const solutions = await readJson(FILES.SOLUTIONS, []);

    // Filter to authenticated user only, returning summary metadata
    const userSolutions = solutions
      .filter((s) => s.userId === userId)
      .map((s) => ({
        questionId: s.questionId,
        language: s.language,
        updatedAt: s.updatedAt
      }));

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
    const questions = await readJson(FILES.QUESTIONS, []);
    const questionExists = questions.some((q) => q.id === questionId);
    if (!questionExists) {
      return res.status(404).json({ error: `Question with ID "${questionId}" not found` });
    }

    const solutions = await readJson(FILES.SOLUTIONS, []);
    const questionSolutions = solutions
      .filter((s) => s.userId === userId && s.questionId === questionId)
      .map((s) => ({
        id: s.id,
        language: s.language,
        code: s.code,
        updatedAt: s.updatedAt
      }));

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
    const questions = await readJson(FILES.QUESTIONS, []);
    const questionExists = questions.some((q) => q.id === questionId);
    if (!questionExists) {
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

    const solutions = await readJson(FILES.SOLUTIONS, []);
    const existingIndex = solutions.findIndex(
      (s) => s.userId === userId && s.questionId === questionId && s.language === language
    );

    const now = new Date().toISOString();
    let savedRecord;

    if (existingIndex >= 0) {
      // Update existing record
      solutions[existingIndex].code = code;
      solutions[existingIndex].updatedAt = now;
      savedRecord = solutions[existingIndex];
    } else {
      // Create new record
      savedRecord = {
        id: crypto.randomUUID(),
        userId,
        questionId,
        language,
        code,
        updatedAt: now
      };
      solutions.push(savedRecord);
    }

    await writeJson(FILES.SOLUTIONS, solutions);

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

    const solutions = await readJson(FILES.SOLUTIONS, []);
    const filteredSolutions = solutions.filter((s) => {
      if (s.userId !== userId || s.questionId !== questionId) {
        return true;
      }
      if (language && s.language !== language) {
        return true;
      }
      return false; // Remove matching record
    });

    await writeJson(FILES.SOLUTIONS, filteredSolutions);

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
