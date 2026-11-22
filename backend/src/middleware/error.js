const multer = require('multer');
const { env } = require('../config/env');

const notFound = (req, _res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong on the server.';
  let errors = err.errors;

  if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = `Each attachment must be smaller than ${env.maxFileSizeMb} MB.`;
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'You can upload up to 3 attachments at a time.';
    } else {
      message = err.field || 'File upload failed.';
    }
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Some fields are invalid.';
    errors = Object.values(err.errors).map((item) => ({
      field: item.path,
      message: item.message,
    }));
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid identifier supplied.';
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `That ${field} is already in use.`;
  }

  if (statusCode >= 500 && !env.isProduction) {
    console.error('💥', err);
  }

  res.status(statusCode).json({
    message,
    ...(errors ? { errors } : {}),
    ...(env.isProduction ? {} : { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
