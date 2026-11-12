#!/bin/sh
# Persistent, source-built demo INSIDE the course container. No registry login.
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
. "$ROOT/scripts/course-lib.sh"
cd "$ROOT"
NAME=pawfeed-course-source
WEB_PORT=${COURSE_WEB_PORT:-3400}
API_PORT=${COURSE_API_PORT:-3401}
MAIL_PORT=${COURSE_MAIL_PORT:-8425}
for port in "$WEB_PORT" "$API_PORT" "$MAIL_PORT"; do
  case "$port" in ''|*[!0-9]*) echo 'Ports must be integers from 1024 to 65535.' >&2; exit 2;; esac
  if ! [ "$port" -ge 1024 ] || ! [ "$port" -le 65535 ]; then
    echo 'Ports must be integers from 1024 to 65535.' >&2; exit 2
  fi
done
if [ "$WEB_PORT" = "$API_PORT" ] || [ "$WEB_PORT" = "$MAIL_PORT" ] || [ "$API_PORT" = "$MAIL_PORT" ]; then
  echo 'Web, API and mail ports must be distinct.' >&2; exit 2
fi
SOURCE_REVISION=${SOURCE_REVISION:-$(git rev-parse HEAD)}
SOURCE_STATE=${SOURCE_STATE:-$(if [ -z "$(git status --porcelain)" ]; then echo clean; else echo dirty; fi)}
docker info >/dev/null
if docker inspect "$NAME" >/dev/null 2>&1; then
  [ "$(docker inspect -f '{{index .Config.Labels "io.pawfeed.purpose"}}' "$NAME")" = source-demo ] || {
    echo 'Refusing to reuse an unrelated container.' >&2; exit 2
  }
  docker start "$NAME" >/dev/null
else
  docker run -d --privileged --name "$NAME" --restart unless-stopped \
    --label io.pawfeed.purpose=source-demo \
    -p "127.0.0.1:$WEB_PORT:3000" -p "127.0.0.1:$API_PORT:3001" -p "127.0.0.1:$MAIL_PORT:8025" \
    -v "$NAME-docker:/var/lib/docker" -v "$NAME-workspace:/workspace" \
    --entrypoint sh "$COURSE_IMAGE" \
    -c 'dockerd > /var/log/dockerd.log 2>&1 & exec tail -f /dev/null' >/dev/null
fi
for mapping in "3000:$WEB_PORT" "3001:$API_PORT" "8025:$MAIL_PORT"; do
  inner=${mapping%%:*}; outer=${mapping##*:}
  [ "$(docker port "$NAME" "$inner/tcp")" = "127.0.0.1:$outer" ] || {
    echo 'Existing source demo uses different ports. See README section 2.1.' >&2; exit 2
  }
done
wait_course_docker "$NAME"
# Keep the previous source copy for recovery. Extract into a fresh directory so
# files deleted from the new checkout cannot remain in the Docker build context.
# Only the generated course-side config is restored; host .env is never copied.
docker exec "$NAME" sh -c '
  set -eu
  if [ -f /workspace/PawFeed/.env ]; then
    cp -p /workspace/PawFeed/.env /workspace/pawfeed-source.env
  fi
  if [ -d /workspace/PawFeed ]; then
    mv /workspace/PawFeed "/workspace/PawFeed.previous-$(date +%s)-$$"
  fi
'
copy_course_source "$NAME"
docker exec "$NAME" sh -c '
  if [ -f /workspace/pawfeed-source.env ]; then
    cp -p /workspace/pawfeed-source.env /workspace/PawFeed/.env
  fi
'
docker exec -w /workspace/PawFeed "$NAME" sh scripts/setup.sh
docker exec -w /workspace/PawFeed -e "SOURCE_PUBLIC_URL=http://localhost:$WEB_PORT" "$NAME" node --input-type=module -e '
  import fs from "node:fs";
  let text = fs.readFileSync(".env", "utf8");
  const values = { COMPOSE_PROJECT_NAME: "pawfeed-source-demo", IMAGE_PREFIX: "pawfeed-source", IMAGE_TAG: "local",
    FRONTEND_PORT: "3000", BACKEND_PORT: "3001", MAILPIT_PORT: "8025", MAILPIT_BIND_HOST: "0.0.0.0",
    PUBLIC_FRONTEND_URL: process.env.SOURCE_PUBLIC_URL };
  for (const [key, value] of Object.entries(values)) {
    const re = new RegExp(`^${key}=.*$`, "m");
    const line = `${key}=${value}`;
    text = re.test(text) ? text.replace(re, () => line) : `${text}\n${line}\n`;
  }
  fs.writeFileSync(".env", text, { mode: 0o600 });
  fs.copyFileSync(".env", "/workspace/pawfeed-source.env");
'
docker exec -w /workspace/PawFeed "$NAME" docker compose -p pawfeed-source-demo up -d --build --wait --wait-timeout 240
docker exec -w /workspace/PawFeed -e COMPOSE_PROJECT_NAME=pawfeed-source-demo "$NAME" sh scripts/smoke-test.sh
docker exec -w /workspace/PawFeed "$NAME" docker compose -p pawfeed-source-demo ps
mkdir -p .ci
printf 'source=%s\nstate=%s\ncontainer=%s\nweb=http://localhost:%s\nmail=http://localhost:%s\n' \
  "$SOURCE_REVISION" "$SOURCE_STATE" "$NAME" "$WEB_PORT" "$MAIL_PORT" > .ci/course-source-demo.txt
cat .ci/course-source-demo.txt
echo 'Source demo remains running inside the course container. No automated test suite or registry publish was run.'
