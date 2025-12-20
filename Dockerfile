# Runtime build Dockerfile - builds Next.js when container starts with database access
FROM node:22.17.0-alpine AS base

# Install dependencies only when needed
FROM base AS deps
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

# Production image - will build at runtime
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Enable corepack as root before switching users
RUN corepack enable pnpm

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy dependencies from deps stage
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy all source files (needed for runtime build)
COPY --chown=nextjs:nodejs . .

# Create entrypoint script that builds, migrates, and starts the app
# Note: We run as root initially to fix .next permissions, then drop to nextjs user
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'set -e' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo 'echo "Waiting for database to be ready..."' >> /docker-entrypoint.sh && \
    echo 'sleep 5' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo '# Ensure .next directory exists and is writable by nextjs user' >> /docker-entrypoint.sh && \
    echo 'mkdir -p /app/.next' >> /docker-entrypoint.sh && \
    echo 'chown -R nextjs:nodejs /app/.next' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo '# Switch to nextjs user and run remaining commands' >> /docker-entrypoint.sh && \
    echo 'su-exec nextjs sh <<'\''EOSU'\''' >> /docker-entrypoint.sh && \
    echo '# Check if we need to build' >> /docker-entrypoint.sh && \
    echo 'if [ ! -d "/app/.next/standalone" ]; then' >> /docker-entrypoint.sh && \
    echo '  echo "Running Next.js build with database access..."' >> /docker-entrypoint.sh && \
    echo '  cd /app && pnpm run build' >> /docker-entrypoint.sh && \
    echo 'else' >> /docker-entrypoint.sh && \
    echo '  echo "Build already exists, skipping..."' >> /docker-entrypoint.sh && \
    echo 'fi' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo 'echo "Running Payload migrations..."' >> /docker-entrypoint.sh && \
    echo 'cd /app && node node_modules/@payloadcms/db-postgres/dist/bin.js || echo "Migrations complete"' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo 'echo "Starting application..."' >> /docker-entrypoint.sh && \
    echo 'cd /app && exec node .next/standalone/server.js' >> /docker-entrypoint.sh && \
    echo 'EOSU' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Install su-exec for dropping privileges
RUN apk add --no-cache su-exec

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["/docker-entrypoint.sh"]
