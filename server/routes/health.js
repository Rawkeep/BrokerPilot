import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      sentry: !!process.env.SENTRY_DSN,
      supabase: !!process.env.VITE_SUPABASE_URL,
      stripe: !!process.env.STRIPE_SECRET_KEY,
      email: !!(process.env.RESEND_API_KEY || process.env.SMTP_HOST),
    },
    lastError: null,
  });
});
