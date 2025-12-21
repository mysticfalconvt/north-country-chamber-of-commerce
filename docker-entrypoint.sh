#!/bin/sh
set -e

echo "Waiting for database to be ready..."
sleep 5

# Ensure .next and public/media directories exist and are writable
mkdir -p /app/.next
mkdir -p /app/public/media
chown -R nextjs:nodejs /app/.next /app/public/media

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

    # Run migrations with pnpm - let it fail loudly if there are real issues
    if pnpm payload migrate; then
      echo "================================"
      echo "Migrations completed successfully"
      echo "================================"
    else
      MIGRATE_EXIT_CODE=$?
      echo "================================"
      echo "ERROR: Migration failed with exit code $MIGRATE_EXIT_CODE"
      echo "================================"
      exit 1
    fi

    # Check if database needs seeding by checking if header/footer globals exist
    echo "Checking if database needs seeding..."
    cat > /tmp/check-seed.js <<'EOF'
import { getPayload } from 'payload'

(async () => {
  try {
    const configModule = await import('./src/payload.config.js')
    const config = configModule.default
    const payload = await getPayload({ config: await config })
    const header = await payload.findGlobal({ slug: 'header' })
    // If header has navItems, assume database is seeded
    if (header && header.navItems && header.navItems.length > 0) {
      console.log('false')
    } else {
      console.log('true')
    }
  } catch (e) {
    console.log('true')
  }
  process.exit(0)
})()
EOF
    NEEDS_SEED=$(node /tmp/check-seed.js 2>/dev/null || echo "true")

    if [ "$NEEDS_SEED" = "true" ]; then
      echo "================================"
      echo "Seeding database..."
      echo "================================"

      # Run seed script to populate globals and initial data
      # Use tsx to run TypeScript directly
      if ! pnpm exec tsx scripts/seed.ts; then
        echo "================================"
        echo "ERROR: Seeding failed!"
        echo "================================"
        exit 1
      fi

      echo "================================"
      echo "Seeding completed successfully"
      echo "================================"
    else
      echo "Database already seeded, skipping..."
    fi

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
