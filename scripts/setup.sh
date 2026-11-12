#!/bin/sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT"
umask 077
if [ ! -f .env ]; then sed 's/\r$//' .env.example > .env; fi
# Replace placeholders only; never overwrite an existing user's secrets.
if grep -q '=GENERATE_WITH_SETUP' .env; then
  sed 's/\r$//' .env > .env.setup-tmp
  mv .env.setup-tmp .env
  secrets=$(docker run --rm node:22-alpine node -e 'const c=require("node:crypto"); console.log(c.randomBytes(32).toString("hex")); console.log(c.randomBytes(24).toString("hex"))')
  jwt=$(printf '%s\n' "$secrets" | sed -n '1p')
  db=$(printf '%s\n' "$secrets" | sed -n '2p')
  [ "${#jwt}" -eq 64 ] && [ "${#db}" -eq 48 ]
  sed -e "s/^JWT_ACCESS_SECRET=GENERATE_WITH_SETUP$/JWT_ACCESS_SECRET=$jwt/" \
      -e "s/^POSTGRES_PASSWORD=GENERATE_WITH_SETUP$/POSTGRES_PASSWORD=$db/" .env > .env.setup-tmp
  mv .env.setup-tmp .env
fi
docker compose config --quiet
echo 'Configuration ready. Existing .env values were preserved.'
