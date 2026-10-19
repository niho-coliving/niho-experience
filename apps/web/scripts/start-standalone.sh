#!/bin/sh
# Serves the production build exactly as the container does (see /Dockerfile).
# PORT and HOSTNAME select the address; other settings come from the environment.
set -eu
cd "$(dirname "$0")/.."
out=.next/standalone/apps/web
if [ ! -f "$out/server.js" ]; then
  echo "No production build found. Run \`npm run build\` first." >&2
  exit 1
fi
rm -rf "$out/.next/static" "$out/public"
cp -R .next/static "$out/.next/static"
cp -R public "$out/public"
exec node "$out/server.js"
