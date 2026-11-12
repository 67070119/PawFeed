#!/bin/bash
# Runs INSIDE a disposable course container only.
set -euo pipefail
cd /workspace/PawFeed
mkdir -p .ci/results
RESULTS="$PWD/.ci/results"
diagnostics() {
  code=$?
  if [ "$code" -ne 0 ]; then
    docker compose ps -a > "$RESULTS/compose-status.txt" 2>&1 || true
    docker compose logs --no-color --tail=100 > "$RESULTS/compose-runtime.log" 2>&1 || true
  fi
}
trap diagnostics EXIT
printf 'source=%s\nstate=%s\ncourse_image=%s\n' "${SOURCE_REVISION:-unknown}" "${SOURCE_STATE:-unknown}" "${COURSE_IMAGE:-unknown}" > "$RESULTS/provenance.txt"
date -u '+started=%Y-%m-%dT%H:%M:%SZ' >> "$RESULTS/provenance.txt"
: > "$RESULTS/summary.txt"
run_gate() {
  local name=$1 code
  shift
  echo "=== $name ==="
  set +e
  "$@" 2>&1 | tee "$RESULTS/$name.log"
  code=${PIPESTATUS[0]}
  set -e
  printf '%s exit=%s\n' "$name" "$code" >> "$RESULTS/summary.txt"
  if [ "$code" -ne 0 ]; then return "$code"; fi
}
run_gate setup sh scripts/setup.sh
# Never read a developer's .env: copy_course_source excludes it.
export COMPOSE_PROJECT_NAME=pawfeed-ci
export IMAGE_TAG="${SOURCE_REVISION:-verification}"
run_gate backend-install bash -c 'cd backend && npm ci --no-audit --no-fund && npx prisma generate'
run_gate frontend-install bash -c 'cd frontend && npm ci --no-audit --no-fund'
run_gate lint bash -c 'cd backend && npm run lint && cd ../frontend && npm run lint'
if [ "${CI_FAILURE_DEMO:-false}" = true ]; then
  printf "import { test, expect } from '@jest/globals';\ntest('controlled CI failure blocks delivery', () => expect(true).toBe(false));\n" > backend/tests/unit/ci-intentional-failure.test.js
fi
run_gate unit bash -c 'cd backend && npm test -- --ci --json --outputFile=../.ci/results/unit.json'
run_gate integration sh scripts/test-integration.sh
run_gate application-build bash -c 'cd backend && npm run build && cd ../frontend && npm run build'
run_gate security-audit bash -c 'cd backend && npm audit --audit-level=high && cd ../frontend && npm audit --audit-level=high'
run_gate compose-build docker compose build
run_gate compose-start docker compose up -d --wait --wait-timeout 240
run_gate smoke sh scripts/smoke-test.sh
run_gate persistence sh scripts/verify-persistence.sh
if [ "${COURSE_RUN_E2E:-1}" = 1 ]; then
  run_gate browser-e2e sh scripts/test-e2e.sh
fi
if [ "${COURSE_RUN_LIVE_ROUTING:-0}" = 1 ]; then
  run_gate live-routing sh scripts/smoke-routing.sh
fi
run_gate cleanup docker compose down -v --remove-orphans
printf 'VERIFICATION_PASS\n' >> "$RESULTS/summary.txt"
date -u '+finished=%Y-%m-%dT%H:%M:%SZ' >> "$RESULTS/provenance.txt"
