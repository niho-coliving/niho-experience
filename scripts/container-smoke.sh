#!/bin/sh
# Starts the image twice with different settings and checks that pages render
# and that indexing follows SITE_INDEXING at run time (one image, many environments).
# Usage: scripts/container-smoke.sh <image>
set -eu
image="$1"
port=18080
name="niho-experience-smoke"

cleanup() { docker rm -f "$name" >/dev/null 2>&1 || true; }
trap cleanup EXIT

start() {
  cleanup
  docker run -d --name "$name" -p "$port:8080" "$@" "$image" >/dev/null
  for _ in $(seq 1 30); do
    if curl -fsS "http://127.0.0.1:$port/robots.txt" >/dev/null 2>&1; then return 0; fi
    sleep 1
  done
  docker logs "$name" >&2
  echo "container did not start" >&2
  exit 1
}

check() {
  path="$1"; expected="$2"
  body=$(curl -fsS "http://127.0.0.1:$port$path")
  if ! printf '%s' "$body" | grep -qF -- "$expected"; then
    echo "FAIL $path: expected \"$expected\"" >&2
    exit 1
  fi
  echo "ok   $path contains \"$expected\""
}

start -e SITE_INDEXING=block
check / "Meet the people who make Kamakura home"
check /experiences/neighborhood-dinner-table "Home-style dinner at a neighborhood table"
check /robots.txt "Disallow: /"
check /host "starting with a small group of hosts"
test "$(docker exec "$name" id -u)" != "0" && echo "ok   runs as a non-root user"

start -e SITE_INDEXING=allow -e SITE_URL=https://experience.example.com \
  -e HOST_SIGNUP_MODE=open -e NIHO_HOST_START_URL=https://niho.example.com/start
check /robots.txt "Sitemap: https://experience.example.com/sitemap.xml"
check /host "Start with your NIHO account"
echo "container smoke test passed"
