/**
 * Lead Service — Supabase CRUD operations for leads.
 *
 * All functions return `{ data, error }`.
 * When Supabase is not configured, returns `{ data: null, error: 'Supabase not configured' }`
 * so Zustand stores can fall back to localStorage / IndexedDB.
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
 * Fetch all leads for the current user, ordered by most recently updated.
 * @returns {Promise<{ data: object[]|null, error: string|null }>}
 */
export async function fetchLeads() {
  if (!isSupabaseEnabled) return NOT_CONFIGURED;

  const userId = await getUserId();
  if (!userId) return { data: null, error: 'User not authenticated' };

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  return { data, error: error?.message ?? null };
}

/**
 * Create a new lead for the current user.
 * @param {object} lead — Lead fields (name, email, phone, status, etc.)
 * @returns {Promise<{ data: object|null, error: string|null }>}
 */
export async function createLead(lead) {
  if (!isSupabaseEnabled) return NOT_CONFIGURED;

  const userId = await getUserId();
  if (!userId) return { data: null, error: 'User not authenticated' };

  const { data, error } = await supabase
    .from('leads')
    .insert({ ...lead, user_id: userId })
    .select()
    .single();

  return { data, error: error?.message ?? null };
}

/**
 * Update an existing lead by ID.
 * @param {string} id — Lead UUID
 * @param {object} updates — Fields to update
 * @returns {Promise<{ data: object|null, error: string|null }>}
 */
export async function updateLead(id, updates) {
  if (!isSupabaseEnabled) return NOT_CONFIGURED;

  const userId = await getUserId();
  if (!userId) return { data: null, error: 'User not authenticated' };

  const { data, error } = await supabase
    .from('leads')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  return { data, error: error?.message ?? null };
}

/**
 * Delete a lead by ID.
 * @param {string} id — Lead UUID
 * @returns {Promise<{ data: object|null, error: string|null }>}
 */
export async function deleteLead(id) {
  if (!isSupabaseEnabled) return NOT_CONFIGURED;

  const userId = await getUserId();
  if (!userId) return { data: null, error: 'User not authenticated' };

  const { data, error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  return { data, error: error?.message ?? null };
}

/**
 * Fetch a single lead by ID, including related activities and pipeline results.
 * @param {string} id — Lead UUID
 * @returns {Promise<{ data: object|null, error: string|null }>}
 */
export async function fetchLeadById(id) {
  if (!isSupabaseEnabled) return NOT_CONFIGURED;

  const userId = await getUserId();
  if (!userId) return { data: null, error: 'User not authenticated' };

  const { data, error } = await supabase
    .from('leads')
    .select('*, activities(*), pipeline_results(*)')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  return { data, error: error?.message ?? null };
}
