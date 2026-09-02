#!/bin/sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
PROJECT="pawfeed-integration"
COMPOSE="docker compose -p $PROJECT -f $ROOT/docker-compose.test.yml"
TEST_DB_PORT="${TEST_DB_PORT:-55432}"
DATABASE_URL="postgresql://pawfeed:pawfeed_test@127.0.0.1:${TEST_DB_PORT}/pawfeed_test?schema=public"
UPLOAD_DIR="${TMPDIR:-/tmp}/pawfeed-integration-uploads"

cleanup() {
  $COMPOSE down -v --remove-orphans >/dev/null 2>&1 || true
  rm -rf "$UPLOAD_DIR"
}
trap cleanup EXIT INT TERM

$COMPOSE up -d postgres-test

attempt=0
until $COMPOSE exec -T postgres-test pg_isready -U pawfeed -d pawfeed_test >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then
    echo "Integration PostgreSQL did not become ready" >&2
    exit 1
  fi
  sleep 1
done

cd "$ROOT/backend"
DATABASE_URL="$DATABASE_URL" npx prisma migrate deploy
DATABASE_URL="$DATABASE_URL" \
UPLOAD_DIR="$UPLOAD_DIR" \
NODE_ENV=test \
COOKIE_SECURE=false \
JWT_ACCESS_SECRET="integration-test-secret-12345678901234567890" \
npm run test:integration

echo "PawFeed backend integration verification passed."
