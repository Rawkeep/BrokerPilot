/**
 * Email Service — Send emails via backend API and manage templates in Supabase.
 *
 * Sending is done through a server-side endpoint (`/api/email/send`)
 * to keep SMTP credentials off the client.
 * Templates are stored in the `email_templates` Supabase table.
 * All functions return `{ data, error }`.
 */
import { supabase, isSupabaseEnabled } from '../lib/supabase.js';

const NOT_CONFIGURED = { data: null, error: 'Supabase not configured' };

/**
 * Resolve the current authenticated user's ID.
 * @returns {Promise<string|null>}
 */
async function getUserId() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user.id;
}

/**
 * Get the current session's access token for authenticating backend requests.
 * @returns {Promise<string|null>}
 */
async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * Send an email via the backend API.
 * @param {string}  to — Recipient email address
 * @param {string}  subject — Email subject line
 * @param {string}  body — Email body (HTML or plain text)
 * @param {string}  [leadId] — Optional lead UUID to associate the email with
 * @returns {Promise<{ data: object|null, error: string|null }>}
 */
export async function sendEmail(to, subject, body, leadId) {
  if (!isSupabaseEnabled) return NOT_CONFIGURED;

  const token = await getAccessToken();
  if (!token) return { data: null, error: 'User not authenticated' };

  try {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ to, subject, body, leadId }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      return { data: null, error: errorBody.message ?? `Request failed (${response.status})` };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Fetch all email templates for the current user.
 * @returns {Promise<{ data: object[]|null, error: string|null }>}
 */
export async function fetchEmailTemplates() {
  if (!isSupabaseEnabled) return NOT_CONFIGURED;

  const userId = await getUserId();
  if (!userId) return { data: null, error: 'User not authenticated' };

  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  return { data, error: error?.message ?? null };
}

/**
 * Create or update an email template (upsert by id).
 * @param {object} template — Template object with optional `id`, plus `name`, `subject`, `body`
 * @returns {Promise<{ data: object|null, error: string|null }>}
 */
export async function saveEmailTemplate(template) {
  if (!isSupabaseEnabled) return NOT_CONFIGURED;

  const userId = await getUserId();
  if (!userId) return { data: null, error: 'User not authenticated' };

  const payload = {
    ...template,
    user_id: userId,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('email_templates')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  return { data, error: error?.message ?? null };
}

/**
 * Render an email template by replacing `{{variable}}` placeholders with provided values.
 * Operates entirely on the client — no Supabase call needed beyond fetching the template.
 * @param {string} templateId — Template UUID
 * @param {Record<string, string>} variables — Key-value pairs to substitute
 * @returns {Promise<{ data: { subject: string, body: string }|null, error: string|null }>}
 */
export async function renderTemplate(templateId, variables = {}) {
  if (!isSupabaseEnabled) return NOT_CONFIGURED;

  const userId = await getUserId();
  if (!userId) return { data: null, error: 'User not authenticated' };

  const { data: template, error } = await supabase
    .from('email_templates')
    .select('subject, body')
    .eq('id', templateId)
    .eq('user_id', userId)
    .single();

  if (error) return { data: null, error: error.message };
  if (!template) return { data: null, error: 'Template not found' };

  /**
   * Replace all `{{key}}` tokens with the corresponding variable value.
   * @param {string} text
   * @returns {string}
   */
  const interpolate = (text) =>
    text.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? '');

  return {
    data: {
      subject: interpolate(template.subject),
      body: interpolate(template.body),
    },
    error: null,
  };
}
