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

    // Server Action IDs are derived from the build, and docker-entrypoint.sh
    // rebuilds .next on container start, so every deploy invalidates the IDs held
    // by tabs that are already open. Next surfaces that as an unactionable error
    // on the next submit from such a tab; the user just needs to reload. Nothing
    // in our code can prevent it, so don't let deploys spam the issue list.
    ignoreErrors: [/Failed to find Server Action/],
  })
}
