const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const { env } = require('../config/env');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const extractToken = (req) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
};

/** Requires a valid JWT and attaches the full user document to req.user. */
const protect = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw new ApiError(401, 'Authentication required. Please sign in.');

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch (_error) {
    throw new ApiError(401, 'Your session is invalid or has expired. Please sign in again.');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(401, 'This account no longer exists.');

  req.user = user;
  next();
});

module.exports = { protect, extractToken };
