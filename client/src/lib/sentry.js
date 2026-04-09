import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';

export function initSentry() {
  if (!SENTRY_DSN) {
    console.log('Sentry: No DSN configured — monitoring disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE || 'development',
    release: `brokerpilot@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,

    // Performance
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,

    // Session Replay (optional)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Filtering
    beforeSend(event) {
      // Don't send in development
      if (import.meta.env.DEV && !SENTRY_DSN.includes('force')) return null;

      // Filter out known non-errors
      if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) return null;
      if (event.exception?.values?.[0]?.value?.includes('ChunkLoadError')) return null;

      return event;
    },

    // Integrations
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
  });
}

export function captureError(error, context = {}) {
  if (SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
  console.error('BrokerPilot Error:', error, context);
}

export function setUser(user) {
  if (SENTRY_DSN) {
    Sentry.setUser(user ? { email: user.email, id: user.id } : null);
  }
}

export function addBreadcrumb(message, category = 'app', level = 'info') {
  if (SENTRY_DSN) {
    Sentry.addBreadcrumb({ message, category, level });
  }
}

export { Sentry };
