#!/usr/bin/env sh
set -eu

FRONTEND_URL=${FRONTEND_URL:-http://127.0.0.1:3000}
BACKEND_URL=${BACKEND_URL:-http://127.0.0.1:3001}

wait_for() {
  name=$1
  url=$2
  attempts=${3:-60}
  i=1
  while [ "$i" -le "$attempts" ]; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      echo "OK: $name -> $url"
      return 0
    fi
    sleep 2
    i=$((i + 1))
  done
  echo "FAIL: $name did not become ready -> $url" >&2
  docker compose ps >&2 || true
  return 1
}

wait_for "backend readiness" "$BACKEND_URL/health/ready"
wait_for "frontend" "$FRONTEND_URL/"
wait_for "frontend-to-backend proxy" "$FRONTEND_URL/backend-health/ready"

echo "PawFeed smoke test passed."
