/**
 * Email Sender Service
 *
 * Supports two backends:
 * 1. Resend (https://resend.com) — modern email API, free tier 100/day
 * 2. SMTP via nodemailer — for self-hosted
 *
 * Auto-detects based on env vars: RESEND_API_KEY or SMTP_HOST
 */

import nodemailer from 'nodemailer';

const DEFAULT_FROM = process.env.EMAIL_FROM || 'BrokerPilot <noreply@brokerpilot.app>';

/**
 * Detect which email backend is available.
 * @returns {'resend' | 'smtp' | null}
 */
function detectBackend() {
  if (process.env.RESEND_API_KEY) return 'resend';
  if (process.env.SMTP_HOST) return 'smtp';
  return null;
}

/**
 * Send email via Resend HTTP API.
 * @param {object} options
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendViaResend({ to, subject, html, text, from, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;

  const body = {
    from: from || DEFAULT_FROM,
    to: Array.isArray(to) ? to : [to],
    subject,
  };

  if (html) body.html = html;
  if (text) body.text = text;
  if (replyTo) body.reply_to = replyTo;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Resend API returned ${response.status}`,
      };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Send email via SMTP using nodemailer.
 * @param {object} options
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendViaSMTP({ to, subject, html, text, from, replyTo }) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });

  try {
    const info = await transporter.sendMail({
      from: from || DEFAULT_FROM,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text,
      replyTo,
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Send an email using the auto-detected backend.
 *
 * @param {{ to: string|string[], subject: string, html?: string, text?: string, from?: string, replyTo?: string }} options
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendEmail(options) {
  const backend = detectBackend();

  if (!backend) {
    return {
      success: false,
      error: 'No email backend configured. Set RESEND_API_KEY or SMTP_HOST environment variable.',
    };
  }

  if (backend === 'resend') {
    return sendViaResend(options);
  }

  return sendViaSMTP(options);
}

/**
 * Check if an email backend is available.
 * @returns {{ available: boolean, backend: string | null }}
 */
export function getEmailStatus() {
  const backend = detectBackend();
  return { available: backend !== null, backend };
}
