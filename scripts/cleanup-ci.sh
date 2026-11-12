#!/bin/sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT"
if [ -f .ci/course-container-name ]; then
  NAME=$(cat .ci/course-container-name)
  case "$NAME" in pawfeed-ci-*) ;; *) echo 'Refusing unrelated cleanup target' >&2; exit 2;; esac
  if docker inspect "$NAME" >/dev/null 2>&1; then
    [ "$(docker inspect -f '{{index .Config.Labels "io.pawfeed.purpose"}}' "$NAME")" = verification ]
    mkdir -p .ci/results
    docker cp "$NAME:/workspace/PawFeed/.ci/results/." .ci/results/ >/dev/null 2>&1 || true
    docker rm -f -v "$NAME" >/dev/null
  fi
fi
