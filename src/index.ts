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
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
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

