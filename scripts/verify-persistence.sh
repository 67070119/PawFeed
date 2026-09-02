#!/usr/bin/env sh
set -eu

BASE_URL=${BASE_URL:-http://127.0.0.1:3000}
TMP_DIR=$(mktemp -d)
COOKIE_JAR="$TMP_DIR/cookies.txt"
IMAGE_FILE="$TMP_DIR/persist.png"
trap 'rm -rf "$TMP_DIR"' EXIT

# 1x1 PNG
printf '%s' 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2mL8AAAAASUVORK5CYII=' | base64 -d > "$IMAGE_FILE"

EMAIL="persist-$(date +%s)-$$@example.com"
PASSWORD='PawFeed1234'

curl -fsS -X POST "$BASE_URL/api/auth/register" \
  -H 'Content-Type: application/json' \
  --data "{\"name\":\"Persistence Check\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" >/dev/null

curl -fsS -c "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  --data "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" >/dev/null

CREATE_RESPONSE=$(curl -fsS -b "$COOKIE_JAR" -X POST "$BASE_URL/api/points" \
  -F 'animalType=DOG' \
  -F 'estimatedCount=2' \
  -F 'description=Persistence verification point' \
  -F 'latitude=13.7291' \
  -F 'longitude=100.7789' \
  -F 'usualTime=17:00 - 20:00' \
  -F "image=@$IMAGE_FILE;type=image/png")

POINT_ID=$(printf '%s' "$CREATE_RESPONSE" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{const j=JSON.parse(s);if(!j.success||!j.data?.id)process.exit(2);process.stdout.write(j.data.id)})")
IMAGE_URL=$(printf '%s' "$CREATE_RESPONSE" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{const j=JSON.parse(s);const u=j.data?.images?.[0]?.imageUrl;if(!u)process.exit(2);process.stdout.write(u)})")

curl -fsS -b "$COOKIE_JAR" -X POST "$BASE_URL/api/points/$POINT_ID/feedings" \
  -H 'Content-Type: application/json' \
  --data '{"note":"Persistence feeding"}' >/dev/null

curl -fsS -b "$COOKIE_JAR" -X POST "$BASE_URL/api/points/$POINT_ID/reports" \
  -H 'Content-Type: application/json' \
  --data '{"type":"STILL_HERE"}' >/dev/null

echo "Created persistence fixture: $POINT_ID"

docker compose restart postgres backend frontend >/dev/null
"$(dirname "$0")/smoke-test.sh"

DETAIL_RESPONSE=$(curl -fsS "$BASE_URL/api/points/$POINT_ID")
printf '%s' "$DETAIL_RESPONSE" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{const j=JSON.parse(s);if(!j.success)process.exit(2);const p=j.data;if(p.id!==process.argv[1])process.exit(3);if(!Array.isArray(p.feedings)||p.feedings.length<1)process.exit(4);if(!Array.isArray(p.reports)||p.reports.length<1)process.exit(5);})" "$POINT_ID"

curl -fsS "$BASE_URL$IMAGE_URL" >/dev/null

echo "Persistence verification passed: database records and uploaded image survived container restart."
