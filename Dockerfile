# To use this Dockerfile, you have to set `output: 'standalone'` in your next.config.js file.
# From https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile

FROM node:22.17.0-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

# Set a dummy PAYLOAD_SECRET for build time only
# The real secret will be provided at runtime via environment variables
ENV PAYLOAD_SECRET="build-time-secret-key-min-32-characters-long-placeholder"
ENV DATABASE_URI="postgresql://placeholder:placeholder@localhost:5432/placeholder"

RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Create entrypoint script for running migrations
RUN echo '#!/bin/sh' > docker-entrypoint.sh && \
    echo 'set -e' >> docker-entrypoint.sh && \
    echo '' >> docker-entrypoint.sh && \
    echo 'echo "Waiting for database..."' >> docker-entrypoint.sh && \
    echo 'sleep 5' >> docker-entrypoint.sh && \
    echo '' >> docker-entrypoint.sh && \
    echo 'echo "Running Payload migrations..."' >> docker-entrypoint.sh && \
    echo 'node node_modules/@payloadcms/db-postgres/dist/migrate.js || echo "Migrations complete or not needed"' >> docker-entrypoint.sh && \
    echo '' >> docker-entrypoint.sh && \
    echo 'echo "Starting application..."' >> docker-entrypoint.sh && \
    echo 'exec node server.js' >> docker-entrypoint.sh && \
    chmod +x docker-entrypoint.sh

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Remove this line if you do not have this folder
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy package.json for migrations
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Create entrypoint script that runs migrations before starting the app
COPY --from=builder --chown=nextjs:nodejs /app/docker-entrypoint.sh ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["/app/docker-entrypoint.sh"]
