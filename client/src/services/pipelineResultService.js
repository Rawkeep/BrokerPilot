/**
 * Pipeline Result Service — Supabase operations for AI pipeline results.
 *
 * Stores the output of AI analysis pipelines run against a lead
 * (risk scoring, quote comparison, recommendation, etc.).
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
 * Save a new pipeline result for a lead.
 * @param {string} leadId — Lead UUID
 * @param {object} results — The structured AI pipeline output
 * @returns {Promise<{ data: object|null, error: string|null }>}
 */
export async function savePipelineResult(leadId, results) {
  if (!isSupabaseEnabled) return NOT_CONFIGURED;

  const userId = await getUserId();
  if (!userId) return { data: null, error: 'User not authenticated' };

  const { data, error } = await supabase
    .from('pipeline_results')
    .insert({
      lead_id: leadId,
      user_id: userId,
      results,
    })
    .select()
    .single();

  return { data, error: error?.message ?? null };
}

/**
 * Fetch all pipeline results for a lead, ordered by most recent first.
 * @param {string} leadId — Lead UUID
 * @returns {Promise<{ data: object[]|null, error: string|null }>}
 */
export async function fetchPipelineResults(leadId) {
  if (!isSupabaseEnabled) return NOT_CONFIGURED;

  const userId = await getUserId();
  if (!userId) return { data: null, error: 'User not authenticated' };

  const { data, error } = await supabase
    .from('pipeline_results')
    .select('*')
    .eq('lead_id', leadId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data, error: error?.message ?? null };
}

/**
 * Fetch the most recent pipeline result for a lead.
 * @param {string} leadId — Lead UUID
 * @returns {Promise<{ data: object|null, error: string|null }>}
 */
export async function fetchLatestPipelineResult(leadId) {
  if (!isSupabaseEnabled) return NOT_CONFIGURED;

  const userId = await getUserId();
  if (!userId) return { data: null, error: 'User not authenticated' };

  const { data, error } = await supabase
    .from('pipeline_results')
    .select('*')
    .eq('lead_id', leadId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return { data, error: error?.message ?? null };
}
