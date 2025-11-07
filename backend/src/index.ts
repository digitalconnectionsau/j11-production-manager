import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { cookieParser, csrfProtection, getCsrfToken } from './middleware/csrf.js';

// Load environment variables first
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import roleRoutes from './routes/roles.js';
import projectRoutes from './routes/projects.js';
import clientRoutes from './routes/clients.js';
import jobRoutes from './routes/jobs.js';
import jobStatusRoutes from './routes/jobStatuses.js';
import holidaysRoutes from './routes/holidays.js';
import pinnedRoutes from './routes/pinned.js';
import leadTimesRoutes from './routes/leadTimes.js';
import analyticsRoutes from './routes/analytics.js';
import contactsRoutes from './routes/contacts.js';
import userColumnPreferencesRoutes from './routes/userColumnPreferences.js';
import importRoutes from './routes/import.js';
import auditRoutes from './routes/audit.js';
import loginActivityRoutes from './routes/loginActivity.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Sentry for error tracking (only in production)
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: 0.1, // Capture 10% of transactions
    profilesSampleRate: 0.1, // Profile 10% of sampled transactions
    environment: process.env.NODE_ENV || 'development',
  });
  
  console.log('🔍 Sentry error monitoring enabled');
} else {
  console.log('⚠️  Sentry disabled (set SENTRY_DSN in production)');
}

// Middleware
app.use(helmet());
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://j11-frontend-production.up.railway.app'
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // Add size limit
app.use(express.urlencoded({ limit: '10mb', extended: true })); // Add size limit
app.use(cookieParser()); // Required for CSRF protection

// CSRF token endpoint - must be called before making state-changing requests
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  const token = getCsrfToken(req);
  res.json({ csrfToken: token });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development' 
  });
});

// API routes (CSRF protection temporarily disabled - will enable after frontend integration)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/job-statuses', jobStatusRoutes);
app.use('/api/holidays', holidaysRoutes);
app.use('/api/pinned', pinnedRoutes);
app.use('/api/lead-times', leadTimesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/user-column-preferences', userColumnPreferencesRoutes);
app.use('/api/import', importRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/login-activity', loginActivityRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  
  // Capture error in Sentry if enabled
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }
  
  // Send generic error to client
  res.status(500).json({ 
    error: 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});
