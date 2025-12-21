#!/bin/sh
set -e

echo "Waiting for database to be ready..."
sleep 5

# Ensure .next directory exists and is writable
mkdir -p /app/.next
chown -R nextjs:nodejs /app/.next

# Check if we need to build (as root, before switching users)
if [ ! -d "/app/.next/standalone" ]; then
  NEED_BUILD=1
else
  NEED_BUILD=0
  echo "Build already exists, skipping migration and build..."
fi

# Switch to nextjs user for remaining operations
if [ "$NEED_BUILD" = "1" ]; then
  su-exec nextjs sh -c '
    set -e
    cd /app

    echo "================================"
    echo "Running database migrations..."
    echo "================================"

    if ! pnpm payload migrate; then
      echo "================================"
      echo "ERROR: Migration failed!"
      echo "================================"
      exit 1
    fi

    echo "================================"
    echo "Migrations completed successfully"
    echo "================================"

    echo "Running Next.js build with database access..."

    if ! pnpm run build; then
      echo "================================"
      echo "ERROR: Build failed!"
      echo "================================"
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
  '

  # Check if the build command succeeded
  if [ $? -ne 0 ]; then
    echo "Build or migration failed, exiting..."
    exit 1
  fi
fi

echo "================================"
echo "Starting application..."
echo "================================"

# Start the application as nextjs user
cd /app/.next/standalone
exec su-exec nextjs node server.js
