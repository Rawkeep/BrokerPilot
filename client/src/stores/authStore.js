import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, isSupabaseEnabled } from '../lib/supabase';

/**
 * Auth store — manages authentication state via Supabase.
 * Storage key: 'bp-auth'
 *
 * Falls back to demo mode (no auth required) when Supabase is not configured.
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: true,
      initialized: false,

      /**
       * Bootstrap auth — call once on app mount.
       * Reads existing session and subscribes to auth changes.
       */
      initialize: async () => {
        if (!isSupabaseEnabled) {
          set({ loading: false, initialized: true });
          return;
        }

        try {
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) {
            console.error('[auth] getSession error:', error.message);
          }

          set({
            session: session ?? null,
            user: session?.user ?? null,
            loading: false,
            initialized: true,
          });
        } catch (err) {
          console.error('[auth] initialize failed:', err);
          set({ loading: false, initialized: true });
        }

        // Subscribe to future auth changes (sign-in, sign-out, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            set({
              session: session ?? null,
              user: session?.user ?? null,
            });
          },
        );

        // Store unsubscribe handle so callers can tear down if needed
        set({ _unsubscribe: subscription?.unsubscribe });
      },

      /**
       * Create a new account with email + password.
       * @returns {{ error: string|null }}
       */
      signUp: async (email, password, fullName) => {
        if (!isSupabaseEnabled) return { error: 'Supabase ist nicht konfiguriert' };

        set({ loading: true });

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });

        set({ loading: false });

        if (error) return { error: error.message };

        // Some Supabase configs require email confirmation — user may be null until confirmed.
        if (data.session) {
          set({ session: data.session, user: data.user });
        }

        return { error: null };
      },

      /**
       * Sign in with email + password.
       * @returns {{ error: string|null }}
       */
      signIn: async (email, password) => {
        if (!isSupabaseEnabled) return { error: 'Supabase ist nicht konfiguriert' };

        set({ loading: true });

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        set({ loading: false });

        if (error) return { error: error.message };

        set({ session: data.session, user: data.user });
        return { error: null };
      },

      /**
       * Sign in via Google OAuth (redirects to Google).
       * @returns {{ error: string|null }}
       */
      signInWithGoogle: async () => {
        if (!isSupabaseEnabled) return { error: 'Supabase ist nicht konfiguriert' };

        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });

        if (error) return { error: error.message };
        return { error: null };
      },

      /**
       * Sign out the current user.
       * @returns {{ error: string|null }}
       */
      signOut: async () => {
        if (!isSupabaseEnabled) return { error: null };

        const { error } = await supabase.auth.signOut();

        if (error) return { error: error.message };

        set({ user: null, session: null });
        return { error: null };
      },

      /**
       * Update the user's profile row in the `profiles` table.
       * @param {Record<string, unknown>} updates — columns to patch
       * @returns {{ error: string|null }}
       */
      updateProfile: async (updates) => {
        if (!isSupabaseEnabled) return { error: 'Supabase ist nicht konfiguriert' };

        const { user } = get();
        if (!user) return { error: 'Nicht angemeldet' };

        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);

        if (error) return { error: error.message };
        return { error: null };
      },
    }),
    {
      name: 'bp-auth',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
      }),
    },
  ),
);
