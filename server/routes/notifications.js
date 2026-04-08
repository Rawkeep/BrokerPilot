/**
 * Push Notification Management Routes
 *
 * POST /api/notifications/subscribe — store a push subscription
 * POST /api/notifications/send     — send a push notification to a user
 *
 * Uses web-push with VAPID keys from env vars:
 *   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL
 */

import { Router } from 'express';
import webpush from 'web-push';
import rateLimit from 'express-rate-limit';

export const notificationRouter = Router();

// --- VAPID configuration ---

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@brokerpilot.app';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// --- In-memory subscription store (swap for DB in production) ---

/** @type {Map<string, import('web-push').PushSubscription>} userId -> subscription */
const subscriptions = new Map();

/** Rate limit for notification sends: 30 per minute per IP */
const notifyRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many notification requests. Please try again in a minute.' },
});

/**
 * Check if VAPID keys are configured.
 * @returns {boolean}
 */
function isVapidConfigured() {
  return Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
}

/**
 * GET /api/notifications/vapid-key — return the public VAPID key for client subscription
 */
notificationRouter.get('/notifications/vapid-key', (_req, res) => {
  if (!isVapidConfigured()) {
    return res.status(503).json({
      error: 'Push notifications not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.',
    });
  }

  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

/**
 * POST /api/notifications/subscribe — store a push subscription
 *
 * Body: { userId, subscription } where subscription is a PushSubscription object
 * Returns: { success: true }
 */
notificationRouter.post('/notifications/subscribe', (req, res) => {
  if (!isVapidConfigured()) {
    return res.status(503).json({
      error: 'Push notifications not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.',
    });
  }

  const { userId, subscription } = req.body;

  // --- Validation ---
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "userId". Must be a non-empty string.' });
  }

  if (!subscription || typeof subscription !== 'object') {
    return res.status(400).json({ error: 'Missing or invalid "subscription". Must be a PushSubscription object.' });
  }

  if (!subscription.endpoint || typeof subscription.endpoint !== 'string') {
    return res.status(400).json({ error: 'Invalid subscription: missing "endpoint".' });
  }

  if (!subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
    return res.status(400).json({ error: 'Invalid subscription: missing "keys.p256dh" or "keys.auth".' });
  }

  // Store subscription
  subscriptions.set(userId, subscription);

  res.json({ success: true });
});

/**
 * POST /api/notifications/send — send a push notification
 *
 * Body: { title, body, url?, userId }
 * Returns: { success: true } or error
 */
notificationRouter.post('/notifications/send', notifyRateLimit, async (req, res) => {
  if (!isVapidConfigured()) {
    return res.status(503).json({
      error: 'Push notifications not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.',
    });
  }

  const { title, body, url, userId } = req.body;

  // --- Validation ---
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "title". Must be a non-empty string.' });
  }

  if (!body || typeof body !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "body". Must be a non-empty string.' });
  }

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "userId". Must be a non-empty string.' });
  }

  if (url && typeof url !== 'string') {
    return res.status(400).json({ error: '"url" must be a string if provided.' });
  }

  // Look up subscription
  const subscription = subscriptions.get(userId);
  if (!subscription) {
    return res.status(404).json({ error: `No push subscription found for userId "${userId}".` });
  }

  // Build notification payload
  const payload = JSON.stringify({
    title,
    body,
    url: url || '/',
    timestamp: Date.now(),
  });

  try {
    await webpush.sendNotification(subscription, payload);
    return res.json({ success: true });
  } catch (err) {
    // If subscription expired or invalid, remove it
    if (err.statusCode === 404 || err.statusCode === 410) {
      subscriptions.delete(userId);
      return res.status(410).json({
        success: false,
        error: 'Push subscription expired or invalid. Client must re-subscribe.',
      });
    }

    return res.status(502).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/notifications/subscribe — remove a push subscription
 *
 * Body: { userId }
 * Returns: { success: true }
 */
notificationRouter.delete('/notifications/subscribe', (req, res) => {
  const { userId } = req.body;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "userId".' });
  }

  subscriptions.delete(userId);
  res.json({ success: true });
});
