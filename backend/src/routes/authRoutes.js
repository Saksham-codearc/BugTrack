const express = require('express');
const rateLimit = require('express-rate-limit');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  register,
  login,
  getMe,
  updateMe,
  changePassword,
} = require('../controllers/authController');
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} = require('../validation/schemas');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again in a few minutes.' },
});

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);

router.use(protect);
router.get('/me', getMe);
router.patch('/me', validate(updateProfileSchema), updateMe);
router.patch('/password', validate(changePasswordSchema), changePassword);

module.exports = router;
