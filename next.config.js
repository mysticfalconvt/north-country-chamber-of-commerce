import { withPayload } from '@payloadcms/next/withPayload'
import { withSentryConfig } from '@sentry/nextjs'

import redirects from './redirects.js'

const NEXT_PUBLIC_SERVER_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : undefined || process.env.__NEXT_PRIVATE_ORIGIN || 'http://localhost:3000'

// Bugsink matches stack frames to sources by the debug ID embedded in each bundle,
// not by release name, so this is only a human-readable label on the issue.
// `npm_package_version` is set whenever the build runs through pnpm/npm scripts.
const SENTRY_RELEASE =
  process.env.SENTRY_RELEASE ||
  `north-country-chamber-of-commerce@${process.env.npm_package_version || 'dev'}`

// Sourcemap upload needs a Bugsink auth token. Without one we skip generating and
// uploading maps entirely so that local and token-less builds still succeed.
const BUGSINK_AUTH_TOKEN = process.env.BUGSINK_AUTH_TOKEN

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        hostname: 'chamber.rboskind.com',
        protocol: 'https',
      },
      ...[NEXT_PUBLIC_SERVER_URL /* 'https://example.com' */].map((item) => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', ''),
        }
      }),
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SENTRY_RELEASE: SENTRY_RELEASE,
  },
  redirects,
  async rewrites() {
    return [
      {
        source: '/fr',
        destination: '/',
      },
      {
        source: '/fr/:path*',
        destination: '/:path*',
      },
    ]
  },
}

export default withSentryConfig(withPayload(nextConfig, { devBundleServerPackages: false }), {
  // Self-hosted Bugsink instance rather than sentry.io.
  sentryUrl: process.env.BUGSINK_URL || 'https://bugsink.rboskind.com/',
  // Bugsink has no concept of orgs; the value is required by the CLI but ignored.
  org: process.env.BUGSINK_ORG || 'bugsink',
  project: process.env.BUGSINK_PROJECT || 'north-country-chamber-of-commerce',
  authToken: BUGSINK_AUTH_TOKEN,

  // Bugsink implements the sourcemap upload endpoints but not the releases API,
  // so name the release without trying to create/finalize it server-side.
  release: {
    name: SENTRY_RELEASE,
    create: false,
    finalize: false,
  },

  sourcemaps: {
    disable: !BUGSINK_AUTH_TOKEN,
    // Don't ship .map files to browsers -- Bugsink resolves frames from the
    // uploaded artifact bundle instead.
    deleteSourcemapsAfterUpload: true,
  },

  // Also upload maps for chunks outside the default client dir, so vendor frames resolve.
  widenClientFileUpload: true,
  webpack: {
    // Strip Sentry's own debug logging from the production bundle.
    treeshake: { removeDebugLogging: true },
    // Not deployed on Vercel.
    automaticVercelMonitors: false,
  },
  // No phoning home to sentry.io from a self-hosted setup.
  telemetry: false,
  silent: !process.env.CI,
})
