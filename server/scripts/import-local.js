/**
 * DevPrep - Local JSON Data to Postgres Importer (`import-local.js`)
 * 
 * Copies local server/data/*.json records into PostgreSQL.
 * 
 * Safety & Privacy Invariants:
 * 1. Requires explicit `--confirm` flag to execute.
 * 2. Checks each record before insertion; skips existing records (never overwrites or deletes).
 * 3. Preserves user password hashes intact.
 * 4. Prints ONLY record counts; never prints passwords, emails, names, or connection strings.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { PostgresStorageDriver } = require('../storage');

function readLocalJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Warning: Could not parse "${filePath}":`, err.message);
    return fallback;
  }
}

async function runImport() {
  const args = process.argv.slice(2);
  if (!args.includes('--confirm')) {
    console.error('\n❌ Confirmation required. Please run with: npm run import-local -- --confirm\n');
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('\n❌ Error: DATABASE_URL environment variable is required to import local data into Postgres.\n');
    process.exit(1);
  }

  const storage = new PostgresStorageDriver({ connectionString });
  await storage.init();
  const pool = storage.pool;

  const DATA_DIR = path.join(__dirname, '..', 'data');
  const usersPath = path.join(DATA_DIR, 'users.json');
  const progressPath = path.join(DATA_DIR, 'progress.json');
  const questionsPath = path.join(DATA_DIR, 'questions.json');
  const mcqsPath = path.join(DATA_DIR, 'mcqBank.json');
  const applicationsPath = path.join(DATA_DIR, 'applications.json');
  const solutionsPath = path.join(DATA_DIR, 'solutions.json');
  const attemptsPath = path.join(DATA_DIR, 'mockAttempts.json');
  const avatarsPath = path.join(DATA_DIR, 'avatars.json');

  console.log('--- Starting Local Data Migration to Postgres ---');

  // 1. Users
  const users = readLocalJson(usersPath, []);
  let usersImported = 0;
  let usersSkipped = 0;
  for (const u of users) {
    if (!u.id || !u.email) continue;
    const existing = await pool.query(
      'SELECT id FROM users WHERE id = $1 OR LOWER(email) = LOWER($2) LIMIT 1',
      [u.id, u.email]
    );
    if (existing.rows.length > 0) {
      usersSkipped++;
    } else {
      await pool.query(
        `INSERT INTO users (id, email, password_hash, role, data, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          u.id,
          u.email.trim().toLowerCase(),
          u.passwordHash || '',
          u.role || 'user',
          JSON.stringify(u),
          u.createdAt ? new Date(u.createdAt) : new Date()
        ]
      );
      usersImported++;
    }
  }

  // 2. User Progress
  const progressMap = readLocalJson(progressPath, {});
  let progressImported = 0;
  let progressSkipped = 0;
  for (const [userId, progData] of Object.entries(progressMap)) {
    const userExists = await pool.query('SELECT id FROM users WHERE id = $1 LIMIT 1', [userId]);
    if (userExists.rows.length === 0) {
      progressSkipped++;
      continue;
    }
    const existing = await pool.query('SELECT user_id FROM progress WHERE user_id = $1 LIMIT 1', [userId]);
    if (existing.rows.length > 0) {
      progressSkipped++;
    } else {
      await pool.query(
        `INSERT INTO progress (user_id, data, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())`,
        [userId, JSON.stringify(progData)]
      );
      progressImported++;
    }
  }

  // 3. DSA Questions
  const questions = readLocalJson(questionsPath, []);
  let questionsImported = 0;
  let questionsSkipped = 0;
  for (const q of questions) {
    if (!q.id) continue;
    const existing = await pool.query('SELECT id FROM questions WHERE id = $1 LIMIT 1', [q.id]);
    if (existing.rows.length > 0) {
      questionsSkipped++;
    } else {
      await pool.query(
        `INSERT INTO questions (id, title, topic, difficulty, data, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [q.id, q.title, q.topic, q.difficulty, JSON.stringify(q)]
      );
      questionsImported++;
    }
  }

  // 4. MCQ Question Bank
  const mcqs = readLocalJson(mcqsPath, []);
  let mcqsImported = 0;
  let mcqsSkipped = 0;
  for (const m of mcqs) {
    if (!m.id) continue;
    const existing = await pool.query('SELECT id FROM mcq_bank WHERE id = $1 LIMIT 1', [m.id]);
    if (existing.rows.length > 0) {
      mcqsSkipped++;
    } else {
      await pool.query(
        `INSERT INTO mcq_bank (id, topic, question, data, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())`,
        [m.id, m.topic, m.question, JSON.stringify(m)]
      );
      mcqsImported++;
    }
  }

  // 5. Applications
  const applications = readLocalJson(applicationsPath, []);
  let appsImported = 0;
  let appsSkipped = 0;
  for (const app of applications) {
    if (!app.id || !app.userId) continue;
    const userExists = await pool.query('SELECT id FROM users WHERE id = $1 LIMIT 1', [app.userId]);
    if (userExists.rows.length === 0) {
      appsSkipped++;
      continue;
    }
    const existing = await pool.query('SELECT id FROM applications WHERE id = $1 LIMIT 1', [app.id]);
    if (existing.rows.length > 0) {
      appsSkipped++;
    } else {
      await pool.query(
        `INSERT INTO applications (id, user_id, company, role, status, data, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [app.id, app.userId, app.company, app.role, app.status, JSON.stringify(app)]
      );
      appsImported++;
    }
  }

  // 6. Solutions
  const solutions = readLocalJson(solutionsPath, []);
  let solutionsImported = 0;
  let solutionsSkipped = 0;
  for (const sol of solutions) {
    if (!sol.id || !sol.userId || !sol.questionId) continue;
    const userExists = await pool.query('SELECT id FROM users WHERE id = $1 LIMIT 1', [sol.userId]);
    if (userExists.rows.length === 0) {
      solutionsSkipped++;
      continue;
    }
    const existing = await pool.query(
      'SELECT id FROM solutions WHERE id = $1 OR (user_id = $2 AND question_id = $3 AND language = $4) LIMIT 1',
      [sol.id, sol.userId, sol.questionId, sol.language || 'JavaScript']
    );
    if (existing.rows.length > 0) {
      solutionsSkipped++;
    } else {
      await pool.query(
        `INSERT INTO solutions (id, user_id, question_id, language, data, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [sol.id, sol.userId, sol.questionId, sol.language || 'JavaScript', JSON.stringify(sol)]
      );
      solutionsImported++;
    }
  }

  // 7. Mock Test Attempts
  const attempts = readLocalJson(attemptsPath, []);
  let attemptsImported = 0;
  let attemptsSkipped = 0;
  for (const att of attempts) {
    if (!att.id || !att.userId) continue;
    const userExists = await pool.query('SELECT id FROM users WHERE id = $1 LIMIT 1', [att.userId]);
    if (userExists.rows.length === 0) {
      attemptsSkipped++;
      continue;
    }
    const existing = await pool.query('SELECT id FROM mock_attempts WHERE id = $1 LIMIT 1', [att.id]);
    if (existing.rows.length > 0) {
      attemptsSkipped++;
    } else {
      await pool.query(
        `INSERT INTO mock_attempts (id, user_id, topic, date, data, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [att.id, att.userId, att.topic || 'Mixed', att.date ? new Date(att.date) : new Date(), JSON.stringify(att)]
      );
      attemptsImported++;
    }
  }

  // 8. Avatars
  const avatars = readLocalJson(avatarsPath, {});
  let avatarsImported = 0;
  let avatarsSkipped = 0;
  for (const [userId, avData] of Object.entries(avatars)) {
    const dataUrl = typeof avData === 'string' ? avData : (avData?.dataUrl || null);
    if (!dataUrl) continue;
    const userExists = await pool.query('SELECT id FROM users WHERE id = $1 LIMIT 1', [userId]);
    if (userExists.rows.length === 0) {
      avatarsSkipped++;
      continue;
    }
    const existing = await pool.query('SELECT user_id FROM avatars WHERE user_id = $1 LIMIT 1', [userId]);
    if (existing.rows.length > 0) {
      avatarsSkipped++;
    } else {
      const dataObj = typeof avData === 'object' ? avData : { dataUrl, updatedAt: new Date().toISOString() };
      await pool.query(
        `INSERT INTO avatars (user_id, data_url, data, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [userId, dataUrl, JSON.stringify(dataObj)]
      );
      avatarsImported++;
    }
  }

  console.log('\n--- DevPrep Local Data Import Summary ---');
  console.log(`Users: imported ${usersImported}, skipped ${usersSkipped}`);
  console.log(`Progress: imported ${progressImported}, skipped ${progressSkipped}`);
  console.log(`Questions: imported ${questionsImported}, skipped ${questionsSkipped}`);
  console.log(`MCQs: imported ${mcqsImported}, skipped ${mcqsSkipped}`);
  console.log(`Applications: imported ${appsImported}, skipped ${appsSkipped}`);
  console.log(`Solutions: imported ${solutionsImported}, skipped ${solutionsSkipped}`);
  console.log(`Mock Attempts: imported ${attemptsImported}, skipped ${attemptsSkipped}`);
  console.log(`Avatars: imported ${avatarsImported}, skipped ${avatarsSkipped}`);
  console.log('Import completed successfully. ✓\n');

  await storage.close();
}

runImport().catch((err) => {
  console.error('\n❌ Import failed:', err.message || err);
  process.exit(1);
});
