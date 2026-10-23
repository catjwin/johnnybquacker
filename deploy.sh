#!/usr/bin/env bash
# Builds the site and ships it to the winsorlabs VPS, where Caddy serves it as static files.
# Version is YYMMDD-a, -b, -c… per deploy that day (Europe/London).
set -euo pipefail
cd "$(dirname "$0")"

HOST=winsorlabs-deploy
REMOTE_DIR=/opt/winsorlabs/caddy/site/johnnybquacker   # /srv/site/johnnybquacker inside the Caddy container
URL=${SITE_URL:-https://jbq.winsorlabs.uk}

today=$(TZ=Europe/London date +%y%m%d)
last=$(ssh "$HOST" "cat $REMOTE_DIR/version.txt 2>/dev/null" || true)
if [[ $last =~ ^$today-([a-y])$ ]]; then
  next=$(echo "${BASH_REMATCH[1]}" | tr 'a-y' 'b-z')
elif [[ $last == "$today-z" ]]; then
  echo "Already at $today-z; no letters left today." >&2; exit 1
else
  next=a
fi
version="$today-$next"

SITE_VERSION=$version node build.mjs

ssh "$HOST" "mkdir -p $REMOTE_DIR"
rsync -az --delete --chmod=Du=rwx,Dgo=rx,Fu=rw,Fgo=r dist/ "$HOST:$REMOTE_DIR/"

served=$(curl -fsS "$URL/version.txt?nocache=$RANDOM" | tr -d '[:space:]')
if [[ $served != "$version" ]]; then
  echo "Deployed $version but $URL serves '$served'." >&2; exit 1
fi
echo "Live: $URL ($version)"
