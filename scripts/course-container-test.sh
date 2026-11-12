#!/bin/sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
. "$ROOT/scripts/course-lib.sh"
cd "$ROOT"
mkdir -p .ci
if [ -d .ci/results ]; then mv .ci/results ".ci/results-$(date +%s)-$$"; fi
NAME="pawfeed-ci-$(date +%s)-$$"
SOURCE_REVISION=${SOURCE_REVISION:-$(git rev-parse HEAD)}
SOURCE_STATE=${SOURCE_STATE:-$(if [ -z "$(git status --porcelain)" ]; then echo clean; else echo dirty; fi)}
printf '%s\n' "$NAME" > .ci/course-container-name
finish() {
  code=$?
  trap - EXIT INT TERM
  mkdir -p .ci/results
  docker cp "$NAME:/workspace/PawFeed/.ci/results/." .ci/results/ >/dev/null 2>&1 || true
  if [ "${COURSE_KEEP_CONTAINER:-0}" != 1 ]; then
    docker rm -f -v "$NAME" >/dev/null 2>&1 || true
  fi
  exit "$code"
}
trap finish EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
docker info >/dev/null
docker run -d --privileged --name "$NAME" \
  --label io.pawfeed.purpose=verification \
  --entrypoint sh "$COURSE_IMAGE" \
  -c 'dockerd > /var/log/dockerd.log 2>&1 & exec tail -f /dev/null' >/dev/null
wait_course_docker "$NAME"
copy_course_source "$NAME"
mkdir -p .ci/results
# Exact outer image identity, in addition to source SHA and dirty/clean state.
docker image inspect "$COURSE_IMAGE" --format '{{.Id}} {{json .RepoDigests}}' > .ci/results/course-image.txt
docker exec \
  -e "SOURCE_REVISION=$SOURCE_REVISION" -e "SOURCE_STATE=$SOURCE_STATE" \
  -e "COURSE_IMAGE=$COURSE_IMAGE" -e "COURSE_RUN_E2E=${COURSE_RUN_E2E:-1}" \
  -e "CI_FAILURE_DEMO=${CI_FAILURE_DEMO:-false}" \
  -e "COURSE_RUN_LIVE_ROUTING=${COURSE_RUN_LIVE_ROUTING:-0}" \
  "$NAME" bash /workspace/PawFeed/scripts/course-verify.sh
echo "PawFeed course verification passed: $SOURCE_REVISION ($SOURCE_STATE)."
