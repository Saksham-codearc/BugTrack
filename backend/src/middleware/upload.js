const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { env } = require('../config/env');

const uploadRoot = path.isAbsolute(env.uploadDir)
  ? env.uploadDir
  : path.resolve(__dirname, '../..', env.uploadDir);

fs.mkdirSync(uploadRoot, { recursive: true });

const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRoot),
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase().slice(0, 12);
    cb(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only images and PDF files are allowed'));
  }
  return cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.maxFileSizeMb * 1024 * 1024,
    files: 3,
  },
});

const uploadRootPath = uploadRoot;

module.exports = { upload, uploadRoot, uploadRootPath };
