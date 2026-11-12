#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT"
sh scripts/setup.sh
docker compose up -d --build --wait --wait-timeout 240
sh scripts/smoke-test.sh
docker compose ps
