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
  local build_sha build_short build_branch build_time build_info_path

  build_sha="$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || echo unknown)"
  build_short="$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo unknown)"
  build_branch="$(git -C "$ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
  build_time="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

  plist_set "$plist" CFBundleIdentifier "$BUNDLE_ID"
  plist_set "$plist" CFBundleDisplayName "otto staging"
  plist_set "$plist" CFBundleName "otto"
  plist_env_set "$plist" HOME "$HOME_DIR"
  plist_env_set "$plist" OTTO_HOME "$OTTO_HOME_DIR"
  plist_env_set "$plist" OTTO_SMOKE "1"
  plist_env_set "$plist" ELECTRON_ENABLE_LOGGING "1"
  plist_env_set "$plist" OTTO_BUILD_SHA "$build_sha"
  plist_env_set "$plist" OTTO_BUILD_SHORT_SHA "$build_short"
  plist_env_set "$plist" OTTO_BUILD_TIME "$build_time"
  plist_env_set "$plist" OTTO_BUILD_BRANCH "$build_branch"
  build_info_path="$bundle/Contents/Resources/app/build-info.json"
  node - "$build_info_path" "$build_sha" "$build_short" "$build_time" "$build_branch" <<'NODE'
const { writeFileSync } = require('node:fs');
const [path, sha, shortSha, builtAt, branch] = process.argv.slice(2);
writeFileSync(path, `${JSON.stringify({ sha, shortSha, builtAt, branch })}\n`);
NODE
  echo "build_marker=$build_short"
  echo "build_sha=$build_sha"
  echo "build_time=$build_time"
  # Letta discovery reads ~/.letta under isolated HOME — point at real settings for staging proof.
  if [[ -f "${HOME}/.letta/settings.json" ]]; then
    plist_env_set "$plist" OTTO_LETTA_SETTINGS_PATH "${HOME}/.letta/settings.json"
  fi
  if [[ -d "${ROOT}/checks" ]]; then
    plist_env_set "$plist" OTTO_ROOT "${ROOT}"
  fi
  if [[ -n "${OTTO_AGENT_ID:-}" ]]; then
    plist_env_set "$plist" OTTO_AGENT_ID "$OTTO_AGENT_ID"
  fi
  if [[ -n "${LETTA_BASE_URL:-}" ]]; then
    plist_env_set "$plist" LETTA_BASE_URL "$LETTA_BASE_URL"
  else
    local letta_port=""
    letta_port="$(lsof -nP -iTCP -sTCP:LISTEN 2>/dev/null | rg -i 'letta' | rg -o '127\.0\.0\.1:[0-9]+|localhost:[0-9]+' | head -1 | cut -d: -f2 || true)"
    if [[ -n "$letta_port" ]]; then
      plist_env_set "$plist" LETTA_BASE_URL "http://127.0.0.1:${letta_port}"
    fi
  fi

  plist_set "$bundle/Contents/Frameworks/otto Helper.app/Contents/Info.plist" CFBundleIdentifier "$BUNDLE_ID.helper"
  plist_set "$bundle/Contents/Frameworks/otto Helper (GPU).app/Contents/Info.plist" CFBundleIdentifier "$BUNDLE_ID.helper.GPU"
  plist_set "$bundle/Contents/Frameworks/otto Helper (Plugin).app/Contents/Info.plist" CFBundleIdentifier "$BUNDLE_ID.helper.Plugin"
  plist_set "$bundle/Contents/Frameworks/otto Helper (Renderer).app/Contents/Info.plist" CFBundleIdentifier "$BUNDLE_ID.helper.Renderer"
}

echo "==> Building otto desktop"
cd "$APP_DIR"
OTTO_READINESS_IGNORE_LOCAL_CONFIG=1 bun run electron:build
bunx electron-builder --mac dir --arm64

if [[ ! -d "$BUILT_APP" ]]; then
  echo "Built app not found: $BUILT_APP" >&2
  exit 1
fi

mkdir -p "$HOME_DIR" "$OTTO_HOME_DIR" "$PROFILE_DIR"

if [[ -d "${ROOT}/checks" ]]; then
  mkdir -p "$OTTO_HOME_DIR/checks"
  /usr/bin/ditto "${ROOT}/checks" "$OTTO_HOME_DIR/checks"
  echo "seeded_checks=$OTTO_HOME_DIR/checks"
fi

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
