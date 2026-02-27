import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { prisma } from './prisma';
import authRoutes from './modules/auth/auth.routes';
import stripeRoutes from './modules/stripe/stripe.routes';
import ghlRoutes from './modules/gohighlevel/ghl.routes';
import invitationsRoutes from './modules/invitations/invitations.routes';
import snapshotRoutes from './modules/snapshot/snapshot.routes';
import { syncScheduler } from './jobs/sync-scheduler';

const app = express();

// CORS middleware (before body parsing)
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);

// Raw body parser for webhook routes (MUST be before JSON parser)
app.use(
  '/stripe/webhooks',
  express.raw({ type: 'application/json' })
);
app.use(
  '/gohighlevel/webhooks',
  express.raw({ type: 'application/json' })
);

// JSON parser for all other routes
app.use(express.json());
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} | Auth: ${req.headers.authorization ? 'YES' : 'NO'}`);
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/stripe', stripeRoutes);
app.use('/gohighlevel', ghlRoutes);
app.use('/invitations', invitationsRoutes);
app.use('/snapshot', snapshotRoutes);

// Diagnostic endpoint to list all registered routes
app.get('/debug/routes', (req, res) => {
  const routes: string[] = [];

  function listRoutes(stack: any[], prefix = '') {
    stack.forEach((middleware: any) => {
      if (middleware.route) {
        const methods = Object.keys(middleware.route.methods);
        methods.forEach(method => {
          routes.push(`${method.toUpperCase()} ${prefix}${middleware.route.path}`);
        });
      } else if (middleware.name === 'router' && middleware.handle.stack) {
        const regexMatch = middleware.regexp.toString().match(/\\\/([^\\]*)/);
        const path = regexMatch ? `/${regexMatch[1]}` : '';
        listRoutes(middleware.handle.stack, prefix + path);
      }
    });
  }

  listRoutes((app as any)._router.stack);
  res.json({ routes: routes.sort() });
});

// Health check with database verification
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res
      .status(503)
      .json({ status: 'error', database: 'disconnected' });
  }
});

// 404 handler for unmatched routes
app.use((req, res) => {
  console.log(`[404] ${req.method} ${req.path} - Route not found`);
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
    availableRoutes: [
      'GET /health',
      'POST /auth/register',
      'POST /auth/login',
      'POST /auth/refresh',
      'POST /auth/logout',
      'GET /auth/me',
      'PUT /auth/me',
      'POST /invitations',
      'GET /invitations/list',
      'GET /invitations/feedback',
      'GET /invitations/:token',
      'POST /invitations/:token/feedback',
      'GET /stripe/oauth/url',
      'POST /stripe/oauth/callback',
      'POST /stripe/connect',
      'GET /stripe/status',
      'POST /stripe/webhooks',
      'GET /gohighlevel/oauth/url',
      'POST /gohighlevel/connect',
      'GET /gohighlevel/status',
      'POST /gohighlevel/webhooks',
      'GET /snapshot',
    ]
  });
});

// Start scheduler
syncScheduler.start();

// Start server
app.listen(config.serverPort, async () => {
  console.log(`Server running on port ${config.serverPort}`);

  // Log startup info
  console.log(`Frontend URL: ${config.frontendUrl}`);
  console.log(`Stripe configured: ${!!config.integrations.stripe.clientId && config.integrations.stripe.clientId !== ''}`);
  console.log(`GHL configured: ${!!config.integrations.gohighlevel.clientId && config.integrations.gohighlevel.clientId !== ''}`);

  // Test database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✓ Database connected');
  } catch (err) {
    console.error('✗ Database connection failed:', err instanceof Error ? err.message : 'Unknown error');
  }
});
