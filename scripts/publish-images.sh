#!/bin/sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT"
: "${REGISTRY_NAMESPACE:?Set your Docker Hub namespace}"
: "${REGISTRY_USERNAME:?Set Docker Hub login username}"
: "${SOURCE_REVISION:?Set the full Git commit SHA}"
NAME=$(cat .ci/course-container-name)
[ "$(docker inspect -f '{{index .Config.Labels "io.pawfeed.purpose"}}' "$NAME")" = verification ]
docker exec "$NAME" grep -qx VERIFICATION_PASS /workspace/PawFeed/.ci/results/summary.txt
docker exec "$NAME" sh -c 'grep -qx state=clean /workspace/PawFeed/.ci/results/provenance.txt'
# Password arrives on stdin, never in argv or shell trace.
trap 'docker exec "$NAME" docker logout >/dev/null 2>&1 || true' EXIT
docker exec -i "$NAME" docker login --username "$REGISTRY_USERNAME" --password-stdin
for service in backend frontend; do
  target="$REGISTRY_NAMESPACE/pawfeed-$service:$SOURCE_REVISION"
  docker exec "$NAME" docker tag "pawfeed-$service:$SOURCE_REVISION" "$target"
  docker exec "$NAME" docker push "$target"
done
printf 'revision=%s\nprefix=%s/pawfeed\n' "$SOURCE_REVISION" "$REGISTRY_NAMESPACE" > .ci/results/published.txt
