import * as Sentry from '@sentry/nextjs'

// Edge runtime (src/middleware.ts). See src/instrumentation-client.ts for notes.
const dsn = process.env.BUGSINK_DSN || process.env.NEXT_PUBLIC_BUGSINK_DSN

if (dsn) {
  Sentry.init({
    dsn,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    environment: process.env.NEXT_PUBLIC_BUGSINK_ENVIRONMENT || process.env.NODE_ENV,
    tracesSampleRate: 0,
    sendDefaultPii: false,
  })
}
