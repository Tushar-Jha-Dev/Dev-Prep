/**
 * DevPrep - Storage Layer Interface (`storage/index.js`)
 * 
 * Provides unified access to persistence drivers:
 * - 'file': Local JSON file database via server/utils/fileDb.js
 * - 'postgres': Serverless Neon PostgreSQL database via @neondatabase/serverless
 * 
 * Driver Selection:
 * 1. Explicit override via STORAGE_DRIVER ('file' | 'postgres')
 * 2. In production (NODE_ENV === 'production') with DATABASE_URL -> default to 'postgres'
 * 3. Fallback default -> 'file'
 */

const FileStorageDriver = require('./fileDriver');
const PostgresStorageDriver = require('./postgresDriver');

function resolveDriverType() {
  const explicit = (process.env.STORAGE_DRIVER || '').trim().toLowerCase();
  if (explicit === 'postgres') return 'postgres';
  if (explicit === 'file') return 'file';

  // In production with DATABASE_URL, automatically select postgres
  if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
    return 'postgres';
  }

  // Default to local file driver
  return 'file';
}

function createStorage(driverType, options = {}) {
  const type = driverType || resolveDriverType();

  if (type === 'postgres') {
    return new PostgresStorageDriver(options);
  }

  return new FileStorageDriver();
}

// Active singleton instance for server runtime
let activeStorage = null;

function getStorage() {
  if (!activeStorage) {
    activeStorage = createStorage();
  }
  return activeStorage;
}

module.exports = {
  createStorage,
  getStorage,
  resolveDriverType,
  FileStorageDriver,
  PostgresStorageDriver
};
