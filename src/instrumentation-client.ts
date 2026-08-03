import * as Sentry from '@sentry/nextjs'

// Bugsink is Sentry-SDK compatible, so we use @sentry/nextjs pointed at our own instance.
// Reporting is opt-in: with no DSN set, init() never runs and every Sentry.* call is a no-op.
const dsn = process.env.NEXT_PUBLIC_BUGSINK_DSN

if (dsn) {
  Sentry.init({
    dsn,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    environment: process.env.NEXT_PUBLIC_BUGSINK_ENVIRONMENT || process.env.NODE_ENV,

    // Bugsink is an error tracker only -- it has no tracing/performance product,
    // so we never sample spans. Note we deliberately keep the SDK's default
    // integrations rather than passing `integrations: []` as the generic Bugsink
    // snippet shows: that empty array would also remove `globalHandlers`, which is
    // what catches uncaught errors and unhandled rejections in the first place.
    tracesSampleRate: 0,

    sendDefaultPii: false,
  })
}

// Required by the SDK so client-side navigations are instrumented. With
// tracesSampleRate at 0 this sends nothing, but the SDK warns at build time if
// it's missing and it means tracing works if we ever turn it on.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
