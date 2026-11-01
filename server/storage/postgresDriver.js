/**
 * DevPrep - PostgreSQL Storage Driver (`postgresDriver.js`)
 * 
 * Implements the unified storage interface backed by Neon PostgreSQL on Vercel Serverless.
 * Concurrency features:
 * - Row locks (`SELECT ... FOR UPDATE`) and ACID transactions for atomic multi-step updates
 * - Parameterized queries for SQL injection immunity
 * - Unique index on `lower(email)` for conflict-free concurrent signups
 * - Single-statement upserts (`ON CONFLICT ... DO UPDATE`)
 * - Snapshot retention trimming inside transaction
 */

const crypto = require('crypto');
const { Pool } = require('@neondatabase/serverless');
const { runMigrations } = require('./schema');
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

class PostgresStorageDriver {
  constructor(options = {}) {
    this.name = 'postgres';
    this.connectionString = options.connectionString || process.env.DATABASE_URL;

    if (!this.connectionString) {
      throw new Error(
        'Postgres storage driver selected, but DATABASE_URL environment variable is missing'
      );
    }

    // Reusable serverless pool
    this.pool = new Pool({
      connectionString: this.connectionString,
      max: options.max || 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });

    this.migrated = false;
  }

  async init() {
    if (!this.migrated) {
      await runMigrations(this.pool);
      this.migrated = true;
    }
  }

  getDriverName() {
    return 'postgres';
  }

  async ping() {
    try {
      const res = await this.pool.query('SELECT 1 AS alive');
      return res.rows[0]?.alive === 1;
    } catch (_) {
      return false;
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
    }
  }

  // --- USERS ---

  async findUserByEmail(email) {
    if (!email) return null;
    await this.init();
    const normalized = email.trim().toLowerCase();
    const res = await this.pool.query(
      `SELECT id, email, password_hash AS "passwordHash", role, data, created_at AS "createdAt"
       FROM users
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [normalized]
    );

    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      ...(row.data || {}),
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      role: row.role,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : row.data?.createdAt
    };
  }

  async findUserById(id) {
    if (!id) return null;
    await this.init();
    const res = await this.pool.query(
      `SELECT id, email, password_hash AS "passwordHash", role, data, created_at AS "createdAt"
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      ...(row.data || {}),
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      role: row.role,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : row.data?.createdAt
    };
  }

  async listUsers() {
    await this.init();
    const res = await this.pool.query(
      `SELECT id, email, password_hash AS "passwordHash", role, data, created_at AS "createdAt"
       FROM users
       ORDER BY created_at ASC`
    );

    return res.rows.map((row) => ({
      ...(row.data || {}),
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      role: row.role,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : row.data?.createdAt
    }));
  }

  async createUser(userData, initialProgress = null) {
    await this.init();
    const normalizedEmail = userData.email.trim().toLowerCase();
    const id = userData.id || crypto.randomUUID();
    const createdAt = userData.createdAt || new Date().toISOString();
    const role = userData.role || 'user';
    const name = (userData.name || '').trim();

    const cleanUser = {
      id,
      name,
      email: normalizedEmail,
      role,
      createdAt
    };

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Check duplicate email
      const existing = await client.query(
        'SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
        [normalizedEmail]
      );
      if (existing.rows.length > 0) {
        const err = new Error('Email already registered');
        err.code = '23505';
        err.status = 409;
        throw err;
      }

      await client.query(
        `INSERT INTO users (id, email, password_hash, role, data, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          id,
          normalizedEmail,
          userData.passwordHash,
          role,
          JSON.stringify(cleanUser),
          createdAt
        ]
      );

      // Provision initial user progress record
      const progressData = initialProgress || {
        solvedQuestionIds: [],
        streak: { current: 0, lastActiveDate: null },
        activity: [
          {
            type: 'account_created',
            text: 'Account created',
            date: createdAt
          }
        ],
        profile: {
          skills: [],
          goals: [],
          theme: 'light'
        }
      };

      await client.query(
        `INSERT INTO progress (user_id, data, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())
         ON CONFLICT (user_id) DO NOTHING`,
        [id, JSON.stringify(progressData)]
      );

      await client.query('COMMIT');
      return {
        ...cleanUser,
        passwordHash: userData.passwordHash
      };
    } catch (err) {
      await client.query('ROLLBACK');
      if (err.code === '23505') {
        const conflictErr = new Error('Email already registered');
        conflictErr.code = '23505';
        conflictErr.status = 409;
        throw conflictErr;
      }
      throw err;
    } finally {
      client.release();
    }
  }

  // --- QUESTIONS ---

  async listQuestions(filters = {}) {
    await this.init();
    const { topic, difficulty, search } = filters;
    const conditions = [];
    const params = [];

    if (topic && topic.trim() !== '') {
      params.push(topic.trim().toLowerCase());
      conditions.push(`LOWER(topic) = $${params.length}`);
    }

    if (difficulty && difficulty.trim() !== '') {
      params.push(difficulty.trim().toLowerCase());
      conditions.push(`LOWER(difficulty) = $${params.length}`);
    }

    if (search && search.trim() !== '') {
      params.push(`%${search.trim().toLowerCase()}%`);
      const pIdx = params.length;
      conditions.push(`(LOWER(title) LIKE $${pIdx} OR LOWER(data->>'description') LIKE $${pIdx})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `SELECT data FROM questions ${whereClause} ORDER BY created_at ASC`;
    const res = await this.pool.query(query, params);
    return res.rows.map((r) => r.data);
  }

  async findQuestionById(id) {
    if (!id) return null;
    await this.init();
    const res = await this.pool.query('SELECT data FROM questions WHERE id = $1 LIMIT 1', [id]);
    return res.rows[0]?.data || null;
  }

  async createQuestion(questionData) {
    await this.init();
    await this.pool.query(
      `INSERT INTO questions (id, title, topic, difficulty, data, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE
       SET title = $2, topic = $3, difficulty = $4, data = $5, updated_at = NOW()`,
      [
        questionData.id,
        questionData.title,
        questionData.topic,
        questionData.difficulty,
        JSON.stringify(questionData)
      ]
    );
    return questionData;
  }

  async updateQuestion(id, questionData) {
    await this.init();
    const res = await this.pool.query(
      `UPDATE questions
       SET title = $2, topic = $3, difficulty = $4, data = $5, updated_at = NOW()
       WHERE id = $1
       RETURNING data`,
      [
        id,
        questionData.title,
        questionData.topic,
        questionData.difficulty,
        JSON.stringify(questionData)
      ]
    );
    return res.rows[0]?.data || null;
  }

  async deleteQuestion(id) {
    await this.init();
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM solutions WHERE question_id = $1', [id]);
      const res = await client.query('DELETE FROM questions WHERE id = $1', [id]);
      await client.query('COMMIT');
      return res.rowCount > 0;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // --- MCQ BANK ---

  async listMcqs(filters = {}) {
    await this.init();
    const { topic, search } = filters;
    const conditions = [];
    const params = [];

    if (topic && topic !== 'All' && topic.trim() !== '') {
      params.push(topic.trim().toLowerCase());
      conditions.push(`LOWER(topic) = $${params.length}`);
    }

    if (search && search.trim() !== '') {
      params.push(`%${search.trim().toLowerCase()}%`);
      conditions.push(`LOWER(question) LIKE $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `SELECT data FROM mcq_bank ${whereClause} ORDER BY created_at ASC`;
    const res = await this.pool.query(query, params);
    return res.rows.map((r) => r.data);
  }

  async findMcqById(id) {
    if (!id) return null;
    await this.init();
    const res = await this.pool.query('SELECT data FROM mcq_bank WHERE id = $1 LIMIT 1', [id]);
    return res.rows[0]?.data || null;
  }

  async createMcq(mcqData) {
    await this.init();
    await this.pool.query(
      `INSERT INTO mcq_bank (id, topic, question, data, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE
       SET topic = $2, question = $3, data = $4, updated_at = NOW()`,
      [
        mcqData.id,
        mcqData.topic,
        mcqData.question,
        JSON.stringify(mcqData)
      ]
    );
    return mcqData;
  }

  async updateMcq(id, mcqData) {
    await this.init();
    const res = await this.pool.query(
      `UPDATE mcq_bank
       SET topic = $2, question = $3, data = $4, updated_at = NOW()
       WHERE id = $1
       RETURNING data`,
      [
        id,
        mcqData.topic,
        mcqData.question,
        JSON.stringify(mcqData)
      ]
    );
    return res.rows[0]?.data || null;
  }

  async deleteMcq(id) {
    await this.init();
    const res = await this.pool.query(
      'DELETE FROM mcq_bank WHERE id = $1 RETURNING data',
      [id]
    );
    return res.rows[0]?.data || null;
  }

  async getMcqTopicCounts() {
    await this.init();
    const res = await this.pool.query(
      'SELECT topic, COUNT(*)::int AS count FROM mcq_bank GROUP BY topic'
    );
    const counts = {};
    for (const t of ALLOWED_TOPICS) {
      counts[t] = 0;
    }
    let total = 0;
    for (const r of res.rows) {
      if (counts[r.topic] !== undefined) {
        counts[r.topic] = r.count;
      }
      total += r.count;
    }
    return { counts, total };
  }

  // --- APPLICATIONS ---

  async listApplications(userId, filters = {}) {
    await this.init();
    const { status, search } = filters;
    const conditions = ['user_id = $1'];
    const params = [userId];

    if (status && status.trim() !== '') {
      params.push(status.trim().toLowerCase());
      conditions.push(`LOWER(status) = $${params.length}`);
    }

    if (search && search.trim() !== '') {
      params.push(`%${search.trim().toLowerCase()}%`);
      const pIdx = params.length;
      conditions.push(
        `(LOWER(company) LIKE $${pIdx} OR LOWER(role) LIKE $${pIdx} OR LOWER(data->>'location') LIKE $${pIdx} OR LOWER(data->>'notes') LIKE $${pIdx})`
      );
    }

    const query = `
      SELECT data FROM applications
      WHERE ${conditions.join(' AND ')}
      ORDER BY (data->>'appliedDate') DESC NULLS LAST, created_at DESC
    `;
    const res = await this.pool.query(query, params);
    return res.rows.map((r) => r.data);
  }

  async findApplicationById(userId, id) {
    await this.init();
    const res = await this.pool.query(
      'SELECT data FROM applications WHERE id = $1 AND user_id = $2 LIMIT 1',
      [id, userId]
    );
    return res.rows[0]?.data || null;
  }

  async createApplication(applicationData) {
    await this.init();
    await this.pool.query(
      `INSERT INTO applications (id, user_id, company, role, status, data, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE
       SET company = $3, role = $4, status = $5, data = $6, updated_at = NOW()`,
      [
        applicationData.id,
        applicationData.userId,
        applicationData.company,
        applicationData.role,
        applicationData.status,
        JSON.stringify(applicationData)
      ]
    );
    return applicationData;
  }

  async updateApplication(userId, id, applicationData) {
    await this.init();
    const res = await this.pool.query(
      `UPDATE applications
       SET company = $3, role = $4, status = $5, data = $6, updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING data`,
      [
        id,
        userId,
        applicationData.company,
        applicationData.role,
        applicationData.status,
        JSON.stringify(applicationData)
      ]
    );
    return res.rows[0]?.data || null;
  }

  async deleteApplication(userId, id) {
    await this.init();
    const res = await this.pool.query(
      'DELETE FROM applications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return res.rowCount > 0;
  }

  // --- SOLUTIONS ---

  async listSolutions(userId) {
    await this.init();
    const res = await this.pool.query(
      `SELECT question_id AS "questionId", language, updated_at AS "updatedAt"
       FROM solutions
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [userId]
    );

    return res.rows.map((r) => ({
      questionId: r.questionId,
      language: r.language,
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString()
    }));
  }

  async findSolutionsByQuestion(userId, questionId) {
    await this.init();
    const res = await this.pool.query(
      `SELECT id, language, data->>'code' AS code, updated_at AS "updatedAt"
       FROM solutions
       WHERE user_id = $1 AND question_id = $2
       ORDER BY updated_at DESC`,
      [userId, questionId]
    );

    return res.rows.map((r) => ({
      id: r.id,
      language: r.language,
      code: r.code || '',
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString()
    }));
  }

  async saveSolution(userId, questionId, { language, code }) {
    await this.init();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const dataObj = {
      id,
      userId,
      questionId,
      language,
      code,
      updatedAt: now
    };

    const res = await this.pool.query(
      `INSERT INTO solutions (id, user_id, question_id, language, data, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (user_id, question_id, language)
       DO UPDATE SET data = $5, updated_at = NOW()
       RETURNING id, question_id AS "questionId", language, data->>'code' AS code, updated_at AS "updatedAt"`,
      [
        id,
        userId,
        questionId,
        language,
        JSON.stringify(dataObj)
      ]
    );

    const row = res.rows[0];
    return {
      id: row.id,
      questionId: row.questionId,
      language: row.language,
      code: row.code,
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : now
    };
  }

  async deleteSolution(userId, questionId, language = null) {
    await this.init();
    if (language) {
      const res = await this.pool.query(
        'DELETE FROM solutions WHERE user_id = $1 AND question_id = $2 AND language = $3',
        [userId, questionId, language]
      );
      return res.rowCount > 0;
    } else {
      const res = await this.pool.query(
        'DELETE FROM solutions WHERE user_id = $1 AND question_id = $2',
        [userId, questionId]
      );
      return res.rowCount > 0;
    }
  }

  // --- MOCK ATTEMPTS ---

  async createAttempt(attemptData) {
    await this.init();
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const dateVal = attemptData.date ? new Date(attemptData.date) : new Date();

      await client.query(
        `INSERT INTO mock_attempts (id, user_id, topic, date, data, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          attemptData.id,
          attemptData.userId,
          attemptData.topic || 'Mixed',
          dateVal,
          JSON.stringify(attemptData)
        ]
      );

      // Snapshot retention policy: keep full question reviews for user's latest 50 attempts
      // Atomically trim reviews property from older attempts
      await client.query(
        `UPDATE mock_attempts
         SET data = data - 'reviews'
         WHERE user_id = $1
           AND id NOT IN (
             SELECT id FROM mock_attempts WHERE user_id = $1 ORDER BY date DESC LIMIT 50
           )
           AND data ? 'reviews'`,
        [attemptData.userId]
      );

      await client.query('COMMIT');
      return attemptData;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async listAttempts(userId, pagination = {}) {
    await this.init();

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
      const offset = (page - 1) * limit;

      const countRes = await this.pool.query(
        'SELECT COUNT(*)::int AS total FROM mock_attempts WHERE user_id = $1',
        [userId]
      );
      const total = countRes.rows[0]?.total || 0;
      const totalPages = Math.ceil(total / limit) || 1;

      const rowsRes = await this.pool.query(
        'SELECT data FROM mock_attempts WHERE user_id = $1 ORDER BY date DESC LIMIT $2 OFFSET $3',
        [userId, limit, offset]
      );

      return {
        attempts: rowsRes.rows.map((r) => toSummary(r.data)),
        total,
        page,
        totalPages,
        limit
      };
    }

    const res = await this.pool.query(
      'SELECT data FROM mock_attempts WHERE user_id = $1 ORDER BY date DESC',
      [userId]
    );
    return res.rows.map((r) => toSummary(r.data));
  }

  async findAttemptById(userId, id) {
    await this.init();
    const res = await this.pool.query(
      'SELECT data FROM mock_attempts WHERE id = $1 AND user_id = $2 LIMIT 1',
      [id, userId]
    );
    return res.rows[0]?.data || null;
  }

  // --- PROGRESS ---

  async getProgress(userId) {
    await this.init();
    const res = await this.pool.query(
      'SELECT data FROM progress WHERE user_id = $1 LIMIT 1',
      [userId]
    );
    const data = res.rows[0]?.data || createDefaultProgress();
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
    await this.init();
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Atomic row lock for user progress
      const selectRes = await client.query(
        'SELECT data FROM progress WHERE user_id = $1 FOR UPDATE',
        [userId]
      );

      let current = selectRes.rows[0]?.data || createDefaultProgress();
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

      await client.query(
        `INSERT INTO progress (user_id, data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id)
         DO UPDATE SET data = $2, updated_at = NOW()`,
        [userId, JSON.stringify(updated)]
      );

      await client.query('COMMIT');
      return updated;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // --- AVATARS ---

  async getAvatar(userId) {
    await this.init();
    const res = await this.pool.query(
      'SELECT data_url FROM avatars WHERE user_id = $1 LIMIT 1',
      [userId]
    );
    return res.rows[0]?.data_url || null;
  }

  async setAvatar(userId, dataUrl) {
    await this.init();
    const dataObj = {
      dataUrl,
      updatedAt: new Date().toISOString()
    };
    await this.pool.query(
      `INSERT INTO avatars (user_id, data_url, data, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET data_url = $2, data = $3, updated_at = NOW()`,
      [userId, dataUrl, JSON.stringify(dataObj)]
    );
    return dataUrl;
  }

  async deleteAvatar(userId) {
    await this.init();
    const res = await this.pool.query(
      'DELETE FROM avatars WHERE user_id = $1',
      [userId]
    );
    return res.rowCount > 0;
  }
}

module.exports = PostgresStorageDriver;
