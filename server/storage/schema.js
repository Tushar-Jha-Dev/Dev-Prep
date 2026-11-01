/**
 * DevPrep - PostgreSQL Schema Definition & Migration Runner
 * 
 * Provides idempotent creation of all required tables and indices for Neon Postgres.
 * Safe to run repeatedly at startup or via migration scripts.
 */

const SCHEMA_SQL = `
-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'user',
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_lower_email ON users (LOWER(email));

-- 2. DSA Questions Table
CREATE TABLE IF NOT EXISTS questions (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  topic VARCHAR(64) NOT NULL,
  difficulty VARCHAR(32) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions (topic);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions (difficulty);

-- 3. Mock Test MCQ Question Bank Table
CREATE TABLE IF NOT EXISTS mcq_bank (
  id VARCHAR(64) PRIMARY KEY,
  topic VARCHAR(64) NOT NULL,
  question TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mcq_bank_topic ON mcq_bank (topic);

-- 4. Job & Internship Applications Table
CREATE TABLE IF NOT EXISTS applications (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  status VARCHAR(64) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications (user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications (status);

-- 5. Saved Solutions (My Solution Notepad) Table
CREATE TABLE IF NOT EXISTS solutions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id VARCHAR(64) NOT NULL,
  language VARCHAR(32) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_solutions_user_question_lang ON solutions (user_id, question_id, language);
CREATE INDEX IF NOT EXISTS idx_solutions_user_id ON solutions (user_id);

-- 6. Mock Test Attempts Table
CREATE TABLE IF NOT EXISTS mock_attempts (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic VARCHAR(64) NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mock_attempts_user_id ON mock_attempts (user_id);
CREATE INDEX IF NOT EXISTS idx_mock_attempts_user_date ON mock_attempts (user_id, date DESC);

-- 7. User Progress (One row per user)
CREATE TABLE IF NOT EXISTS progress (
  user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. User Avatars (One row per user)
CREATE TABLE IF NOT EXISTS avatars (
  user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data_url TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

/**
 * Runs all idempotent table and index creation statements against a pool or client.
 */
async function runMigrations(clientOrPool) {
  await clientOrPool.query(SCHEMA_SQL);
}

module.exports = {
  SCHEMA_SQL,
  runMigrations
};
