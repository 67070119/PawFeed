#!/bin/sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
. "$ROOT/scripts/course-lib.sh"
cd "$ROOT"
: "${REGISTRY_NAMESPACE:?Set Docker Hub namespace}"
: "${REGISTRY_USERNAME:?Set Docker Hub username}"
: "${SOURCE_REVISION:?Set immutable image tag / full commit SHA}"
NAME=${DEPLOY_CONTAINER_NAME:-pawfeed-course-demo}
WEB_PORT=${DEPLOY_FRONTEND_PORT:-3100}
API_PORT=${DEPLOY_BACKEND_PORT:-3101}
MAIL_PORT=${DEPLOY_MAILPIT_PORT:-8125}
PUBLIC_URL=${DEPLOY_PUBLIC_URL:-http://localhost:$WEB_PORT}
case "$NAME" in pawfeed-course-*) ;; *) echo 'Deployment name must start with pawfeed-course-' >&2; exit 2;; esac
case "$NAME" in *[!a-z0-9-]*) echo 'Invalid deployment container name' >&2; exit 2;; esac
if docker inspect "$NAME" >/dev/null 2>&1; then
  [ "$(docker inspect -f '{{index .Config.Labels "io.pawfeed.purpose"}}' "$NAME")" = deployment ] || { echo 'Refusing to reuse an unrelated container' >&2; exit 2; }
  docker start "$NAME" >/dev/null
else
  docker run -d --privileged --name "$NAME" --restart unless-stopped \
    --label io.pawfeed.purpose=deployment \
    -p "127.0.0.1:$WEB_PORT:3000" -p "127.0.0.1:$API_PORT:3001" -p "127.0.0.1:$MAIL_PORT:8025" \
    -v "$NAME-docker:/var/lib/docker" -v "$NAME-workspace:/workspace" \
    --entrypoint sh "$COURSE_IMAGE" \
    -c 'dockerd > /var/log/dockerd.log 2>&1 & exec tail -f /dev/null' >/dev/null
fi
for mapping in "3000:$WEB_PORT" "3001:$API_PORT" "8025:$MAIL_PORT"; do
  inner=${mapping%%:*}; outer=${mapping##*:}
  [ "$(docker port "$NAME" "$inner/tcp")" = "127.0.0.1:$outer" ] || { echo 'Existing deployment has different ports. See docs/devops/handoff.md.' >&2; exit 2; }
done
wait_course_docker "$NAME"
copy_course_source "$NAME"
docker exec -w /workspace/PawFeed "$NAME" sh scripts/setup.sh
# Update release metadata only; retain DB password/JWT and all persistent data.
docker exec -w /workspace/PawFeed \
  -e "RELEASE_PREFIX=$REGISTRY_NAMESPACE/pawfeed" -e "RELEASE_TAG=$SOURCE_REVISION" \
  -e "RELEASE_PUBLIC_URL=$PUBLIC_URL" "$NAME" node --input-type=module -e '
  import fs from "node:fs";
  let text = fs.readFileSync(".env", "utf8");
  const values = { IMAGE_PREFIX: process.env.RELEASE_PREFIX, IMAGE_TAG: process.env.RELEASE_TAG,
    FRONTEND_PORT: "3000", BACKEND_PORT: "3001", MAILPIT_PORT: "8025", MAILPIT_BIND_HOST: "0.0.0.0",
    PUBLIC_FRONTEND_URL: process.env.RELEASE_PUBLIC_URL };
  for (const [key, value] of Object.entries(values)) {
    if (/[\r\n]/.test(value)) throw new Error("Invalid release configuration");
    const line = `${key}=${value}`;
    const re = new RegExp(`^${key}=.*$`, "m");
    text = re.test(text) ? text.replace(re, () => line) : `${text}\n${line}\n`;
  }
  fs.writeFileSync(".env", text, { mode: 0o600 });
'
trap 'docker exec "$NAME" docker logout >/dev/null 2>&1 || true' EXIT
docker exec -i "$NAME" docker login --username "$REGISTRY_USERNAME" --password-stdin
docker exec -w /workspace/PawFeed "$NAME" docker compose -p pawfeed-demo pull
docker exec -w /workspace/PawFeed "$NAME" docker compose -p pawfeed-demo up -d --no-build --wait --wait-timeout 240
docker exec -w /workspace/PawFeed -e COMPOSE_PROJECT_NAME=pawfeed-demo "$NAME" sh scripts/smoke-test.sh
mkdir -p .ci/results
printf 'revision=%s\ncontainer=%s\nweb=%s\nmail=http://localhost:%s\nDEPLOYMENT_PASS\n' \
  "$SOURCE_REVISION" "$NAME" "$PUBLIC_URL" "$MAIL_PORT" > .ci/results/deployment.txt
cat .ci/results/deployment.txt
