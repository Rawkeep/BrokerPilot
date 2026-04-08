/**
 * Supabase Client — Single instance for the entire app.
 *
 * Reads credentials from Vite env vars:
 *   VITE_SUPABASE_URL     — Project URL (e.g. https://xxx.supabase.co)
 *   VITE_SUPABASE_ANON_KEY — Public anon key
 *
 * Falls back to localStorage-only mode if not configured.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/** True when Supabase credentials are configured */
export const isSupabaseEnabled = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseEnabled
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;
