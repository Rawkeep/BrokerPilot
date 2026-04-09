import * as Sentry from '@sentry/node';

const SENTRY_DSN = process.env.SENTRY_DSN || '';

export function initServerSentry(app) {
  if (!SENTRY_DSN) {
    console.log('Sentry: No DSN configured — server monitoring disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: `brokerpilot-server@${process.env.APP_VERSION || '1.0.0'}`,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

    beforeSend(event) {
      // Filter rate limit errors
      if (event.exception?.values?.[0]?.value?.includes('Too many requests')) return null;
      return event;
    },
  });

  // Request handler — must be first middleware
  app.use(Sentry.Handlers.requestHandler());
  // Tracing
  app.use(Sentry.Handlers.tracingHandler());
}

export function setupSentryErrorHandler(app) {
  if (!SENTRY_DSN) return;
  // Error handler — must be before other error handlers
  app.use(Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Report 4xx and 5xx errors
      return error.status >= 400 || !error.status;
    },
  }));
}

export function captureServerError(error, context = {}) {
  if (SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
}
