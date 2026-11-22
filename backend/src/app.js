const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { env } = require('./config/env');
const { uploadRoot } = require('./middleware/upload');
const { notFound, errorHandler } = require('./middleware/error');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const commentRoutes = require('./routes/commentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // curl, Postman, server-to-server
  if (env.clientUrls.includes(origin.replace(/\/$/, ''))) return true;
  if (!env.isProduction && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return true;
  return false;
};

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) return callback(null, true);
      const error = new Error('This origin is not allowed by CORS.');
      error.statusCode = 403;
      return callback(error);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

if (env.nodeEnv !== 'production') {
  app.use(morgan('dev'));
}

// Uploaded screenshots/PDFs are served statically.
app.use(
  '/uploads',
  express.static(uploadRoot, {
    maxAge: '7d',
    fallthrough: true,
  })
);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1500,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down and try again shortly.' },
});
app.use('/api', apiLimiter);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'bugtrack-api',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
