#!/usr/bin/env sh
set -eu

if [ "${1:-}" != "--yes" ]; then
  echo "Refusing destructive reset. Re-run with: ./scripts/reset.sh --yes"
  exit 2
fi

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT"
docker compose down -v --remove-orphans
rm -rf backend/uploads 2>/dev/null || true

echo "PawFeed containers and persistent Docker volumes removed."
