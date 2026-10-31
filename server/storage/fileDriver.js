/**
 * DevPrep - File Storage Driver (`fileDriver.js`)
 * 
 * Implements the unified storage interface backed by JSON files in server/data/.
 * Preserves existing atomic write-then-rename and in-process queue mechanisms.
 * Supports optional `dataDir` for test isolation.
 */

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { readJson, writeJson, FILES } = require('../utils/fileDb');
const { ALLOWED_TOPICS } = require('../utils/validators');

function createDefaultProgress() {
  return {
    solvedQuestionIds: [],
    streak: { current: 0, lastActiveDate: null },
    activity: [],
    profile: {
      college: '',
      branch: '',
      graduationYear: '2026',
      targetRole: 'Software Development Engineer',
      weeklyGoal: 5,
      skills: [],
      goals: [],
      theme: 'light'
    }
  };
}

class FileStorageDriver {
  constructor(options = {}) {
    this.name = 'file';
    this.dataDir = options.dataDir || null;
    // User progress mutex queue to ensure atomic sequential updates
    this.progressLocks = new Map();
    this.writeQueues = new Map();
    // User creation mutex to serialize concurrent signups
    this.userCreationLock = Promise.resolve();
  }

  async read(fileName, fallback = null) {
    if (!this.dataDir) {
      return readJson(fileName, fallback);
    }
    const filePath = path.join(this.dataDir, path.basename(fileName));
    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      if (err.code === 'ENOENT') {
        await this.write(fileName, fallback);
        return fallback;
      }
      return fallback;
    }
  }

  async write(fileName, data) {
    if (!this.dataDir) {
      return writeJson(fileName, data);
    }
    await fs.mkdir(this.dataDir, { recursive: true });
    const targetPath = path.join(this.dataDir, path.basename(fileName));
    const tempPath = path.join(
      this.dataDir,
      `.${path.basename(fileName)}.${Date.now()}.${crypto.randomBytes(4).toString('hex')}.tmp`
    );

    let queue = this.writeQueues.get(fileName) || Promise.resolve();
    const task = queue.then(async () => {
      await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      try {
        await fs.rename(tempPath, targetPath);
      } catch (_) {
        await fs.copyFile(tempPath, targetPath);
        await fs.unlink(tempPath).catch(() => {});
      }
    });
    this.writeQueues.set(fileName, task);
    return task;
  }

  async init() {
    // Ensures baseline files exist
    await this.read(FILES.USERS, []);
    await this.read(FILES.QUESTIONS, []);
    await this.read(FILES.MCQ_BANK, []);
    await this.read(FILES.APPLICATIONS, []);
    await this.read(FILES.SOLUTIONS, []);
    await this.read(FILES.MOCK_ATTEMPTS, []);
    await this.read(FILES.PROGRESS, {});
    await this.read(FILES.AVATARS, {});
  }

  getDriverName() {
    return 'file';
  }

  async ping() {
    return true;
  }

  async close() {
    // No-op for file driver
  }

  // --- USERS ---

  async findUserByEmail(email) {
    if (!email) return null;
    const normalized = email.trim().toLowerCase();
    const users = await this.read(FILES.USERS, []);
    return users.find((u) => u.email.toLowerCase() === normalized) || null;
  }

  async findUserById(id) {
    if (!id) return null;
    const users = await this.read(FILES.USERS, []);
    return users.find((u) => u.id === id) || null;
  }

  async listUsers() {
    return this.read(FILES.USERS, []);
  }

  async createUser(userData, initialProgress = null) {
    let release;
    const previousLock = this.userCreationLock;
    this.userCreationLock = new Promise((resolve) => {
      release = resolve;
    });

    try {
      await previousLock;
      const normalizedEmail = userData.email.trim().toLowerCase();
      const users = await this.read(FILES.USERS, []);
      const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (existing) {
        const err = new Error('Email already registered');
        err.code = '23505';
        err.status = 409;
        throw err;
      }

      const newUser = {
        ...userData,
        email: normalizedEmail,
        createdAt: userData.createdAt || new Date().toISOString()
      };

      users.push(newUser);
      await this.write(FILES.USERS, users);

      // Provision progress
      const progressMap = await this.read(FILES.PROGRESS, {});
      progressMap[newUser.id] = initialProgress || {
        solvedQuestionIds: [],
        streak: { current: 0, lastActiveDate: null },
        activity: [
          {
            type: 'account_created',
            text: 'Account created',
            date: new Date().toISOString()
          }
        ],
        profile: {
          skills: [],
          goals: [],
          theme: 'light'
        }
      };
      await this.write(FILES.PROGRESS, progressMap);

      return newUser;
    } finally {
      release();
    }
  }

  // --- QUESTIONS ---

  async listQuestions(filters = {}) {
    const { topic, difficulty, search } = filters;
    let questions = await this.read(FILES.QUESTIONS, []);

    if (topic && topic.trim() !== '') {
      const tLower = topic.trim().toLowerCase();
      questions = questions.filter((q) => q.topic.toLowerCase() === tLower);
    }

    if (difficulty && difficulty.trim() !== '') {
      const dLower = difficulty.trim().toLowerCase();
      questions = questions.filter((q) => q.difficulty.toLowerCase() === dLower);
    }

    if (search && search.trim() !== '') {
      const sLower = search.trim().toLowerCase();
      questions = questions.filter((q) =>
        q.title.toLowerCase().includes(sLower) ||
        (q.description && q.description.toLowerCase().includes(sLower))
      );
    }

    return questions;
  }

  async findQuestionById(id) {
    const questions = await this.read(FILES.QUESTIONS, []);
    return questions.find((q) => q.id === id) || null;
  }

  async createQuestion(questionData) {
    const questions = await this.read(FILES.QUESTIONS, []);
    questions.push(questionData);
    await this.write(FILES.QUESTIONS, questions);
    return questionData;
  }

  async updateQuestion(id, questionData) {
    const questions = await this.read(FILES.QUESTIONS, []);
    const idx = questions.findIndex((q) => q.id === id);
    if (idx === -1) return null;
    questions[idx] = questionData;
    await this.write(FILES.QUESTIONS, questions);
    return questionData;
  }

  async deleteQuestion(id) {
    const questions = await this.read(FILES.QUESTIONS, []);
    const idx = questions.findIndex((q) => q.id === id);
    if (idx === -1) return false;

    questions.splice(idx, 1);
    await this.write(FILES.QUESTIONS, questions);

    // Remove solutions associated with question
    const solutions = await this.read(FILES.SOLUTIONS, []);
    const filteredSolutions = solutions.filter((s) => s.questionId !== id);
    if (filteredSolutions.length !== solutions.length) {
      await this.write(FILES.SOLUTIONS, filteredSolutions);
    }

    return true;
  }

  // --- MCQ BANK ---

  async listMcqs(filters = {}) {
    const { topic, search } = filters;
    let mcqs = await this.read(FILES.MCQ_BANK, []);

    if (topic && topic !== 'All' && topic.trim() !== '') {
      const tLower = topic.trim().toLowerCase();
      mcqs = mcqs.filter((m) => m.topic && m.topic.toLowerCase() === tLower);
    }

    if (search && search.trim() !== '') {
      const sLower = search.trim().toLowerCase();
      mcqs = mcqs.filter((m) => m.question && m.question.toLowerCase().includes(sLower));
    }

    return mcqs;
  }

  async findMcqById(id) {
    const mcqs = await this.read(FILES.MCQ_BANK, []);
    return mcqs.find((m) => m.id === id) || null;
  }

  async createMcq(mcqData) {
    const mcqs = await this.read(FILES.MCQ_BANK, []);
    mcqs.push(mcqData);
    await this.write(FILES.MCQ_BANK, mcqs);
    return mcqData;
  }

  async updateMcq(id, mcqData) {
    const mcqs = await this.read(FILES.MCQ_BANK, []);
    const idx = mcqs.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    mcqs[idx] = mcqData;
    await this.write(FILES.MCQ_BANK, mcqs);
    return mcqData;
  }

  async deleteMcq(id) {
    const mcqs = await this.read(FILES.MCQ_BANK, []);
    const idx = mcqs.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    const [deleted] = mcqs.splice(idx, 1);
    await this.write(FILES.MCQ_BANK, mcqs);
    return deleted;
  }

  async getMcqTopicCounts() {
    const bank = await this.read(FILES.MCQ_BANK, []);
    const counts = {};
    for (const t of ALLOWED_TOPICS) {
      counts[t] = 0;
    }
    for (const q of bank) {
      if (counts[q.topic] !== undefined) {
        counts[q.topic]++;
      }
    }
    return { counts, total: bank.length };
  }

  // --- APPLICATIONS ---

  async listApplications(userId, filters = {}) {
    const { status, search } = filters;
    const all = await this.read(FILES.APPLICATIONS, []);
    let userApps = all.filter((app) => app.userId === userId);

    if (status && status.trim() !== '') {
      const sLower = status.trim().toLowerCase();
      userApps = userApps.filter((app) => app.status && app.status.toLowerCase() === sLower);
    }

    if (search && search.trim() !== '') {
      const query = search.trim().toLowerCase();
      userApps = userApps.filter((app) =>
        (app.company && app.company.toLowerCase().includes(query)) ||
        (app.role && app.role.toLowerCase().includes(query)) ||
        (app.location && app.location.toLowerCase().includes(query)) ||
        (app.notes && app.notes.toLowerCase().includes(query))
      );
    }

    userApps.sort((a, b) => new Date(b.appliedDate || 0) - new Date(a.appliedDate || 0));
    return userApps;
  }

  async findApplicationById(userId, id) {
    const all = await this.read(FILES.APPLICATIONS, []);
    return all.find((app) => app.id === id && app.userId === userId) || null;
  }

  async createApplication(applicationData) {
    const all = await this.read(FILES.APPLICATIONS, []);
    all.push(applicationData);
    await this.write(FILES.APPLICATIONS, all);
    return applicationData;
  }

  async updateApplication(userId, id, applicationData) {
    const all = await this.read(FILES.APPLICATIONS, []);
    const idx = all.findIndex((app) => app.id === id && app.userId === userId);
    if (idx === -1) return null;
    all[idx] = applicationData;
    await this.write(FILES.APPLICATIONS, all);
    return applicationData;
  }

  async deleteApplication(userId, id) {
    const all = await this.read(FILES.APPLICATIONS, []);
    const idx = all.findIndex((app) => app.id === id && app.userId === userId);
    if (idx === -1) return false;
    all.splice(idx, 1);
    await this.write(FILES.APPLICATIONS, all);
    return true;
  }

  // --- SOLUTIONS ---

  async listSolutions(userId) {
    const solutions = await this.read(FILES.SOLUTIONS, []);
    return solutions
      .filter((s) => s.userId === userId)
      .map((s) => ({
        questionId: s.questionId,
        language: s.language,
        updatedAt: s.updatedAt
      }));
  }

  async findSolutionsByQuestion(userId, questionId) {
    const solutions = await this.read(FILES.SOLUTIONS, []);
    return solutions
      .filter((s) => s.userId === userId && s.questionId === questionId)
      .map((s) => ({
        id: s.id,
        language: s.language,
        code: s.code,
        updatedAt: s.updatedAt
      }));
  }

  async saveSolution(userId, questionId, { language, code }) {
    const solutions = await this.read(FILES.SOLUTIONS, []);
    const idx = solutions.findIndex(
      (s) => s.userId === userId && s.questionId === questionId && s.language === language
    );

    const now = new Date().toISOString();
    let record;

    if (idx >= 0) {
      solutions[idx].code = code;
      solutions[idx].updatedAt = now;
      record = solutions[idx];
    } else {
      record = {
        id: crypto.randomUUID(),
        userId,
        questionId,
        language,
        code,
        updatedAt: now
      };
      solutions.push(record);
    }

    await this.write(FILES.SOLUTIONS, solutions);
    return {
      id: record.id,
      questionId: record.questionId,
      language: record.language,
      code: record.code,
      updatedAt: record.updatedAt
    };
  }

  async deleteSolution(userId, questionId, language = null) {
    const solutions = await this.read(FILES.SOLUTIONS, []);
    const filtered = solutions.filter((s) => {
      if (s.userId !== userId || s.questionId !== questionId) return true;
      if (language && s.language !== language) return true;
      return false;
    });
    await this.write(FILES.SOLUTIONS, filtered);
    return true;
  }

  // --- MOCK ATTEMPTS ---

  async createAttempt(attemptData) {
    const all = await this.read(FILES.MOCK_ATTEMPTS, []);
    all.push(attemptData);

    // Snapshot retention policy: keep full question reviews for user's latest 50 attempts
    const userAttempts = all.filter((a) => a.userId === attemptData.userId);
    userAttempts.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    if (userAttempts.length > 50) {
      for (let i = 50; i < userAttempts.length; i++) {
        delete userAttempts[i].reviews;
      }
    }

    await this.write(FILES.MOCK_ATTEMPTS, all);
    return attemptData;
  }

  async listAttempts(userId, pagination = {}) {
    const all = await this.read(FILES.MOCK_ATTEMPTS, []);
    const userAttempts = all.filter((att) => att.userId === userId);
    userAttempts.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    function toSummary(att) {
      return {
        id: att.id,
        topic: att.topic || 'Mixed',
        score: att.score,
        total: att.total,
        accuracy: att.accuracy,
        date: att.date,
        timeTaken: att.timeTaken || 0,
        topicBreakdown: att.topicBreakdown || null,
        hasSnapshot: Array.isArray(att.reviews) && att.reviews.length > 0
      };
    }

    if (pagination.page !== undefined || pagination.limit !== undefined) {
      const page = Math.max(1, parseInt(pagination.page, 10) || 1);
      const limit = Math.max(1, Math.min(50, parseInt(pagination.limit, 10) || 10));
      const total = userAttempts.length;
      const totalPages = Math.ceil(total / limit) || 1;
      const startIndex = (page - 1) * limit;
      const paginated = userAttempts.slice(startIndex, startIndex + limit);

      return {
        attempts: paginated.map(toSummary),
        total,
        page,
        totalPages,
        limit
      };
    }

    return userAttempts.map(toSummary);
  }

  async findAttemptById(userId, id) {
    const all = await this.read(FILES.MOCK_ATTEMPTS, []);
    const att = all.find((a) => a.id === id);
    if (!att || att.userId !== userId) return null;
    return att;
  }

  // --- PROGRESS ---

  async getProgress(userId) {
    const map = await this.read(FILES.PROGRESS, {});
    const data = map[userId] || createDefaultProgress();
    data.profile = {
      college: '',
      branch: '',
      graduationYear: '2026',
      targetRole: 'Software Development Engineer',
      weeklyGoal: 5,
      skills: [],
      goals: [],
      theme: 'light',
      ...(data.profile || {})
    };
    return data;
  }

  async atomicUpdateProgress(userId, updaterFn) {
    // Acquire mutex promise for this user
    let lock = this.progressLocks.get(userId) || Promise.resolve();

    const task = lock
      .catch(() => {})
      .then(async () => {
        const map = await this.read(FILES.PROGRESS, {});
        const current = map[userId] || createDefaultProgress();
        current.profile = {
          college: '',
          branch: '',
          graduationYear: '2026',
          targetRole: 'Software Development Engineer',
          weeklyGoal: 5,
          skills: [],
          goals: [],
          theme: 'light',
          ...(current.profile || {})
        };

        const updated = await updaterFn(current);
        map[userId] = updated;
        await this.write(FILES.PROGRESS, map);
        return updated;
      });

    this.progressLocks.set(userId, task);
    return task;
  }

  // --- AVATARS ---

  async getAvatar(userId) {
    const avatars = await this.read(FILES.AVATARS, {});
    const record = avatars[userId];
    return record ? record.dataUrl : null;
  }

  async setAvatar(userId, dataUrl) {
    const avatars = await this.read(FILES.AVATARS, {});
    avatars[userId] = {
      dataUrl,
      updatedAt: new Date().toISOString()
    };
    await this.write(FILES.AVATARS, avatars);
    return dataUrl;
  }

  async deleteAvatar(userId) {
    const avatars = await this.read(FILES.AVATARS, {});
    if (avatars[userId]) {
      delete avatars[userId];
      await this.write(FILES.AVATARS, avatars);
    }
    return true;
  }
}

module.exports = FileStorageDriver;
