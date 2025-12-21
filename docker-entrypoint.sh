#!/bin/sh
set -e

echo "Waiting for database to be ready..."
sleep 5

# Ensure .next directory exists and is writable
mkdir -p /app/.next
chown -R nextjs:nodejs /app/.next

# Switch to nextjs user for remaining operations
su-exec nextjs sh <<'EOSU'
set -e

# Check if we need to build
if [ ! -d "/app/.next/standalone" ]; then
  echo "================================"
  echo "Running database migrations..."
  echo "================================"
  cd /app

  MIGRATE_OUTPUT=$(pnpm payload migrate 2>&1)
  MIGRATE_EXIT=$?

  echo "$MIGRATE_OUTPUT"

  if [ $MIGRATE_EXIT -ne 0 ]; then
    echo "================================"
    echo "ERROR: Migration failed!"
    echo "================================"
    echo "Check logs above for details."
    exit 1
  fi

  echo "================================"
  echo "Migrations completed successfully"
  echo "================================"

  echo "Running Next.js build with database access..."
  BUILD_OUTPUT=$(pnpm run build 2>&1)
  BUILD_EXIT=$?

  echo "$BUILD_OUTPUT"

  if [ $BUILD_EXIT -ne 0 ]; then
    echo "================================"
    echo "ERROR: Build failed!"
    echo "================================"
    echo "Check logs above for details."
    exit 1
  fi

  echo "================================"
  echo "Build completed successfully"
  echo "================================"

  echo "Copying public and static files for standalone mode..."
  cp -r /app/public /app/.next/standalone/public
  mkdir -p /app/.next/standalone/.next
  cp -r /app/.next/static /app/.next/standalone/.next/static

  echo "Setup complete!"
else
  echo "Build already exists, skipping migration and build..."
fi

echo "================================"
echo "Starting application..."
echo "================================"
cd /app/.next/standalone
exec node server.js
EOSU
