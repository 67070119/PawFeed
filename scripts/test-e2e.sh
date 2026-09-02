#!/bin/sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
PROJECT="pawfeed-e2e"
FRONTEND_PORT="${E2E_FRONTEND_PORT:-3200}"
BACKEND_PORT="${E2E_BACKEND_PORT:-3201}"
COMPOSE="docker compose -p $PROJECT -f $ROOT/docker-compose.yml"
PLAYWRIGHT_IMAGE="mcr.microsoft.com/playwright:v1.62.1-noble"

cleanup() {
  FRONTEND_PORT="$FRONTEND_PORT" BACKEND_PORT="$BACKEND_PORT" $COMPOSE down -v --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

FRONTEND_PORT="$FRONTEND_PORT" BACKEND_PORT="$BACKEND_PORT" $COMPOSE up -d --build

attempt=0
until curl -fsS "http://127.0.0.1:${FRONTEND_PORT}/backend-health/ready" >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 60 ]; then
    echo "E2E environment did not become ready" >&2
    FRONTEND_PORT="$FRONTEND_PORT" BACKEND_PORT="$BACKEND_PORT" $COMPOSE ps >&2 || true
    exit 1
  fi
  sleep 1
done

docker run --rm \
  --network "${PROJECT}_default" \
  -e E2E_BASE_URL="http://frontend:3000" \
  -v "$ROOT/tests/e2e:/src:ro" \
  -w /work \
  "$PLAYWRIGHT_IMAGE" \
  sh -lc 'cp -R /src/. /work/ && npm ci --no-audit --no-fund && npx playwright test'

echo "PawFeed Playwright E2E verification passed."
