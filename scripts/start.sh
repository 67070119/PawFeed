#!/usr/bin/env sh
set -eu

docker compose up -d --build
"$(dirname "$0")/smoke-test.sh"
