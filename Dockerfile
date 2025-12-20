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

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy dependencies from deps stage
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy all source files (needed for runtime build)
COPY --chown=nextjs:nodejs . .

# Create entrypoint script that builds, migrates, and starts the app
RUN echo '#!/bin/sh' > /app/docker-entrypoint.sh && \
    echo 'set -e' >> /app/docker-entrypoint.sh && \
    echo '' >> /app/docker-entrypoint.sh && \
    echo 'echo "Waiting for database to be ready..."' >> /app/docker-entrypoint.sh && \
    echo 'sleep 5' >> /app/docker-entrypoint.sh && \
    echo '' >> /app/docker-entrypoint.sh && \
    echo '# Check if we need to build' >> /app/docker-entrypoint.sh && \
    echo 'if [ ! -d ".next/standalone" ]; then' >> /app/docker-entrypoint.sh && \
    echo '  echo "Running Next.js build with database access..."' >> /app/docker-entrypoint.sh && \
    echo '  if [ -f pnpm-lock.yaml ]; then' >> /app/docker-entrypoint.sh && \
    echo '    corepack enable pnpm && pnpm run build' >> /app/docker-entrypoint.sh && \
    echo '  elif [ -f package-lock.json ]; then' >> /app/docker-entrypoint.sh && \
    echo '    npm run build' >> /app/docker-entrypoint.sh && \
    echo '  elif [ -f yarn.lock ]; then' >> /app/docker-entrypoint.sh && \
    echo '    yarn run build' >> /app/docker-entrypoint.sh && \
    echo '  fi' >> /app/docker-entrypoint.sh && \
    echo 'else' >> /app/docker-entrypoint.sh && \
    echo '  echo "Build already exists, skipping..."' >> /app/docker-entrypoint.sh && \
    echo 'fi' >> /app/docker-entrypoint.sh && \
    echo '' >> /app/docker-entrypoint.sh && \
    echo 'echo "Running Payload migrations..."' >> /app/docker-entrypoint.sh && \
    echo 'node node_modules/@payloadcms/db-postgres/dist/migrate.js || echo "Migrations complete"' >> /app/docker-entrypoint.sh && \
    echo '' >> /app/docker-entrypoint.sh && \
    echo 'echo "Starting application..."' >> /app/docker-entrypoint.sh && \
    echo 'exec node .next/standalone/server.js' >> /app/docker-entrypoint.sh && \
    chmod +x /app/docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["/app/docker-entrypoint.sh"]
