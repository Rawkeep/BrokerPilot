/**
 * Reminder Service — Supabase operations for follow-up reminders.
 *
 * Reminders are tied to leads and have a due date, completion status,
 * and optional description.
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
 * Fetch reminders with optional filters.
 * @param {object} [options={}]
 * @param {boolean} [options.completed] — Filter by completion status (true/false/undefined for all)
 * @param {string}  [options.dueBefore] — ISO date string; only reminders due before this date
 * @param {string}  [options.dueAfter]  — ISO date string; only reminders due after this date
 * @param {string}  [options.leadId]    — Filter by lead UUID
 * @returns {Promise<{ data: object[]|null, error: string|null }>}
 */
export async function fetchReminders(options = {}) {
  if (!isSupabaseEnabled) return NOT_CONFIGURED;

  const userId = await getUserId();
  if (!userId) return { data: null, error: 'User not authenticated' };

  let query = supabase
    .from('reminders')
    .select('*, leads(name)')
    .eq('user_id', userId)
    .order('due_at', { ascending: true });

  if (typeof options.completed === 'boolean') {
    query = query.eq('completed', options.completed);
  }
  if (options.dueBefore) {
    query = query.lte('due_at', options.dueBefore);
  }
  if (options.dueAfter) {
    query = query.gte('due_at', options.dueAfter);
  }
  if (options.leadId) {
    query = query.eq('lead_id', options.leadId);
  }

  const { data, error } = await query;
  return { data, error: error?.message ?? null };
}

/**
 * Create a new reminder.
 * @param {string} leadId — Lead UUID
 * @param {string} title — Short reminder title
 * @param {string} description — Additional details
 * @param {string} dueAt — ISO 8601 date-time string
 * @returns {Promise<{ data: object|null, error: string|null }>}
 */
export async function createReminder(leadId, title, description, dueAt) {
  if (!isSupabaseEnabled) return NOT_CONFIGURED;

  const userId = await getUserId();
  if (!userId) return { data: null, error: 'User not authenticated' };

  const { data, error } = await supabase
    .from('reminders')
    .insert({
      lead_id: leadId,
      user_id: userId,
      title,
      description,
      due_at: dueAt,
      completed: false,
    })
    .select()
    .single();

  return { data, error: error?.message ?? null };
}

/**
 * Mark a reminder as completed.
 * @param {string} id — Reminder UUID
 * @returns {Promise<{ data: object|null, error: string|null }>}
 */
export async function completeReminder(id) {
  if (!isSupabaseEnabled) return NOT_CONFIGURED;

  const userId = await getUserId();
  if (!userId) return { data: null, error: 'User not authenticated' };

  const { data, error } = await supabase
    .from('reminders')
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  return { data, error: error?.message ?? null };
}

/**
 * Delete a reminder.
 * @param {string} id — Reminder UUID
 * @returns {Promise<{ data: object|null, error: string|null }>}
 */
export async function deleteReminder(id) {
  if (!isSupabaseEnabled) return NOT_CONFIGURED;

  const userId = await getUserId();
  if (!userId) return { data: null, error: 'User not authenticated' };

  const { data, error } = await supabase
    .from('reminders')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  return { data, error: error?.message ?? null };
}

/**
 * Fetch upcoming reminders due within the next N days.
 * @param {number} [days=7] — Number of days to look ahead
 * @returns {Promise<{ data: object[]|null, error: string|null }>}
 */
export async function fetchUpcomingReminders(days = 7) {
  const now = new Date().toISOString();
  const future = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  return fetchReminders({
    completed: false,
    dueAfter: now,
    dueBefore: future,
  });
}
