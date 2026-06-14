#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
APP_DIR="$ROOT/apps/desktop"
OUT="$ROOT/.github/assets/otto-desktop.png"
TMP_CONFIG="$ROOT/.tmp/otto-readme-screenshot"

mkdir -p "$(dirname "$OUT")" "$TMP_CONFIG"

cd "$APP_DIR"
OTTO_READINESS_IGNORE_LOCAL_CONFIG=1 bun run electron:build

export OTTO_ROOT="$ROOT"
export OTTO_CONFIG_DIR="$TMP_CONFIG"
export OTTO_SKIP_LETTA_LSOF=1
export OTTO_CAPTURE_README="$OUT"
export OTTO_CAPTURE_HASH="${OTTO_CAPTURE_HASH:-chat}"
export OTTO_CAPTURE_DELAY_MS="${OTTO_CAPTURE_DELAY_MS:-4500}"

# Prefer a real local Letta connection when available; smoke mode is staging-only.
if [[ "${OTTO_FORCE_SMOKE:-}" == "1" ]]; then
  export OTTO_SMOKE=1
fi

echo "Capturing README screenshot → $OUT"

if bunx electron out/main/index.cjs 2>/dev/null; then
  :
elif command -v "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" >/dev/null; then
  echo "Electron unavailable — falling back to headless Chrome over vite preview"
  bunx vite preview --port 5199 --host 127.0.0.1 >/tmp/otto-readme-preview.log 2>&1 &
  PREVIEW_PID=$!
  sleep 1
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    --headless=new --disable-gpu --hide-scrollbars \
    --window-size=1280,800 --screenshot="$OUT" \
    "http://127.0.0.1:5199/#chat" >/dev/null 2>&1 || true
  kill "$PREVIEW_PID" 2>/dev/null || true
else
  echo "Need Electron or Chrome to capture README screenshot" >&2
  exit 1
fi

if [[ ! -s "$OUT" ]]; then
  echo "Screenshot missing or empty: $OUT" >&2
  exit 1
fi

echo "Done: $OUT ($(wc -c < "$OUT" | tr -d ' ') bytes)"
