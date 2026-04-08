import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import path from 'path';
import { healthRouter } from './routes/health.js';
import { marketRouter } from './routes/market.js';
import { aiRouter } from './routes/ai.js';
import { agentRouter } from './routes/agents.js';
import { createCacheMiddleware } from './middleware/cache.js';
import { PORT as DEFAULT_PORT, RATE_LIMIT_WINDOW, RATE_LIMIT_MAX } from '../shared/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || DEFAULT_PORT;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Shared cache instance for market data (exported for use by future routes)
export const cache = createCacheMiddleware();

// --- Security Middleware ---

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https://*.coingecko.com"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
    },
  },
}));

app.use(cors({
  origin: process.env.APP_URL || '*',
}));

app.use(express.json());

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

// --- Static Files ---

const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// SPA fallback -- serve index.html for all non-API routes (Express 5 wildcard)
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// --- Error Handler ---

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
