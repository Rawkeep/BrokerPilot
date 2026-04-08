/**
 * Activity Service — Supabase operations for lead activities.
 *
 * Activities track interactions with a lead (calls, emails, notes, status changes).
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
 * Fetch all activities for a lead, ordered by most recent first.
 * @param {string} leadId — Lead UUID
 * @returns {Promise<{ data: object[]|null, error: string|null }>}
 */
export async function fetchActivities(leadId) {
  if (!isSupabaseEnabled) return NOT_CONFIGURED;

  const userId = await getUserId();
  if (!userId) return { data: null, error: 'User not authenticated' };

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('lead_id', leadId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data, error: error?.message ?? null };
}

/**
 * Create a new activity for a lead.
 * @param {string} leadId — Lead UUID
 * @param {string} type — Activity type (e.g. 'call', 'email', 'note', 'status_change')
 * @param {string} description — Human-readable description
 * @param {object} [metadata={}] — Optional structured data (duration, old/new status, etc.)
 * @returns {Promise<{ data: object|null, error: string|null }>}
 */
export async function createActivity(leadId, type, description, metadata = {}) {
  if (!isSupabaseEnabled) return NOT_CONFIGURED;

  const userId = await getUserId();
  if (!userId) return { data: null, error: 'User not authenticated' };

  const { data, error } = await supabase
    .from('activities')
    .insert({
      lead_id: leadId,
      user_id: userId,
      type,
      description,
      metadata,
    })
    .select()
    .single();

  return { data, error: error?.message ?? null };
}
