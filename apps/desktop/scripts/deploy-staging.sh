#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
APP_DIR="$ROOT/apps/desktop"
BUILT_APP="$APP_DIR/dist-app/mac-arm64/otto.app"
TARGET_APP="${OTTO_STAGING_APP:-/Applications/otto-staging.app}"
STAGING_ROOT="${OTTO_STAGING_ROOT:-$HOME/.codex/admin/otto-staging}"
HOME_DIR="$STAGING_ROOT/home"
OTTO_HOME_DIR="$STAGING_ROOT/otto-home"
PROFILE_DIR="$STAGING_ROOT/profile"
PORT="${OTTO_STAGING_PORT:-9445}"
BUNDLE_ID="${OTTO_STAGING_BUNDLE_ID:-haus.otto.desktop.staging}"

plist_set() {
  local plist="$1"
  local key="$2"
  local value="$3"
  /usr/libexec/PlistBuddy -c "Set :$key $value" "$plist" >/dev/null
}

plist_env_set() {
  local plist="$1"
  local key="$2"
  local value="$3"
  /usr/libexec/PlistBuddy -c "Set :LSEnvironment:$key $value" "$plist" >/dev/null 2>&1 \
    || /usr/libexec/PlistBuddy -c "Add :LSEnvironment:$key string $value" "$plist" >/dev/null
}

stamp_bundle() {
  local bundle="$1"
  local plist="$bundle/Contents/Info.plist"

  plist_set "$plist" CFBundleIdentifier "$BUNDLE_ID"
  plist_set "$plist" CFBundleDisplayName "otto staging"
  plist_set "$plist" CFBundleName "otto"
  plist_env_set "$plist" HOME "$HOME_DIR"
  plist_env_set "$plist" OTTO_HOME "$OTTO_HOME_DIR"
  plist_env_set "$plist" OTTO_SMOKE "1"
  plist_env_set "$plist" ELECTRON_ENABLE_LOGGING "1"

  plist_set "$bundle/Contents/Frameworks/otto Helper.app/Contents/Info.plist" CFBundleIdentifier "$BUNDLE_ID.helper"
  plist_set "$bundle/Contents/Frameworks/otto Helper (GPU).app/Contents/Info.plist" CFBundleIdentifier "$BUNDLE_ID.helper.GPU"
  plist_set "$bundle/Contents/Frameworks/otto Helper (Plugin).app/Contents/Info.plist" CFBundleIdentifier "$BUNDLE_ID.helper.Plugin"
  plist_set "$bundle/Contents/Frameworks/otto Helper (Renderer).app/Contents/Info.plist" CFBundleIdentifier "$BUNDLE_ID.helper.Renderer"
}

echo "==> Building otto desktop"
cd "$APP_DIR"
bun run electron:build
bunx electron-builder --mac dir --arm64

if [[ ! -d "$BUILT_APP" ]]; then
  echo "Built app not found: $BUILT_APP" >&2
  exit 1
fi

mkdir -p "$HOME_DIR" "$OTTO_HOME_DIR" "$PROFILE_DIR"

echo "==> Replacing staging app only: $TARGET_APP"
if pgrep -f "$TARGET_APP/Contents/MacOS/otto" >/dev/null 2>&1; then
  pkill -f "$TARGET_APP/Contents/MacOS/otto" || true
  sleep 1
fi
rm -rf "$TARGET_APP"
/usr/bin/ditto "$BUILT_APP" "$TARGET_APP"

echo "==> Stamping staging bundle and isolated runtime env"
stamp_bundle "$TARGET_APP"

echo "==> Ad-hoc signing staging app"
codesign --force --deep --sign - "$TARGET_APP" >/dev/null

echo "==> Opening staging app"
/usr/bin/open -n "$TARGET_APP" --args \
  "--user-data-dir=$PROFILE_DIR" \
  "--remote-debugging-port=$PORT"

for _ in {1..50}; do
  PID="$(pgrep -f "$TARGET_APP/Contents/MacOS/otto" | head -1 || true)"
  if [[ -n "$PID" ]]; then
    echo "staging_pid=$PID"
    echo "staging_app=$TARGET_APP"
    echo "home=$HOME_DIR"
    echo "otto_home=$OTTO_HOME_DIR"
    echo "profile=$PROFILE_DIR"
    echo "port=$PORT"
    exit 0
  fi
  sleep 0.2
done

echo "Staging app did not stay running: $TARGET_APP" >&2
exit 1
