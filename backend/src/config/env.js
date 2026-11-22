const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const toBool = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clientUrls = String(process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((url) => url.trim().replace(/\/$/, ''))
  .filter(Boolean);

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 5000),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bugtracker',
  jwtSecret: process.env.JWT_SECRET || 'bugtrack-insecure-dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrls,
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxFileSizeMb: toInt(process.env.MAX_FILE_SIZE_MB, 5),
  autoSeed: toBool(process.env.AUTO_SEED, false),
  useMemoryDb: toBool(process.env.USE_MEMORY_DB, false),
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
};

if (env.isProduction && env.jwtSecret === 'bugtrack-insecure-dev-secret') {
  // Fail fast rather than shipping a known secret.
  throw new Error('JWT_SECRET must be set to a strong value in production.');
}

module.exports = { env };
