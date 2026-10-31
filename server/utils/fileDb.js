/**
 * DevPrep - File Database Persistence Engine (`fileDb.js`)
 * 
 * Concepts explained:
 * 1. JSON Persistence: Using plain JSON files instead of external databases.
 * 2. Atomic Writes (Temp + Rename): Writing to a temporary file first and renaming it
 *    (`fs.rename`) ensures that files are never left half-written if a crash occurs.
 * 3. Windows & Antivirus Lock Handling: On Windows, background services (OneDrive,
 *    antivirus, search indexer) momentarily inspect freshly written files. If `rename`
 *    encounters a transient lock (EPERM / EBUSY), we retry with a brief backoff and
 *    fall back to `copyFile` + `unlink` to guarantee persistence without failure.
 * 4. Write Queue (Promise Chain): A per-file Promise queue serializes writes so that
 *    concurrent requests write in orderly sequence rather than colliding.
 * 5. Safe Recovery: Missing files are created with fallback data; corrupted files return
 *    fallback data without crashing the server.
 * 6. Hardcoded Constants: Filenames are restricted to a fixed list to prevent path traversal.
 */

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

// Data directory path
const DATA_DIR = path.join(__dirname, '..', 'data');

// Fixed file constants to prevent path injection
const FILES = Object.freeze({
  QUESTIONS: 'questions.json',
  APPLICATIONS: 'applications.json',
  PROGRESS: 'progress.json',
  MOCK_TESTS: 'mockTests.json',
  MCQ_BANK: 'mcqBank.json',
  MOCK_ATTEMPTS: 'mockAttempts.json',
  USERS: 'users.json',
  SOLUTIONS: 'solutions.json',
  AVATARS: 'avatars.json'
});

// A map storing the latest Promise in each file's write queue
// Key: fileName (e.g. 'users.json'), Value: Promise<void>
const writeQueues = new Map();

/**
 * Resolves safe absolute path to a data file inside server/data/
 */
function resolvePath(fileName) {
  const sanitized = path.basename(fileName);
  return path.join(DATA_DIR, sanitized);
}

/**
 * Atomically renames a temp file to the target path.
 * Handles Windows transient file-locking (OneDrive, antivirus scanners) with retries.
 */
async function atomicRenameWithRetry(tempPath, targetPath, maxAttempts = 6, baseDelayMs = 20) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await fs.rename(tempPath, targetPath);
      return;
    } catch (err) {
      const isLockError = err.code === 'EPERM' || err.code === 'EBUSY' || err.code === 'EACCES';
      if (isLockError && attempt < maxAttempts - 1) {
        // Wait briefly for the lock to release (20ms, 40ms, 60ms...)
        await new Promise((res) => setTimeout(res, baseDelayMs * (attempt + 1)));
      } else {
        // Fallback: copy file over destination then remove temp file
        try {
          await fs.copyFile(tempPath, targetPath);
          await fs.unlink(tempPath);
          return;
        } catch (_) {
          throw err;
        }
      }
    }
  }
}

/**
 * Reads and parses a JSON file.
 * If the file does not exist, it creates the file with `fallback` and returns `fallback`.
 * If the file contains malformed JSON, it logs the error and returns `fallback` without crashing.
 * 
 * @param {string} fileName - Name of the file inside server/data/
 * @param {*} fallback - Default value if file is missing or corrupted
 * @returns {Promise<*>} The parsed JSON data
 */
async function readJson(fileName, fallback = null) {
  const filePath = resolvePath(fileName);

  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File does not exist yet: create it with the fallback value
      await writeJson(fileName, fallback);
      return fallback;
    }

    if (error instanceof SyntaxError) {
      // Malformed JSON syntax inside file: log and recover safely
      console.error(`[fileDb] Corrupted JSON in file "${fileName}":`, error.message);
      return fallback;
    }

    // Unexpected read error
    console.error(`[fileDb] Unexpected error reading file "${fileName}":`, error);
    throw error;
  }
}

/**
 * Writes data to a JSON file safely using an atomic write-then-rename strategy
 * and a per-file Promise queue.
 * 
 * @param {string} fileName - Name of the file inside server/data/
 * @param {*} data - Data to serialize and save
 * @returns {Promise<void>}
 */
async function writeJson(fileName, data) {
  const filePath = resolvePath(fileName);
  const tempPath = `${filePath}.${crypto.randomUUID()}.tmp`;

  // Ensure data directory exists
  await fs.mkdir(DATA_DIR, { recursive: true });

  // Get current queue for this file, or start with an immediately resolved Promise
  const currentQueue = writeQueues.get(fileName) || Promise.resolve();

  // Create a new task in the queue
  const writeTask = currentQueue
    .catch(() => {
      // Don't let a prior failure break future queued writes
    })
    .then(async () => {
      const jsonString = JSON.stringify(data, null, 2);

      try {
        // 1. Write data to temporary file
        await fs.writeFile(tempPath, jsonString, 'utf-8');
        // 2. Atomically rename temporary file to target file (with Windows retry)
        await atomicRenameWithRetry(tempPath, filePath);
      } catch (err) {
        // Clean up temp file if something went wrong
        try {
          await fs.unlink(tempPath);
        } catch (_) {
          // Ignore temp cleanup errors
        }
        console.error(`[fileDb] Write failed for "${fileName}":`, err.message);
        throw err;
      }
    });

  // Update the queue map with the new tail Promise
  writeQueues.set(fileName, writeTask);

  return writeTask;
}

module.exports = {
  FILES,
  readJson,
  writeJson
};
