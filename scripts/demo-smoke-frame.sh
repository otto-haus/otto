#!/usr/bin/env bash
# Smoke-render frame 0 for Remotion compositions — no full MP4 (CI-safe).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEMO="$ROOT/demo"
OUT="$DEMO/out/smoke"
COMP="${1:-OttoProductDemo}"
FRAME="${2:-0}"

usage() {
  cat <<'EOF'
Usage: scripts/demo-smoke-frame.sh [composition] [frame]

Renders a single still to demo/out/smoke/ (gitignored). Default: OttoProductDemo frame 0.

Examples:
  bash scripts/demo-smoke-frame.sh
  bash scripts/demo-smoke-frame.sh OttoV01Channels 30
EOF
}

if [[ "$COMP" == "-h" || "$COMP" == "--help" ]]; then
  usage
  exit 0
fi

mkdir -p "$OUT"

if [[ ! -d "$DEMO/node_modules" ]]; then
  echo "Installing demo dependencies…" >&2
  (cd "$DEMO" && bun install)
fi

OUTFILE="$OUT/${COMP}-frame${FRAME}.png"
(cd "$DEMO" && bunx remotion still src/index.ts "$COMP" "$OUTFILE" --frame="$FRAME")

if [[ ! -s "$OUTFILE" ]]; then
  echo "Smoke frame missing or empty: $OUTFILE" >&2
  exit 1
fi

echo "Smoke frame OK: $OUTFILE ($(wc -c <"$OUTFILE" | tr -d ' ') bytes)"
