/**
 * Email Sending Route
 *
 * POST /api/email/send — sends an email via Resend or SMTP
 * Rate limited to 10 emails per minute per IP.
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { sendEmail, getEmailStatus } from '../services/emailSender.js';

export const emailRouter = Router();

/** Stricter rate limit for email sending: 10 per minute per IP */
const emailRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many email requests. Please try again in a minute.' },
});

/**
 * GET /api/email/status — check if email backend is configured
 */
emailRouter.get('/email/status', (_req, res) => {
  const status = getEmailStatus();
  res.json(status);
});

/**
 * POST /api/email/send — send an email
 *
 * Body: { to, subject, html?, text?, replyTo? }
 * Returns: { success: true, messageId } or { success: false, error }
 */
emailRouter.post('/email/send', emailRateLimit, async (req, res) => {
  const { to, subject, html, text, replyTo } = req.body;

  // --- Input validation ---
  if (!to || typeof to !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "to" field. Must be a string.' });
  }

  if (!subject || typeof subject !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "subject" field. Must be a string.' });
  }

  if (!html && !text) {
    return res.status(400).json({ error: 'At least one of "html" or "text" must be provided.' });
  }

  if (html && typeof html !== 'string') {
    return res.status(400).json({ error: '"html" must be a string.' });
  }

  if (text && typeof text !== 'string') {
    return res.status(400).json({ error: '"text" must be a string.' });
  }

  if (replyTo && typeof replyTo !== 'string') {
    return res.status(400).json({ error: '"replyTo" must be a string.' });
  }

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return res.status(400).json({ error: 'Invalid email address format for "to".' });
  }

  if (replyTo && !emailRegex.test(replyTo)) {
    return res.status(400).json({ error: 'Invalid email address format for "replyTo".' });
  }

  // --- Send email ---
  try {
    const result = await sendEmail({ to, subject, html, text, replyTo });

    if (!result.success) {
      return res.status(502).json({ success: false, error: result.error });
    }

    return res.json({ success: true, messageId: result.messageId });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Unexpected error sending email.' });
  }
});
