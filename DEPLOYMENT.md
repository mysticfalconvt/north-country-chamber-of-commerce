# Deployment Guide

This guide explains how to deploy the North Country Chamber of Commerce website using Docker and GitHub Container Registry (GHCR).

## Overview

The application is containerized using Docker and automatically builds/publishes images to GitHub Container Registry when you push to the `main` branch. The Docker container includes automatic database migration support.

## Prerequisites

- Docker and Docker Compose installed
- GitHub repository with Actions enabled
- PostgreSQL database (included in docker-compose.prod.yml)

## Automatic CI/CD with GitHub Actions

### Setup

1. **GitHub Container Registry** is automatically enabled for your repository
2. The workflow in `.github/workflows/docker-publish.yml` will:
   - Build Docker images on every push to `main`
   - Tag images with branch name, commit SHA, and `latest`
   - Push to `ghcr.io/your-username/north-country-chamber-of-commerce`

### Triggering Builds

Images are built automatically when you:
- Push to the `main` branch
- Create a tag (e.g., `v1.0.0`)
- Create a pull request (builds but doesn't push)

## Production Deployment

### 1. Configure Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.prod.example .env.prod
```

Edit `.env.prod` and set:

```bash
# Database credentials
POSTGRES_PASSWORD=your_secure_password

# Payload CMS secret (minimum 32 characters)
PAYLOAD_SECRET=your_payload_secret_key_here_min_32_chars

# Your domain
PAYLOAD_PUBLIC_SERVER_URL=https://your-domain.com

# GitHub repository (for pulling the image)
GITHUB_REPOSITORY=your-github-username/north-country-chamber-of-commerce
IMAGE_TAG=latest  # or specific version like 'v1.0.0'
```

### 2. Deploy with Docker Compose

```bash
# Pull the latest image from GHCR
docker compose -f docker-compose.prod.yml pull

# Start the services
docker compose -f docker-compose.prod.yml up -d

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

### 3. Initial Setup

On first deployment, the container will automatically:
1. Wait for PostgreSQL to be ready
2. Run Payload CMS migrations
3. Start the application

Access the admin panel at: `https://your-domain.com/admin`

## Updating the Application

To update to a new version:

```bash
# Pull the latest image
docker compose -f docker-compose.prod.yml pull

# Recreate containers with new image
docker compose -f docker-compose.prod.yml up -d

# The entrypoint script will automatically run migrations
```

The Docker entrypoint script ensures migrations run automatically before the app starts, so you don't need to manually run migration commands.

## Database Migrations

Migrations are handled automatically by the Docker entrypoint script (`docker-entrypoint.sh`) which:
1. Waits 5 seconds for the database to be fully ready
2. Runs Payload CMS migrations
3. Starts the Next.js application

You can view migration logs:

```bash
docker compose -f docker-compose.prod.yml logs app
```

## Manual Docker Build (Optional)

If you want to build locally instead of using GHCR:

```bash
# Build the image
docker build -t chamber-app:local .

# Update docker-compose.prod.yml to use local image
# Change: image: ghcr.io/...
# To: image: chamber-app:local

# Then run docker-compose
docker compose -f docker-compose.prod.yml up -d
```

## Architecture

### Services

1. **postgres**: PostgreSQL 16 database with persistent volume
2. **app**: Next.js application with Payload CMS embedded

### Networking

- Services communicate via the `chamber_network` bridge network
- PostgreSQL is not exposed externally (only accessible to app container)
- Application is exposed on port 3000 (configurable via `APP_PORT`)

### Health Checks

- **PostgreSQL**: Checks `pg_isready` every 10s
- **Application**: HTTP check on `/api/health` every 30s (starts after 60s)

## Reverse Proxy Setup

For production, you should use a reverse proxy (nginx, Caddy, Traefik) in front of the application:

```nginx
# Example nginx configuration
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Monitoring

View application logs:

```bash
# All logs
docker compose -f docker-compose.prod.yml logs -f

# Just app logs
docker compose -f docker-compose.prod.yml logs -f app

# Just database logs
docker compose -f docker-compose.prod.yml logs -f postgres
```

Check container health:

```bash
docker compose -f docker-compose.prod.yml ps
```

## Backup

### Database Backup

```bash
# Backup
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U payload payload > backup.sql

# Restore
docker compose -f docker-compose.prod.yml exec -T postgres psql -U payload payload < backup.sql
```

### Media Files Backup

If storing media locally (not using S3), backup the media volume:

```bash
docker run --rm -v chamber_app_public:/data -v $(pwd):/backup alpine tar czf /backup/media-backup.tar.gz /data
```

## Troubleshooting

### Container won't start

Check logs:
```bash
docker compose -f docker-compose.prod.yml logs app
```

### Database connection issues

Ensure PostgreSQL is healthy:
```bash
docker compose -f docker-compose.prod.yml ps postgres
```

### Migrations failing

View migration errors:
```bash
docker compose -f docker-compose.prod.yml logs app | grep -i migration
```

Manually run migrations:
```bash
docker compose -f docker-compose.prod.yml exec app node node_modules/@payloadcms/db-postgres/dist/migrate.js
```

## Environment Variables Reference

See `.env.prod.example` for all available configuration options.

Required:
- `POSTGRES_PASSWORD`: Database password
- `PAYLOAD_SECRET`: Secret key for Payload CMS (min 32 chars)
- `PAYLOAD_PUBLIC_SERVER_URL`: Public URL of your site

Optional:
- `APP_PORT`: Application port (default: 3000)
- `S3_*`: S3/object storage configuration for media files
- `GITHUB_REPOSITORY`: Your repo path for pulling images
- `IMAGE_TAG`: Specific image version to deploy
