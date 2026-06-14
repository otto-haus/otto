#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT/apps/desktop"
BUILT_APP="$APP_DIR/dist-app/mac-arm64/otto.app"
TARGET_APP="/Applications/otto.app"
LOG_DIR="${OTTO_LOG_DIR:-$HOME/.codex/admin/otto-logs}"
STAMP="$(date +%Y%m%dT%H%M%S)"
DEPLOY_LOG="$LOG_DIR/refresh-$STAMP.deploy.log"
APP_LOG="$LOG_DIR/refresh-$STAMP.app.log"
APP_LOG_CAPTURE_SECONDS="${OTTO_LOG_CAPTURE_SECONDS:-12}"
APP_LOG_PID=""
DEPLOY_LOCK_DIR="${OTTO_REFRESH_LOCK_DIR:-${OTTO_DESKTOP_DEPLOY_LOCK_DIR:-$LOG_DIR/desktop-deploy.lock}}"
SNAPSHOT_DIR=""
SNAPSHOT_APP=""
TMP_TARGET_APP=""

mkdir -p "$LOG_DIR"
ln -sfn "$DEPLOY_LOG" "$LOG_DIR/refresh-latest.deploy.log"
ln -sfn "$APP_LOG" "$LOG_DIR/refresh-latest.app.log"
exec > >(tee -a "$DEPLOY_LOG") 2>&1

if ! mkdir "$DEPLOY_LOCK_DIR" 2>/dev/null; then
  echo "Another task refresh is already running: $DEPLOY_LOCK_DIR" >&2
  exit 1
fi

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
  rmdir "$DEPLOY_LOCK_DIR" >/dev/null 2>&1 || true
}

trap cleanup EXIT

plist_env_set() {
  local plist="$1"
  local key="$2"
  local value="$3"
  /usr/libexec/PlistBuddy -c "Print :LSEnvironment" "$plist" >/dev/null 2>&1 \
    || /usr/libexec/PlistBuddy -c "Add :LSEnvironment dict" "$plist" >/dev/null
  /usr/libexec/PlistBuddy -c "Set :LSEnvironment:$key $value" "$plist" >/dev/null 2>&1 \
    || /usr/libexec/PlistBuddy -c "Add :LSEnvironment:$key string $value" "$plist" >/dev/null
}

stamp_live_bundle() {
  local bundle="$1"
  local plist="$bundle/Contents/Info.plist"

  plist_env_set "$plist" ELECTRON_ENABLE_LOGGING "1"
  plist_env_set "$plist" OTTO_LOG_DIR "$LOG_DIR"
  plist_env_set "$plist" OTTO_RUNTIME_TRANSPORT "ws"
  if [[ -f "${HOME}/.letta/settings.json" ]]; then
    plist_env_set "$plist" OTTO_LETTA_SETTINGS_PATH "${HOME}/.letta/settings.json"
  fi
  plist_env_set "$plist" OTTO_WS_REMOTE_ENV "${OTTO_WS_REMOTE_ENV:-otto-byor}"
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
}

register_bundle() {
  local bundle="$1"
  local lsregister="/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister"
  if [[ -x "$lsregister" ]]; then
    "$lsregister" -f "$bundle" >/dev/null 2>&1 || true
  fi
}

quit_live_app() {
  if pgrep -f "$TARGET_APP/Contents/MacOS/otto" >/dev/null 2>&1; then
    pkill -f "$TARGET_APP/Contents/MacOS/otto" || true
    for _ in {1..50}; do
      pgrep -f "$TARGET_APP/Contents/MacOS/otto" >/dev/null 2>&1 || return 0
      sleep 0.2
    done
    echo "otto.app is still running after quit request: $TARGET_APP" >&2
    return 1
  fi
}

kill_orphan_live_servers() {
  local pids=""
  pids="$(ps -axo pid=,ppid=,command= | awk '$2 == 1 && index($0, "letta-code/letta.js server --env-name otto-byor --debug") { print $1 }' || true)"
  if [[ -n "$pids" ]]; then
    echo "==> Killing orphan otto-byor Letta server processes: $pids"
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

echo "deploy_log=$DEPLOY_LOG"
echo "app_log=$APP_LOG"

if [[ "${OTTO_ALLOW_LIVE_REFRESH:-}" != "1" ]]; then
  cat >&2 <<'EOF'
Refusing to replace /Applications/otto.app without OTTO_ALLOW_LIVE_REFRESH=1.
Use `task staging` for the isolated app, or run:
  OTTO_ALLOW_LIVE_REFRESH=1 task refresh
EOF
  exit 2
fi

echo "==> Building otto desktop"
cd "$APP_DIR"
OTTO_READINESS_IGNORE_LOCAL_CONFIG=1 bun run electron:build
bunx electron-builder --mac dir --arm64

if [[ ! -d "$BUILT_APP" ]]; then
  echo "Built app not found: $BUILT_APP" >&2
  exit 1
fi

echo "==> Replacing $TARGET_APP"
verify_app_bundle "$BUILT_APP" "Built app"
SNAPSHOT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/otto-refresh.XXXXXX")"
SNAPSHOT_APP="$SNAPSHOT_DIR/otto.app"
echo "==> Snapshotting built app"
/usr/bin/ditto "$BUILT_APP" "$SNAPSHOT_APP"
verify_app_bundle "$SNAPSHOT_APP" "Snapshot app"
compare_app_bundle_outputs "$BUILT_APP" "$SNAPSHOT_APP" "Snapshot verification"

TMP_TARGET_APP="/Applications/.otto-refresh-$STAMP.app"
rm -rf "$TMP_TARGET_APP"
/usr/bin/ditto "$SNAPSHOT_APP" "$TMP_TARGET_APP"
verify_app_bundle "$TMP_TARGET_APP" "Temporary target app"
compare_app_bundle_outputs "$SNAPSHOT_APP" "$TMP_TARGET_APP" "Temporary target verification"

echo "==> Stamping live runtime env"
stamp_live_bundle "$TMP_TARGET_APP"

echo "==> Ad-hoc signing"
xattr -cr "$TMP_TARGET_APP" >/dev/null 2>&1 || true
chmod -R u+rwX,go+rX "$TMP_TARGET_APP"
codesign --force --deep --sign - "$TMP_TARGET_APP" >/dev/null
codesign --verify --deep --strict --verbose=2 "$TMP_TARGET_APP" >/dev/null
quit_live_app
kill_orphan_live_servers
rm -rf "/Applications/Otto.app"
rm -rf "$TARGET_APP"
mv "$TMP_TARGET_APP" "$TARGET_APP"
TMP_TARGET_APP=""
verify_app_bundle "$TARGET_APP" "Installed app"
compare_app_bundle_outputs "$SNAPSHOT_APP" "$TARGET_APP" "Installed app verification"

echo "==> Registering otto"
register_bundle "$TARGET_APP"

echo "==> Opening otto"
start_app_log_capture
if [[ -n "${OTTO_REFRESH_DEBUG_PORT:-}" ]]; then
  env -u ELECTRON_RUN_AS_NODE open -n "$TARGET_APP" --args "--remote-debugging-port=$OTTO_REFRESH_DEBUG_PORT"
else
  env -u ELECTRON_RUN_AS_NODE open "$TARGET_APP"
fi

echo "Refreshed $TARGET_APP"
echo "deploy_log=$DEPLOY_LOG"
echo "app_log=$APP_LOG"

TAIL_LOGS="${OTTO_TAIL_LOGS:-0}"
if [[ "$TAIL_LOGS" == "1" ]]; then
  echo "==> Tailing app logs to $APP_LOG (Ctrl-C to stop)"
  wait "$APP_LOG_PID" || true
elif [[ "$APP_LOG_CAPTURE_SECONDS" != "0" ]]; then
  echo "==> Capturing app logs for ${APP_LOG_CAPTURE_SECONDS}s to $APP_LOG"
  sleep "$APP_LOG_CAPTURE_SECONDS"
  stop_app_log_capture
else
  stop_app_log_capture
fi
