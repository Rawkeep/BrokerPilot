/**
 * Document Service — Supabase Storage + DB operations for lead documents.
 *
 * Files are stored in a Supabase Storage bucket (`documents`).
 * A corresponding row in the `documents` table tracks metadata
 * (lead_id, category, file_path, original_name, mime_type, size).
 * All functions return `{ data, error }`.
 */
import { supabase, isSupabaseEnabled } from '../lib/supabase.js';

const NOT_CONFIGURED = { data: null, error: 'Supabase not configured' };
const BUCKET = 'documents';

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
 * Upload a document to Supabase Storage and create a metadata record.
 * @param {string} leadId — Lead UUID
 * @param {File}   file — Browser File object
 * @param {string} [category='general'] — Document category (e.g. 'policy', 'quote', 'id')
 * @returns {Promise<{ data: object|null, error: string|null }>}
 */
export async function uploadDocument(leadId, file, category = 'general') {
  if (!isSupabaseEnabled) return NOT_CONFIGURED;

  const userId = await getUserId();
  if (!userId) return { data: null, error: 'User not authenticated' };

  // Build a unique storage path: userId/leadId/timestamp-filename
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${userId}/${leadId}/${timestamp}-${safeName}`;

  // Upload to Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) return { data: null, error: uploadError.message };

  // Insert metadata record
  const { data, error: dbError } = await supabase
    .from('documents')
    .insert({
      lead_id: leadId,
      user_id: userId,
      file_path: filePath,
      original_name: file.name,
      mime_type: file.type,
      size: file.size,
      category,
    })
    .select()
    .single();

  if (dbError) {
    // Best-effort cleanup: remove the orphaned storage object
    await supabase.storage.from(BUCKET).remove([filePath]);
    return { data: null, error: dbError.message };
  }

  return { data, error: null };
}

/**
 * Fetch all documents for a lead.
 * @param {string} leadId — Lead UUID
 * @returns {Promise<{ data: object[]|null, error: string|null }>}
 */
export async function fetchDocuments(leadId) {
  if (!isSupabaseEnabled) return NOT_CONFIGURED;

  const userId = await getUserId();
  if (!userId) return { data: null, error: 'User not authenticated' };

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('lead_id', leadId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data, error: error?.message ?? null };
}

/**
 * Delete a document from both Storage and the database.
 * @param {string} id — Document record UUID
 * @param {string} filePath — Storage path to remove
 * @returns {Promise<{ data: object|null, error: string|null }>}
 */
export async function deleteDocument(id, filePath) {
  if (!isSupabaseEnabled) return NOT_CONFIGURED;

  const userId = await getUserId();
  if (!userId) return { data: null, error: 'User not authenticated' };

  // Remove from Storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([filePath]);

  if (storageError) return { data: null, error: storageError.message };

  // Delete database record
  const { data, error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  return { data, error: dbError?.message ?? null };
}

/**
 * Get a time-limited signed URL for a stored document.
 * @param {string} filePath — Storage path
 * @param {number} [expiresIn=3600] — URL validity in seconds (default 1 hour)
 * @returns {Promise<{ data: { signedUrl: string }|null, error: string|null }>}
 */
export async function getDocumentUrl(filePath, expiresIn = 3600) {
  if (!isSupabaseEnabled) return NOT_CONFIGURED;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, expiresIn);

  return { data, error: error?.message ?? null };
}
