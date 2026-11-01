/**
 * DevPrep - Question Controller (`questionController.js`)
 * 
 * Concepts explained:
 * 1. Multi-Parameter Filtering: Combines `topic`, `difficulty`, and text `search`
 *    query parameters in a single pipeline.
 * 2. Shared Data Repository: Questions are common to all users and read directly from `questions.json`.
 * 3. RESTful Resource Identifiers: Individual questions are resolved by their unique ID (`GET /:id`).
 */

const { getStorage } = require('../storage');
const {
  ALLOWED_TOPICS,
  ALLOWED_DIFFICULTIES,
  validateRequiredFields,
  validateEnum,
  validateTestRunnerFields
} = require('../utils/validators');

/**
 * GET /api/questions
 * Returns all questions, optionally filtered by topic, difficulty, or search query
 */
async function getQuestions(req, res, next) {
  try {
    const storage = getStorage();
    const questions = await storage.listQuestions(req.query);
    res.status(200).json(questions);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/questions/:id
 * Returns a single question by its unique identifier
 */
async function getQuestionById(req, res, next) {
  try {
    const { id } = req.params;
    const storage = getStorage();
    const question = await storage.findQuestionById(id);

    if (!question) {
      return res.status(404).json({ error: `Question with ID "${id}" not found` });
    }

    res.status(200).json(question);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/questions
 * Creates a new DSA question (Admin only)
 */
async function createQuestion(req, res, next) {
  try {
    const { title, topic, difficulty, description, examples, constraints, solutionApproach } = req.body;

    // 1. Required fields validation
    const missingError = validateRequiredFields(req.body, ['title', 'topic', 'difficulty', 'description']);
    if (missingError) {
      return res.status(400).json({ error: missingError });
    }

    // 2. Enum validations
    const topicError = validateEnum(topic, ALLOWED_TOPICS, 'topic');
    if (topicError) {
      return res.status(400).json({ error: topicError });
    }

    const diffError = validateEnum(difficulty, ALLOWED_DIFFICULTIES, 'difficulty');
    if (diffError) {
      return res.status(400).json({ error: diffError });
    }

    // 2b. Test runner fields validation (Phase 10B)
    const testRunnerError = validateTestRunnerFields(req.body);
    if (testRunnerError) {
      return res.status(400).json({ error: testRunnerError });
    }

    // 3. Format dynamic arrays
    const formattedExamples = Array.isArray(examples)
      ? examples.filter((ex) => ex && (ex.input || ex.output))
      : [];

    const formattedConstraints = Array.isArray(constraints)
      ? constraints.filter((c) => typeof c === 'string' && c.trim() !== '').map((c) => c.trim())
      : [];

    // 4. Generate unique ID
    const topicSlug = topic.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 4);
    const id = `q-${topicSlug}-${Date.now().toString(36)}`;

    const newQuestion = {
      id,
      title: title.trim(),
      topic,
      difficulty,
      description: description.trim(),
      examples: formattedExamples,
      constraints: formattedConstraints,
      solutionApproach: typeof solutionApproach === 'string' ? solutionApproach.trim() : ''
    };

    if (req.body.functionName && req.body.functionName.trim()) {
      newQuestion.functionName = req.body.functionName.trim();
    }
    if (typeof req.body.starterCode === 'string') {
      newQuestion.starterCode = req.body.starterCode;
    }
    if (req.body.compare) {
      newQuestion.compare = req.body.compare;
    }
    if (Array.isArray(req.body.testCases)) {
      newQuestion.testCases = req.body.testCases;
    }

    const storage = getStorage();
    await storage.createQuestion(newQuestion);

    res.status(201).json(newQuestion);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/questions/:id
 * Updates an existing DSA question (Admin only)
 */
async function updateQuestion(req, res, next) {
  try {
    const { id } = req.params;
    const { title, topic, difficulty, description, examples, constraints, solutionApproach } = req.body;

    const storage = getStorage();
    const current = await storage.findQuestionById(id);

    if (!current) {
      return res.status(404).json({ error: `Question with ID "${id}" not found` });
    }

    // Validate if provided
    if (topic !== undefined) {
      const topicError = validateEnum(topic, ALLOWED_TOPICS, 'topic');
      if (topicError) {
        return res.status(400).json({ error: topicError });
      }
    }

    if (difficulty !== undefined) {
      const diffError = validateEnum(difficulty, ALLOWED_DIFFICULTIES, 'difficulty');
      if (diffError) {
        return res.status(400).json({ error: diffError });
      }
    }

    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }

    if (description !== undefined && (typeof description !== 'string' || description.trim() === '')) {
      return res.status(400).json({ error: 'Description cannot be empty' });
    }

    // Test runner fields validation (Phase 10B)
    const testRunnerError = validateTestRunnerFields(req.body);
    if (testRunnerError) {
      return res.status(400).json({ error: testRunnerError });
    }

    const formattedExamples = Array.isArray(examples)
      ? examples.filter((ex) => ex && (ex.input || ex.output))
      : current.examples;

    const formattedConstraints = Array.isArray(constraints)
      ? constraints.filter((c) => typeof c === 'string' && c.trim() !== '').map((c) => c.trim())
      : current.constraints;

    const updatedQuestion = {
      ...current,
      id, // Preserve original ID
      title: title !== undefined ? title.trim() : current.title,
      topic: topic !== undefined ? topic : current.topic,
      difficulty: difficulty !== undefined ? difficulty : current.difficulty,
      description: description !== undefined ? description.trim() : current.description,
      examples: formattedExamples,
      constraints: formattedConstraints,
      solutionApproach: solutionApproach !== undefined ? solutionApproach.trim() : (current.solutionApproach || ''),
      functionName: req.body.functionName !== undefined
        ? (req.body.functionName ? req.body.functionName.trim() : undefined)
        : current.functionName,
      starterCode: req.body.starterCode !== undefined ? req.body.starterCode : current.starterCode,
      compare: req.body.compare !== undefined ? (req.body.compare || undefined) : current.compare,
      testCases: req.body.testCases !== undefined ? req.body.testCases : current.testCases
    };

    // Clean up undefined properties
    if (updatedQuestion.functionName === undefined || updatedQuestion.functionName === '') {
      delete updatedQuestion.functionName;
    }
    if (updatedQuestion.starterCode === undefined) {
      delete updatedQuestion.starterCode;
    }
    if (updatedQuestion.compare === undefined || updatedQuestion.compare === '') {
      delete updatedQuestion.compare;
    }
    if (updatedQuestion.testCases === undefined || (Array.isArray(updatedQuestion.testCases) && updatedQuestion.testCases.length === 0)) {
      delete updatedQuestion.testCases;
    }

    await storage.updateQuestion(id, updatedQuestion);

    res.status(200).json(updatedQuestion);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/questions/:id
 * Deletes a DSA question by its ID (Admin only)
 */
async function deleteQuestion(req, res, next) {
  try {
    const { id } = req.params;
    const storage = getStorage();
    const deleted = await storage.deleteQuestion(id);

    if (!deleted) {
      return res.status(404).json({ error: `Question with ID "${id}" not found` });
    }

    res.status(200).json({
      message: 'Question deleted successfully',
      id
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion
};
