#!/bin/sh
set -eu

BACKEND_PORT="${BACKEND_PORT:-3001}"
BASE_URL="${BACKEND_URL:-http://127.0.0.1:${BACKEND_PORT}}"
MAX_ATTEMPTS="${ROUTING_SMOKE_ATTEMPTS:-3}"
RETRY_DELAY_SECONDS="${ROUTING_SMOKE_RETRY_DELAY_SECONDS:-2}"
TMP_DIR="${TMPDIR:-/tmp}/pawfeed-routing-smoke-$$"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT INT TERM
mkdir -p "$TMP_DIR"

verify_payload() {
  MODE="$1" FILE="$2" node -e '
    const fs = require("node:fs");
    const payload = JSON.parse(fs.readFileSync(process.env.FILE, "utf8"));
    const route = payload.data;
    if (!payload.success || !route || route.mode !== process.env.MODE || route.distanceMeters <= 0 || route.durationSeconds <= 0 || !Array.isArray(route.geometry) || route.geometry.length < 2) process.exit(1);
    console.log(`OK: ${route.mode} ${route.distanceMeters}m ${route.durationSeconds}s ${route.geometry.length} points`);
  '
}

for MODE in DRIVING WALKING CYCLING; do
  ATTEMPT=1
  PASSED=0
  while [ "$ATTEMPT" -le "$MAX_ATTEMPTS" ]; do
    FILE="$TMP_DIR/$MODE.json"
    HTTP_CODE="$(curl --max-time 35 -sS -o "$FILE" -w '%{http_code}' "${BASE_URL}/api/navigation/route?originLat=13.7285&originLng=100.7794&destinationLat=13.7291&destinationLng=100.7789&mode=${MODE}" || true)"

    if [ "$HTTP_CODE" = "200" ] && verify_payload "$MODE" "$FILE"; then
      PASSED=1
      break
    fi

    echo "WARN: live routing smoke failed mode=$MODE attempt=$ATTEMPT/$MAX_ATTEMPTS http=${HTTP_CODE:-network-error}" >&2
    if [ -s "$FILE" ]; then cat "$FILE" >&2; echo >&2; fi
    ATTEMPT=$((ATTEMPT + 1))
    if [ "$ATTEMPT" -le "$MAX_ATTEMPTS" ]; then sleep "$RETRY_DELAY_SECONDS"; fi
  done

  if [ "$PASSED" -ne 1 ]; then
    echo "FAIL: live routing smoke exhausted retries for $MODE" >&2
    exit 1
  fi
done

echo "PawFeed live routing smoke test passed."
