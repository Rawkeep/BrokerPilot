import { useEffect } from 'react';
import { isSupabaseEnabled } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { AuthPage } from './AuthPage';

/**
 * AuthGuard — gate that wraps the app.
 *
 * - Supabase not configured -> render children directly (demo / offline mode).
 * - Loading / not initialized -> show a centered spinner.
 * - No user session        -> show AuthPage.
 * - Authenticated          -> render children.
 */
export function AuthGuard({ children }) {
  const { user, loading, initialized, initialize } = useAuthStore();

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  // Demo mode — no Supabase credentials configured
  if (!isSupabaseEnabled) {
    return <>{children}</>;
  }

  // Still bootstrapping
  if (loading || !initialized) {
    return (
      <div className="auth-guard__loading">
        <div className="auth-guard__spinner" />
      </div>
    );
  }

  // Unauthenticated
  if (!user) {
    return <AuthPage />;
  }

  // Authenticated
  return <>{children}</>;
}
