#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${OTTO_SITE_PORT:-4321}"
SITE_DIR="$ROOT/site"

if [[ ! -f "$SITE_DIR/index.html" ]]; then
  echo "error: $SITE_DIR/index.html missing — marketing site not checked in" >&2
  exit 1
fi

echo "otto marketing site (static)"
echo "  open: http://127.0.0.1:${PORT}/"
echo "  dir:  $SITE_DIR"
echo ""
echo "Note: http://127.0.0.1 alone (port 80) will fail — use the URL above."

cd "$ROOT"
exec bunx --bun serve "$SITE_DIR" -l "$PORT"
