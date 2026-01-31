#!/bin/bash
# Script to seed the database via API endpoint
# Usage: ./seed-via-api.sh [server-url] [token]
#
# Examples:
#   ./seed-via-api.sh http://localhost:3000 your-token-here
#   ./seed-via-api.sh https://chamber.example.com your-production-token

set -e

SERVER_URL="${1:-http://localhost:3000}"
SEED_TOKEN="${2}"

if [ -z "$SEED_TOKEN" ]; then
  echo "Error: SEED_TOKEN is required"
  echo "Usage: $0 [server-url] <token>"
  echo ""
  echo "Example:"
  echo "  $0 http://localhost:3000 my-secret-token"
  exit 1
fi

echo "Seeding database at: $SERVER_URL"
echo "Calling POST $SERVER_URL/api/seed..."
echo ""

response=$(curl -s -w "\n%{http_code}" -X POST \
  "$SERVER_URL/api/seed" \
  -H "Authorization: Bearer $SEED_TOKEN" \
  -H "Content-Type: application/json")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
  echo "✅ Success!"
  echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
  echo "❌ Failed with HTTP $http_code"
  echo "$body" | jq '.' 2>/dev/null || echo "$body"
  exit 1
fi
