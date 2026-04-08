/**
 * Freemium Gate Middleware
 *
 * IP-based rate limiter for users without an API key.
 * - 5 free requests per day per IP
 * - Resets at midnight UTC
 * - Requests with an API key bypass the gate entirely
 */

import { FREEMIUM_DAILY_LIMIT } from '../../shared/aiProviders.js';

/** @type {Map<string, { count: number, resetAt: number }>} */
const ipCounters = new Map();

/**
 * Calculate the timestamp of the next midnight UTC.
 * @returns {number}
 */
function getNextMidnightUTC() {
  const now = new Date();
  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  return tomorrow.getTime();
}

/**
 * Express middleware: enforces freemium daily limit per IP.
 * If the request body includes a non-empty `apiKey`, the gate is bypassed.
 */
export function freemiumGate(req, res, next) {
  // BYOK bypass — users with their own key are not rate-limited
  if (req.body && req.body.apiKey && typeof req.body.apiKey === 'string' && req.body.apiKey.length > 0) {
    return next();
  }

  const ip = req.ip || req.connection?.remoteAddress || 'unknown';

  let entry = ipCounters.get(ip);

  // Create or reset entry if missing or expired
  if (!entry || entry.resetAt <= Date.now()) {
    entry = { count: 0, resetAt: getNextMidnightUTC() };
    ipCounters.set(ip, entry);
  }

  if (entry.count >= FREEMIUM_DAILY_LIMIT) {
    return res.status(429).json({
      error:
        'Tageslimit erreicht. Bitte fuegen Sie einen API-Schluessel hinzu.',
      limit: FREEMIUM_DAILY_LIMIT,
    });
  }

  entry.count += 1;
  next();
}

/** Exposed for testing — clears all IP counters. */
export function _resetCounters() {
  ipCounters.clear();
}
