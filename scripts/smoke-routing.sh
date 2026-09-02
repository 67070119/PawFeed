#!/bin/sh
set -eu

BACKEND_PORT="${BACKEND_PORT:-3001}"
BASE_URL="${BACKEND_URL:-http://127.0.0.1:${BACKEND_PORT}}"

for MODE in DRIVING WALKING CYCLING; do
  RESPONSE="$(curl --max-time 30 -fsS "${BASE_URL}/api/navigation/route?originLat=13.7285&originLng=100.7794&destinationLat=13.7291&destinationLng=100.7789&mode=${MODE}")"
  printf '%s' "$RESPONSE" | node -e '
    let input = "";
    process.stdin.on("data", (chunk) => input += chunk);
    process.stdin.on("end", () => {
      const payload = JSON.parse(input);
      const route = payload.data;
      if (!payload.success || !route || route.distanceMeters <= 0 || route.durationSeconds <= 0 || !Array.isArray(route.geometry) || route.geometry.length < 2) process.exit(1);
      console.log(`OK: ${route.mode} ${route.distanceMeters}m ${route.durationSeconds}s ${route.geometry.length} points`);
    });
  '
done

echo "PawFeed live routing smoke test passed."
