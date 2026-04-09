import express from 'express';
import { initServerSentry, setupSentryErrorHandler } from './lib/sentry.js';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import path from 'path';
import { healthRouter } from './routes/health.js';
import { marketRouter } from './routes/market.js';
import { aiRouter } from './routes/ai.js';
import { agentRouter } from './routes/agents.js';
import { pipelineRouter } from './routes/pipeline.js';
import { emailRouter } from './routes/email.js';
import { notificationRouter } from './routes/notifications.js';
import { intelligenceRouter } from './routes/intelligence.js';
import { portalRouter } from './routes/portal.js';
import { pluginRouter } from './routes/plugins.js';
import { emailTemplateRouter } from './routes/emailTemplates.js';
import { campaignRouter } from './routes/campaigns.js';
import { billingRouter, webhookHandler } from './routes/billing.js';
import { createCacheMiddleware } from './middleware/cache.js';
import { PORT as DEFAULT_PORT, RATE_LIMIT_WINDOW, RATE_LIMIT_MAX } from '../shared/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || DEFAULT_PORT;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Sentry — must be initialized before other middleware
initServerSentry(app);

// Shared cache instance for market data (exported for use by future routes)
export const cache = createCacheMiddleware();

// --- Security Middleware ---

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://*.coingecko.com", "https://api.coingecko.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://*.up.railway.app", "https://*.supabase.co", "https://api.coingecko.com", "https://query1.finance.yahoo.com", "https://query2.finance.yahoo.com", "https://*.stripe.com", "https://*.sentry.io", "https://*.ingest.sentry.io"],
      frameSrc: ["'self'", "https://*.stripe.com"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

app.use(cors({
  origin: process.env.APP_URL || [
    'http://localhost:5173',
    'http://localhost:5177',
    'https://rawkeep.github.io',
  ],
  credentials: true,
}));

// Stripe webhook needs raw body — mount BEFORE express.json()
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), webhookHandler);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// --- API Routes ---

app.use('/api', healthRouter);
app.use('/api', marketRouter);
app.use('/api', aiRouter);
app.use('/api', agentRouter);
app.use('/api', pipelineRouter);
app.use('/api', emailRouter);
app.use('/api', notificationRouter);
app.use('/api', intelligenceRouter);
app.use('/api', portalRouter);
app.use('/api', pluginRouter);
app.use('/api', emailTemplateRouter);
app.use('/api', campaignRouter);
app.use('/api', billingRouter);

// --- Static Files ---

const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// SPA fallback -- serve index.html for all non-API routes (Express 5 wildcard)
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// --- Error Handler ---

// Sentry error handler — must be before the generic error handler
setupSentryErrorHandler(app);

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const message = NODE_ENV === 'production' ? 'Internal Server Error' : err.message;
  res.status(status).json({ error: message });
});

// --- Start Server ---

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`BrokerPilot server running on port ${PORT} (${NODE_ENV})`);
});

export { app };
