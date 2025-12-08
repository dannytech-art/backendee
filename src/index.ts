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

const parseList = (value?: string) =>
  value
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

const wildcardToRegex = (pattern: string) => {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`, 'i');
};

const rawAllowedOrigins = [
  ...parseList(process.env.CORS_ORIGIN),
  ...parseList(process.env.CORS_ORIGINS),
  ...parseList(process.env.CLIENT_URL),
  ...parseList(process.env.FRONTEND_URL),
  ...parseList(process.env.ALLOWED_ORIGINS),
  'https://election-engagement.vercel.app',
  'https://*.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

const uniqueOrigins = Array.from(new Set(rawAllowedOrigins));
const wildcardOrigins = uniqueOrigins.filter((origin) => origin.includes('*'));
const concreteOrigins = uniqueOrigins.filter((origin) => !origin.includes('*'));
const wildcardPatterns = wildcardOrigins.map(wildcardToRegex);
const normalizedConcreteOrigins = concreteOrigins.map((origin) => origin.toLowerCase());
const allowAllOrigins = ['true', '1', 'yes'].includes(
  (process.env.CORS_ALLOW_ALL ?? '').trim().toLowerCase(),
);

const isAllowedOrigin = (origin: string) =>
  normalizedConcreteOrigins.includes(origin.toLowerCase()) ||
  wildcardPatterns.some((pattern) => pattern.test(origin));

const defaultAllowedHeaders = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'Accept',
  'Origin',
  'X-Client-Info',
  'apikey',
];

const allowedHeaders = Array.from(new Set([...defaultAllowedHeaders, ...parseList(process.env.CORS_ALLOWED_HEADERS)]));

app.use(
  cors({
    origin: (origin, callback) => {
      if (allowAllOrigins || !origin || isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Blocked origin: ${origin}`);
        callback(new Error('CORS blocked'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders,
  }),
);

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

