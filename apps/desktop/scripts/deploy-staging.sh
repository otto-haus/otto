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
APP_STEM="$(basename "$TARGET_APP" .app | tr '[:upper:]' '[:lower:]' | tr -cs '[:alnum:]' '-' | sed 's/^-//;s/-$//')"
REMOTE_ENV_NAME="${OTTO_STAGING_WS_REMOTE_ENV:-${APP_STEM:-otto-staging}-byor}"
DISPLAY_NAME="${OTTO_STAGING_DISPLAY_NAME:-otto staging}"
LOG_DIR="${OTTO_LOG_DIR:-$HOME/.codex/admin/otto-logs}"
LOCK_DIR="${OTTO_STAGING_LOCK_DIR:-${OTTO_DESKTOP_DEPLOY_LOCK_DIR:-$LOG_DIR/desktop-deploy.lock}}"
STAMP="$(date +%Y%m%dT%H%M%S)"
DEPLOY_LOG="$LOG_DIR/staging-$STAMP.deploy.log"
APP_LOG="$LOG_DIR/staging-$STAMP.app.log"
APP_LOG_CAPTURE_SECONDS="${OTTO_STAGING_LOG_CAPTURE_SECONDS:-10}"
APP_LOG_PID=""
SNAPSHOT_DIR=""
SNAPSHOT_APP=""
TMP_TARGET_APP=""

mkdir -p "$LOG_DIR"
ln -sfn "$DEPLOY_LOG" "$LOG_DIR/staging-latest.deploy.log"
ln -sfn "$APP_LOG" "$LOG_DIR/staging-latest.app.log"
exec > >(tee -a "$DEPLOY_LOG") 2>&1

cleanup_lock() {
  rmdir "$LOCK_DIR" >/dev/null 2>&1 || true
}

start_app_log_capture() {
  : > "$APP_LOG"
  log stream --level info --style compact --predicate 'process CONTAINS[c] "otto"' >> "$APP_LOG" 2>&1 &
  APP_LOG_PID="$!"
}

stop_app_log_capture() {
  if [[ -n "${APP_LOG_PID:-}" ]]; then
    kill "$APP_LOG_PID" >/dev/null 2>&1 || true
    wait "$APP_LOG_PID" >/dev/null 2>&1 || true
    APP_LOG_PID=""
  fi
}

cleanup() {
  stop_app_log_capture
  if [[ -n "${TMP_TARGET_APP:-}" ]]; then
    rm -rf "$TMP_TARGET_APP"
  fi
  if [[ -n "${SNAPSHOT_DIR:-}" ]]; then
    rm -rf "$SNAPSHOT_DIR"
  fi
  cleanup_lock
}

mkdir -p "$(dirname "$LOCK_DIR")"
if ! mkdir "$LOCK_DIR" >/dev/null 2>&1; then
  echo "Another staging deploy is already running: $LOCK_DIR" >&2
  exit 1
fi
trap cleanup EXIT

echo "deploy_log=$DEPLOY_LOG"
echo "app_log=$APP_LOG"

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
  /usr/libexec/PlistBuddy -c "Print :LSEnvironment" "$plist" >/dev/null 2>&1 \
    || /usr/libexec/PlistBuddy -c "Add :LSEnvironment dict" "$plist" >/dev/null
  /usr/libexec/PlistBuddy -c "Set :LSEnvironment:$key $value" "$plist" >/dev/null 2>&1 \
    || /usr/libexec/PlistBuddy -c "Add :LSEnvironment:$key string $value" "$plist" >/dev/null
}

stamp_bundle() {
  local bundle="$1"
  local plist="$bundle/Contents/Info.plist"

  plist_set "$plist" CFBundleIdentifier "$BUNDLE_ID"
  plist_set "$plist" CFBundleDisplayName "$DISPLAY_NAME"
  plist_set "$plist" CFBundleName "otto"
  plist_env_set "$plist" HOME "$HOME_DIR"
  plist_env_set "$plist" OTTO_HOME "$OTTO_HOME_DIR"
  plist_env_set "$plist" OTTO_SMOKE "1"
  plist_env_set "$plist" OTTO_RUNTIME_TRANSPORT "ws"
  plist_env_set "$plist" OTTO_LOG_DIR "$LOG_DIR"
  plist_env_set "$plist" OTTO_WS_REMOTE_ENV "$REMOTE_ENV_NAME"
  plist_env_set "$plist" ELECTRON_ENABLE_LOGGING "1"
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

register_bundle() {
  local bundle="$1"
  local lsregister="/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister"
  if [[ -x "$lsregister" ]]; then
    "$lsregister" -f "$bundle" >/dev/null 2>&1 || true
  fi
}

quit_staging_app() {
  if pgrep -f "$TARGET_APP/Contents/MacOS/otto" >/dev/null 2>&1; then
    pkill -f "$TARGET_APP/Contents/MacOS/otto" || true
    for _ in {1..25}; do
      pgrep -f "$TARGET_APP/Contents/MacOS/otto" >/dev/null 2>&1 || return 0
      sleep 0.2
    done
    echo "Staging app is still running after quit request: $TARGET_APP" >&2
    return 1
  fi
}

kill_orphan_staging_servers() {
  local pids=""
  pids="$(ps -axo pid=,ppid=,command= | awk -v env_name="$REMOTE_ENV_NAME" '$2 == 1 && index($0, "letta-code/letta.js server --env-name " env_name " --debug") { print $1 }' || true)"
  if [[ -n "$pids" ]]; then
    echo "==> Killing orphan $REMOTE_ENV_NAME Letta server processes: $pids"
    # shellcheck disable=SC2086
    kill $pids >/dev/null 2>&1 || true
  fi
}

verify_app_bundle() {
  local bundle="$1"
  local label="$2"
  local required=(
    "Contents/Info.plist"
    "Contents/MacOS/otto"
    "Contents/Resources/app/package.json"
    "Contents/Resources/app/out/main/index.cjs"
    "Contents/Resources/app/out/preload/index.cjs"
    "Contents/Resources/app/out/renderer/index.html"
  )
  local item
  for item in "${required[@]}"; do
    if [[ ! -e "$bundle/$item" ]]; then
      echo "$label missing required file: $item" >&2
      exit 1
    fi
  done
}

compare_app_bundle_outputs() {
  local source="$1"
  local target="$2"
  local label="$3"
  local outputs=(
    "Contents/Resources/app/out/renderer/index.html"
    "Contents/Resources/app/out/main/index.cjs"
    "Contents/Resources/app/out/preload/index.cjs"
  )
  local item
  for item in "${outputs[@]}"; do
    if ! cmp -s "$source/$item" "$target/$item"; then
      echo "$label failed: $item mismatch" >&2
      exit 1
    fi
  done
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
verify_app_bundle "$BUILT_APP" "Built app"
SNAPSHOT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/otto-staging.XXXXXX")"
SNAPSHOT_APP="$SNAPSHOT_DIR/otto.app"
echo "==> Snapshotting built app"
/usr/bin/ditto "$BUILT_APP" "$SNAPSHOT_APP"
verify_app_bundle "$SNAPSHOT_APP" "Snapshot app"
compare_app_bundle_outputs "$BUILT_APP" "$SNAPSHOT_APP" "Snapshot verification"

TMP_TARGET_APP="$(dirname "$TARGET_APP")/.${APP_STEM:-otto-staging}-refresh-$STAMP.app"
rm -rf "$TMP_TARGET_APP"
/usr/bin/ditto "$SNAPSHOT_APP" "$TMP_TARGET_APP"
verify_app_bundle "$TMP_TARGET_APP" "Temporary staging app"
compare_app_bundle_outputs "$SNAPSHOT_APP" "$TMP_TARGET_APP" "Temporary staging verification"

echo "==> Stamping staging bundle and isolated runtime env"
stamp_bundle "$TMP_TARGET_APP"

echo "==> Ad-hoc signing staging app"
xattr -cr "$TMP_TARGET_APP" >/dev/null 2>&1 || true
chmod -R u+rwX,go+rX "$TMP_TARGET_APP"
codesign --force --deep --sign - "$TMP_TARGET_APP" >/dev/null
codesign --verify --deep --strict --verbose=2 "$TMP_TARGET_APP" >/dev/null
quit_staging_app
kill_orphan_staging_servers
rm -rf "$TARGET_APP"
mv "$TMP_TARGET_APP" "$TARGET_APP"
TMP_TARGET_APP=""
verify_app_bundle "$TARGET_APP" "Installed staging app"
compare_app_bundle_outputs "$SNAPSHOT_APP" "$TARGET_APP" "Installed staging verification"

echo "==> Registering staging app"
register_bundle "$TARGET_APP"

echo "==> Opening staging app"
start_app_log_capture
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
    echo "deploy_log=$DEPLOY_LOG"
    echo "app_log=$APP_LOG"
    if [[ "$APP_LOG_CAPTURE_SECONDS" != "0" ]]; then
      echo "capturing_app_log_seconds=$APP_LOG_CAPTURE_SECONDS"
      sleep "$APP_LOG_CAPTURE_SECONDS"
    fi
    stop_app_log_capture
    exit 0
  fi
  sleep 0.2
done

echo "Staging app did not stay running: $TARGET_APP" >&2
exit 1
