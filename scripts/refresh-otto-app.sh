#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT/apps/desktop"
BUILT_APP="$APP_DIR/dist-app/mac-arm64/otto.app"
TARGET_APP="/Applications/otto.app"

echo "==> Building otto desktop"
cd "$APP_DIR"
bun run electron:build
bunx electron-builder --mac dir --arm64

if [[ ! -d "$BUILT_APP" ]]; then
  echo "Built app not found: $BUILT_APP" >&2
  exit 1
fi

echo "==> Replacing $TARGET_APP"
osascript -e 'tell application "otto" to quit' >/dev/null 2>&1 || true
osascript -e 'tell application "Otto" to quit' >/dev/null 2>&1 || true
if pgrep -f "$TARGET_APP/Contents/MacOS/otto" >/dev/null 2>&1; then
  pkill -f "$TARGET_APP/Contents/MacOS/otto" || true
  sleep 1
fi
rm -rf "/Applications/Otto.app"
rm -rf "$TARGET_APP"
/usr/bin/ditto "$BUILT_APP" "$TARGET_APP"

echo "==> Ad-hoc signing"
codesign --force --deep --sign - "$TARGET_APP" >/dev/null

echo "==> Opening otto"
env -u ELECTRON_RUN_AS_NODE open "$TARGET_APP"

echo "Refreshed $TARGET_APP"
