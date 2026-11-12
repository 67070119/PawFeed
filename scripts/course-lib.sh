#!/bin/sh
# Shared outer-Docker helpers. Callers set ROOT before sourcing this file.
COURSE_IMAGE=${COURSE_IMAGE:-tuchsanai/devtools:2569_1}
wait_course_docker() {
  course_name=$1
  attempt=0
  until docker exec "$course_name" docker info >/dev/null 2>&1; do
    attempt=$((attempt + 1))
    if [ "$attempt" -ge 120 ]; then
      docker logs "$course_name" >&2 || true
      docker exec "$course_name" tail -n 80 /var/log/dockerd.log >&2 || true
      echo 'Docker-in-Docker did not become ready.' >&2
      return 1
    fi
    sleep 1
  done
}
copy_course_source() {
  course_name=$1
  mkdir -p "$ROOT/.ci"
  bundle="$ROOT/.ci/source-$$.tar"
  # No host secrets, Git metadata, dependencies, builds, uploads or old evidence.
  tar --exclude=.git --exclude=.ci --exclude=node_modules --exclude=.next \
    --exclude=.env --exclude='.env.*' --exclude='*.env' --exclude=uploads \
    --exclude=test-results --exclude=playwright-report --exclude=coverage \
    -C "$ROOT" -cf "$bundle" .
  docker cp "$bundle" "$course_name:/tmp/pawfeed-source.tar"
  rm -f "$bundle"
  docker exec "$course_name" sh -c 'mkdir -p /workspace/PawFeed && tar -C /workspace/PawFeed -xf /tmp/pawfeed-source.tar && rm /tmp/pawfeed-source.tar'
  # Template is public; it was deliberately excluded with all .env.* files above.
  docker cp "$ROOT/.env.example" "$course_name:/workspace/PawFeed/.env.example"
  docker exec "$course_name" sh -c 'find /workspace/PawFeed/scripts -name "*.sh" -exec sed -i "s/\r$//" {} \; && chmod +x /workspace/PawFeed/scripts/*.sh'
}
