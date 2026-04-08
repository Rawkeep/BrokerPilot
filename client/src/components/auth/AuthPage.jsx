import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { GlassInput } from '../ui/GlassInput';

/**
 * AuthPage — Login / Signup form with glassmorphism styling.
 * German labels for the DACH market.
 */
export function AuthPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState(null);

  const { signIn, signUp, signInWithGoogle, loading } = useAuthStore();

  const isLogin = mode === 'login';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    let result;
    if (isLogin) {
      result = await signIn(email, password);
    } else {
      if (!fullName.trim()) {
        setError('Bitte geben Sie Ihren Namen ein.');
        return;
      }
      result = await signUp(email, password, fullName.trim());
    }

    if (result.error) {
      setError(result.error);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    const result = await signInWithGoogle();
    if (result.error) {
      setError(result.error);
    }
  };

  const toggleMode = () => {
    setMode(isLogin ? 'signup' : 'login');
    setError(null);
  };

  return (
    <div className="auth-page">
      <GlassCard className="auth-page__card" hoverable={false}>
        <header className="auth-page__header">
          <h1 className="auth-page__title">BrokerPilot</h1>
          <p className="auth-page__subtitle">
            {isLogin ? 'Willkommen zuruck' : 'Konto erstellen'}
          </p>
        </header>

        {error && (
          <div className="auth-page__error" role="alert">
            {error}
          </div>
        )}

        <form className="auth-page__form" onSubmit={handleSubmit}>
          {!isLogin && (
            <GlassInput
              label="Vollstandiger Name"
              name="fullName"
              type="text"
              placeholder="Max Mustermann"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              required
            />
          )}

          <GlassInput
            label="E-Mail"
            name="email"
            type="email"
            placeholder="name@beispiel.de"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <GlassInput
            label="Passwort"
            name="password"
            type="password"
            placeholder="Mindestens 6 Zeichen"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            minLength={6}
            required
          />

          <GlassButton
            type="submit"
            variant="primary"
            className="auth-page__submit"
            disabled={loading}
          >
            {loading
              ? 'Laden...'
              : isLogin
                ? 'Anmelden'
                : 'Registrieren'}
          </GlassButton>
        </form>

        <div className="auth-page__divider">
          <span>oder</span>
        </div>

        <GlassButton
          type="button"
          className="auth-page__google"
          onClick={handleGoogle}
          disabled={loading}
        >
          <GoogleIcon />
          Mit Google fortfahren
        </GlassButton>

        <p className="auth-page__toggle">
          {isLogin ? 'Noch kein Konto?' : 'Bereits registriert?'}{' '}
          <button
            type="button"
            className="auth-page__toggle-btn"
            onClick={toggleMode}
          >
            {isLogin ? 'Registrieren' : 'Anmelden'}
          </button>
        </p>
      </GlassCard>
    </div>
  );
}

/** Inline Google "G" icon — avoids external dependency */
function GoogleIcon() {
  return (
    <svg
      className="auth-page__google-icon"
      width="18"
      height="18"
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
