import * as Sentry from '@sentry/nextjs'

// Node.js runtime (server components, route handlers, Payload server code).
// See src/instrumentation-client.ts for notes on the Bugsink-specific choices.
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
