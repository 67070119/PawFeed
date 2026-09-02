#!/bin/sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
IMAGE="${COURSE_IMAGE:-tuchsanai/devtools:2569_1}"
NAME="pawfeed-course-$$"
RUN_E2E="${COURSE_RUN_E2E:-0}"

cleanup() {
  docker rm -f "$NAME" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

cd "$ROOT"
docker run -d --privileged \
  --name "$NAME" \
  -v "$ROOT:/source:ro" \
  "$IMAGE" \
  sh -c 'dockerd > /var/log/dockerd.log 2>&1 & tail -f /dev/null' >/dev/null

attempt=0
until docker exec "$NAME" docker info >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 60 ]; then
    echo "Docker daemon inside Course Container did not become ready" >&2
    docker logs "$NAME" >&2 || true
    exit 1
  fi
  sleep 1
done

docker exec "$NAME" sh -lc 'mkdir -p /workspace/PawFeed && tar -C /source --exclude=.git --exclude=*/node_modules --exclude=frontend/.next --exclude=tests/e2e/test-results --exclude=tests/e2e/playwright-report -cf - . | tar -C /workspace/PawFeed -xf -'

docker exec "$NAME" bash -lc 'set -e
  cd /workspace/PawFeed/backend
  npm ci --no-audit --no-fund
  npx prisma generate
  npm run lint
  npm test
  npm run build
  npm audit --audit-level=high
  cd ../frontend
  npm ci --no-audit --no-fund
  npm run lint
  npm run build
  npm audit --audit-level=high
  cd ..
  ./scripts/test-integration.sh
  docker compose config >/dev/null
  docker compose up -d --build
  ./scripts/smoke-test.sh
  ./scripts/verify-persistence.sh
  docker compose down -v --remove-orphans
'

if [ "$RUN_E2E" = "1" ]; then
  docker exec "$NAME" bash -lc 'cd /workspace/PawFeed && ./scripts/test-e2e.sh'
fi

echo "PawFeed Course Container verification passed using $IMAGE (E2E=$RUN_E2E)."
