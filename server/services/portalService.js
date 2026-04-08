/**
 * Portal Service — Business logic for the Client Portal system.
 *
 * Manages portal link tokens, data retrieval, signature recording,
 * and client messaging. Works with Supabase when available, falls
 * back to an in-memory store for local development.
 */

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Supabase server-side client (uses service-role key when available)
// ---------------------------------------------------------------------------
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// ---------------------------------------------------------------------------
// In-memory fallback store (dev / demo without Supabase)
// ---------------------------------------------------------------------------
const memoryStore = new Map();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateToken() {
  return crypto.randomUUID();
}

function expiresAt(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a portal link token for a given lead.
 *
 * @param {string} leadId    — UUID of the lead
 * @param {string} userId    — UUID of the broker / auth user
 * @param {number} [expiresInDays=30]
 * @param {object} [proposalSnapshot] — frozen copy of the proposal
 * @returns {Promise<{token: string, expiresAt: string}>}
 */
export async function generatePortalToken(leadId, userId, expiresInDays = 30, proposalSnapshot = null) {
  const token = generateToken();
  const expires = expiresAt(expiresInDays);

  if (supabase) {
    const { error } = await supabase.from('portal_links').insert({
      lead_id: leadId,
      user_id: userId,
      token,
      expires_at: expires,
      proposal_snapshot: proposalSnapshot,
      messages: [],
    });
    if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  } else {
    memoryStore.set(token, {
      id: token,
      lead_id: leadId,
      user_id: userId,
      token,
      expires_at: expires,
      proposal_snapshot: proposalSnapshot,
      signature_data: null,
      signed_at: null,
      messages: [],
      created_at: new Date().toISOString(),
    });
  }

  return { token, expiresAt: expires };
}

/**
 * Check whether a token exists and has not expired.
 *
 * @param {string} token
 * @returns {Promise<boolean>}
 */
export async function isTokenValid(token) {
  if (supabase) {
    const { data } = await supabase
      .from('portal_links')
      .select('expires_at')
      .eq('token', token)
      .single();
    if (!data) return false;
    return new Date(data.expires_at) > new Date();
  }

  const record = memoryStore.get(token);
  if (!record) return false;
  return new Date(record.expires_at) > new Date();
}

/**
 * Retrieve all portal data needed by the client-facing portal page.
 *
 * @param {string} token
 * @returns {Promise<object|null>}
 */
export async function getPortalData(token) {
  let record;

  if (supabase) {
    const { data, error } = await supabase
      .from('portal_links')
      .select('*')
      .eq('token', token)
      .single();
    if (error || !data) return null;
    record = data;
  } else {
    record = memoryStore.get(token);
    if (!record) return null;
  }

  // Validate expiry
  if (new Date(record.expires_at) < new Date()) return null;

  // Attempt to fetch the related lead from supabase
  let lead = null;
  if (supabase) {
    const { data: leadData } = await supabase
      .from('leads')
      .select('*')
      .eq('id', record.lead_id)
      .single();
    lead = leadData;
  }

  return {
    token: record.token,
    expiresAt: record.expires_at,
    proposal: record.proposal_snapshot,
    signatureData: record.signature_data,
    signedAt: record.signed_at,
    messages: record.messages || [],
    lead,
    createdAt: record.created_at,
  };
}

/**
 * Store an e-signature against a portal token.
 *
 * @param {string} token
 * @param {string} signatureData — base64 PNG
 * @returns {Promise<{success: boolean}>}
 */
export async function recordSignature(token, signatureData) {
  const signedAt = new Date().toISOString();

  if (supabase) {
    const { error } = await supabase
      .from('portal_links')
      .update({ signature_data: signatureData, signed_at: signedAt })
      .eq('token', token);
    if (error) throw new Error(`Signature save failed: ${error.message}`);
  } else {
    const record = memoryStore.get(token);
    if (!record) throw new Error('Token not found');
    record.signature_data = signatureData;
    record.signed_at = signedAt;
  }

  return { success: true, signedAt };
}

/**
 * Append a message from the client to the portal record.
 *
 * @param {string} token
 * @param {string} message
 * @returns {Promise<{success: boolean}>}
 */
export async function recordMessage(token, message) {
  const entry = {
    text: message,
    from: 'client',
    timestamp: new Date().toISOString(),
  };

  if (supabase) {
    // Fetch current messages, append, and update
    const { data, error: fetchErr } = await supabase
      .from('portal_links')
      .select('messages')
      .eq('token', token)
      .single();
    if (fetchErr) throw new Error(`Fetch failed: ${fetchErr.message}`);

    const messages = [...(data.messages || []), entry];
    const { error } = await supabase
      .from('portal_links')
      .update({ messages })
      .eq('token', token);
    if (error) throw new Error(`Message save failed: ${error.message}`);
  } else {
    const record = memoryStore.get(token);
    if (!record) throw new Error('Token not found');
    record.messages.push(entry);
  }

  return { success: true };
}
