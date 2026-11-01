/**
 * DevPrep - Mock Test Engine Controller (`mockTestController.js`)
 * 
 * Concepts explained:
 * 1. Anti-Cheat & Information Hiding: `GET /api/mock-test` strictly filters out
 *    `correctIndex` and `explanation` before sending questions to the client. Correct answers
 *    never leave the server during test execution.
 * 2. Fisher-Yates Array Shuffling: Guarantees unbiased random ordering of test questions.
 * 3. Server-Side Grading: `POST /api/mock-test/submit` securely checks student answers
 *    against the authoritative question bank, calculates accuracy %, and generates
 *    per-topic breakdowns and per-question reviews.
 * 4. User-Scoped Attempt Persistence: Saves every attempt to `mockTests.json` keyed by
 *    `req.user.id` so students can track their historical test performance.
 */

const { getStorage } = require('../storage');
const { ALLOWED_TOPICS } = require('../utils/validators');

/**
 * Fisher-Yates array shuffle implementation
 */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * GET /api/mock-test
 * Retrieves randomized MCQs for a timed assessment WITHOUT exposing correct answers
 */
async function getMockTest(req, res, next) {
  try {
    const { topic, count } = req.query;

    const storage = getStorage();
    const pool = await storage.listMcqs({ topic });

    if (pool.length === 0) {
      return res.status(404).json({ error: `No mock test questions available for topic "${topic}"` });
    }

    // Shuffle pool
    const shuffled = shuffleArray(pool);

    // Limit to requested count (default 10, max 25, min 1)
    const targetCount = count ? Math.min(Math.max(parseInt(count, 10) || 10, 1), 25) : 10;
    const selected = shuffled.slice(0, targetCount);

    // Anti-Cheat: Strip correctIndex and explanation
    const safeQuestions = selected.map(({ id, topic: qTopic, question, options }) => ({
      id,
      topic: qTopic,
      question,
      options
    }));

    res.status(200).json({
      topic: topic || 'All Topics',
      questions: safeQuestions,
      total: safeQuestions.length,
      timeLimitSeconds: safeQuestions.length * 90 // 90 seconds per question standard
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/mock-test/submit
 * Grades submitted answers on the server and returns score, accuracy, and detailed review
 */
async function submitMockTest(req, res, next) {
  try {
    const userId = req.user.id;
    const { topic, answers, timeTaken } = req.body;

    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: 'Field "answers" must be an array of question selections' });
    }

    const storage = getStorage();
    const questionBank = await storage.listMcqs();

    let score = 0;
    const reviews = [];
    const topicBreakdown = {};

    for (const ans of answers) {
      const q = questionBank.find((item) => item.id === ans.questionId);
      if (!q) continue;

      const selectedIndex = typeof ans.selectedIndex === 'number' ? ans.selectedIndex : -1;
      const isCorrect = selectedIndex === q.correctIndex;
      if (isCorrect) score++;

      // Track topic breakdown
      if (!topicBreakdown[q.topic]) {
        topicBreakdown[q.topic] = { score: 0, total: 0 };
      }
      topicBreakdown[q.topic].total++;
      if (isCorrect) topicBreakdown[q.topic].score++;

      reviews.push({
        questionId: q.id,
        topic: q.topic,
        question: q.question,
        options: q.options,
        selectedIndex,
        correctIndex: q.correctIndex,
        isCorrect,
        explanation: q.explanation
      });
    }

    const total = reviews.length;
    const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;

    const attempt = {
      id: `att-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      topic: topic || 'Mixed',
      score,
      total,
      accuracy,
      timeTaken: typeof timeTaken === 'number' ? timeTaken : 0,
      date: new Date().toISOString(),
      topicBreakdown,
      reviews // Immutable historical snapshot preserved at submit time
    };

    await storage.createAttempt(attempt);

    res.status(200).json({
      attempt,
      reviews,
      hasSnapshot: true
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/mock-test/attempts
 * Returns past test attempts for the authenticated user.
 * Supports pagination via ?page=&limit=.
 * Returns summary fields only (excluding heavy question reviews array).
 */
async function getUserAttempts(req, res, next) {
  try {
    const userId = req.user.id;
    const storage = getStorage();
    const result = await storage.listAttempts(userId, {
      page: req.query.page,
      limit: req.query.limit
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/mock-test/attempts/:id
 * Returns the full attempt report with question snapshot review.
 * Returns 404 if not found or if the attempt belongs to another user.
 */
async function getAttemptById(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const storage = getStorage();
    const attempt = await storage.findAttemptById(userId, id);

    if (!attempt || attempt.userId !== userId) {
      return res.status(404).json({ error: 'Assessment report not found' });
    }

    const reviews = Array.isArray(attempt.reviews) ? attempt.reviews : [];
    const hasSnapshot = reviews.length > 0;

    res.status(200).json({
      attempt: {
        id: attempt.id,
        userId: attempt.userId,
        topic: attempt.topic || 'Mixed',
        score: attempt.score,
        total: attempt.total,
        accuracy: attempt.accuracy,
        timeTaken: attempt.timeTaken || 0,
        date: attempt.date,
        topicBreakdown: attempt.topicBreakdown || {}
      },
      reviews,
      hasSnapshot
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/mock-test/counts
 * Returns the count of available active MCQs per topic
 */
async function getTopicCounts(req, res, next) {
  try {
    const storage = getStorage();
    const result = await storage.getMcqTopicCounts();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMockTest,
  submitMockTest,
  getUserAttempts,
  getAttemptById,
  getTopicCounts
};
