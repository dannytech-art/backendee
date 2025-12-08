import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './routes/auth';
import countriesRoutes from './routes/countries';
import electionsRoutes from './routes/elections';
import candidatesRoutes from './routes/candidates';
import votesRoutes from './routes/votes';
import newsRoutes from './routes/news';
import commentsRoutes from './routes/comments';
import chatRoutes from './routes/chat';
import settingsRoutes from './routes/settings';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const defaultAllowedOrigins = [
  'https://election-engagement.vercel.app',
  'http://localhost:5173',
];

const envAllowedOrigins = (process.env.CORS_ORIGIN || process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOriginPatterns = envAllowedOrigins.length ? envAllowedOrigins : defaultAllowedOrigins;
const allowAllOrigins = allowedOriginPatterns.includes('*');

const escapeForRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const patternToRegex = (pattern: string) => new RegExp(`^${escapeForRegex(pattern).replace(/\\\*/g, '.*')}$`);

const originMatchers = allowedOriginPatterns
  .filter((pattern) => pattern !== '*')
  .map((pattern) => ({
    pattern,
    regex: pattern.includes('*') ? patternToRegex(pattern) : null,
  }));

const isOriginAllowed = (origin: string) => originMatchers.some(({ pattern, regex }) => {
  if (regex) {
    return regex.test(origin);
  }
  return pattern === origin;
});

if (process.env.NODE_ENV !== 'production') {
  console.log('[CORS] Allowed origins:', allowAllOrigins ? ['*'] : allowedOriginPatterns);
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowAllOrigins || isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Increase body size limit for large content (news articles, comments, etc.)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/countries', countriesRoutes);
app.use('/api/elections', electionsRoutes);
app.use('/api/candidates', candidatesRoutes);
app.use('/api/votes', votesRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/settings', settingsRoutes);

// Test route (remove in production)
if (process.env.NODE_ENV === 'development') {
  const testAuthRoutes = require('./routes/test-auth').default;
  app.use('/api/test-auth', testAuthRoutes);
}

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

