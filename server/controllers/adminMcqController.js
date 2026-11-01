/**
 * DevPrep - Admin MCQ Bank Controller (`adminMcqController.js`)
 * 
 * Concepts explained:
 * 1. Role-Based Administration: Only authenticated users with `role: 'admin'`
 *    may access these endpoints. Standard students receive `403 Forbidden`.
 * 2. Full MCQ CRUD:
 *    - GET /api/admin/mcq: List all MCQs with optional search and topic filters,
 *      including `correctIndex` and `explanation`.
 *    - GET /api/admin/mcq/:id: Retrieve single MCQ with answers for editing.
 *    - POST /api/admin/mcq: Create new MCQ with strict input validation.
 *    - PUT /api/admin/mcq/:id: Update existing MCQ.
 *    - DELETE /api/admin/mcq/:id: Delete MCQ from the active question bank.
 * 3. Validation Rules:
 *    - Topic: Must be in ALLOWED_TOPICS.
 *    - Question: Required string (1-500 characters).
 *    - Options: Array of 2 to 6 unique, non-empty strings (max 200 characters each).
 *    - CorrectIndex: Integer pointing to a valid index in the options array.
 *    - Explanation: Optional string (max 500 characters).
 *    - Duplicate Detection: 409 Conflict if same question text exists in same topic.
 * 4. Immutable Past Attempts: Deleting or editing an MCQ does NOT break past student
 *    attempts because attempts store an immutable snapshot at submission time.
 */

const crypto = require('crypto');
const { getStorage } = require('../storage');
const { ALLOWED_TOPICS } = require('../utils/validators');

/**
 * Validates MCQ payload fields
 * @returns {string|null} Error message or null if valid
 */
function validateMcqPayload(body) {
  if (!body || typeof body !== 'object') {
    return 'Request body must be a JSON object';
  }

  const { topic, question, options, correctIndex, explanation } = body;

  // 1. Topic validation
  if (!topic || typeof topic !== 'string' || !ALLOWED_TOPICS.includes(topic.trim())) {
    return `Field "topic" must be one of: ${ALLOWED_TOPICS.join(', ')}`;
  }

  // 2. Question text validation
  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return 'Field "question" is required and cannot be empty';
  }
  if (question.trim().length > 500) {
    return 'Field "question" cannot exceed 500 characters';
  }

  // 3. Options validation (2 to 6 options, non-empty, max 200 chars each, no duplicates)
  if (!Array.isArray(options)) {
    return 'Field "options" must be an array of option strings';
  }
  if (options.length < 2 || options.length > 6) {
    return 'MCQs must have between 2 and 6 options';
  }

  const seenOptions = new Set();
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    if (typeof opt !== 'string' || opt.trim().length === 0) {
      return `Option at index ${i} cannot be empty`;
    }
    if (opt.trim().length > 200) {
      return `Option at index ${i} cannot exceed 200 characters`;
    }
    const normalized = opt.trim().toLowerCase();
    if (seenOptions.has(normalized)) {
      return `Duplicate option detected: "${opt.trim()}". All options must be unique`;
    }
    seenOptions.add(normalized);
  }

  // 4. Correct index validation
  if (!Number.isInteger(correctIndex)) {
    return 'Field "correctIndex" must be an integer';
  }
  if (correctIndex < 0 || correctIndex >= options.length) {
    return `Field "correctIndex" must be between 0 and ${options.length - 1}`;
  }

  // 5. Explanation validation (optional, max 500 chars)
  if (explanation !== undefined && explanation !== null) {
    if (typeof explanation !== 'string') {
      return 'Field "explanation" must be a string';
    }
    if (explanation.trim().length > 500) {
      return 'Field "explanation" cannot exceed 500 characters';
    }
  }

  return null;
}

/**
 * GET /api/admin/mcq
 * Retrieves all MCQs with full details (including correctIndex & explanation).
 * Supports optional ?topic=&search= query parameters.
 */
async function listMcqs(req, res, next) {
  try {
    const storage = getStorage();
    const mcqs = await storage.listMcqs(req.query);
    res.status(200).json(mcqs);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/mcq/:id
 * Retrieves a single MCQ by ID with full details.
 */
async function getMcqById(req, res, next) {
  try {
    const { id } = req.params;
    const storage = getStorage();
    const mcq = await storage.findMcqById(id);

    if (!mcq) {
      return res.status(404).json({ error: `MCQ with ID "${id}" not found` });
    }

    res.status(200).json(mcq);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/mcq
 * Creates a new MCQ in mcqBank.json.
 */
async function createMcq(req, res, next) {
  try {
    const validationError = validateMcqPayload(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const { topic, question, options, correctIndex, explanation } = req.body;
    const cleanTopic = topic.trim();
    const cleanQuestion = question.trim();
    const cleanOptions = options.map((o) => o.trim());
    const cleanExplanation = explanation ? explanation.trim() : '';

    const storage = getStorage();
    const mcqs = await storage.listMcqs({ topic: cleanTopic });

    // Check for duplicate question text within the same topic
    const duplicate = mcqs.find(
      (m) =>
        m.topic.toLowerCase() === cleanTopic.toLowerCase() &&
        m.question.toLowerCase() === cleanQuestion.toLowerCase()
    );
    if (duplicate) {
      return res.status(409).json({
        error: `An MCQ with question "${cleanQuestion}" already exists under topic "${cleanTopic}"`
      });
    }

    const newMcq = {
      id: crypto.randomUUID(),
      topic: cleanTopic,
      question: cleanQuestion,
      options: cleanOptions,
      correctIndex,
      explanation: cleanExplanation
    };

    await storage.createMcq(newMcq);

    res.status(201).json(newMcq);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/mcq/:id
 * Updates an existing MCQ in mcqBank.json.
 */
async function updateMcq(req, res, next) {
  try {
    const { id } = req.params;
    const validationError = validateMcqPayload(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const { topic, question, options, correctIndex, explanation } = req.body;
    const cleanTopic = topic.trim();
    const cleanQuestion = question.trim();
    const cleanOptions = options.map((o) => o.trim());
    const cleanExplanation = explanation ? explanation.trim() : '';

    const storage = getStorage();
    const existing = await storage.findMcqById(id);
    if (!existing) {
      return res.status(404).json({ error: `MCQ with ID "${id}" not found` });
    }

    // Check duplicate question text on other records under this topic
    const mcqs = await storage.listMcqs({ topic: cleanTopic });
    const duplicate = mcqs.find(
      (m) =>
        m.id !== id &&
        m.topic.toLowerCase() === cleanTopic.toLowerCase() &&
        m.question.toLowerCase() === cleanQuestion.toLowerCase()
    );
    if (duplicate) {
      return res.status(409).json({
        error: `An MCQ with question "${cleanQuestion}" already exists under topic "${cleanTopic}"`
      });
    }

    const updatedMcq = {
      id,
      topic: cleanTopic,
      question: cleanQuestion,
      options: cleanOptions,
      correctIndex,
      explanation: cleanExplanation
    };

    await storage.updateMcq(id, updatedMcq);

    res.status(200).json(updatedMcq);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/mcq/:id
 * Deletes an MCQ from mcqBank.json.
 */
async function deleteMcq(req, res, next) {
  try {
    const { id } = req.params;
    const storage = getStorage();
    const deleted = await storage.deleteMcq(id);

    if (!deleted) {
      return res.status(404).json({ error: `MCQ with ID "${id}" not found` });
    }

    res.status(200).json({
      message: `MCQ "${deleted.id}" successfully deleted`,
      deleted
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listMcqs,
  getMcqById,
  createMcq,
  updateMcq,
  deleteMcq
};
