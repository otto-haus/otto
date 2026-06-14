#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAGING_ROOT="${OTTO_STAGING_ROOT:-$HOME/.codex/admin/otto-staging}"
DEFAULT_BUILT_APP="$ROOT/apps/desktop/dist-app/mac-arm64/otto.app"
SOURCE_APP="${OTTO_STAGING_SOURCE_APP:-}"
BUNDLE="$STAGING_ROOT/otto-staging.app"
APP="$BUNDLE/Contents/MacOS/otto"
PLIST="$BUNDLE/Contents/Info.plist"
HOME_DIR="$STAGING_ROOT/home"
OTTO_HOME_DIR="$STAGING_ROOT/otto-home"
PROFILE_DIR="$STAGING_ROOT/profile"
LOG="$STAGING_ROOT/logs/otto-staging-$(date +%Y%m%dT%H%M%S).log"
PORT="${OTTO_STAGING_PORT:-9445}"
MAIN_BUNDLE_ID="${OTTO_STAGING_BUNDLE_ID:-haus.otto.desktop.admin-staging}"
DISPLAY_NAME="${OTTO_STAGING_DISPLAY_NAME:-otto admin staging}"

if [[ -z "$SOURCE_APP" ]]; then
  if [[ -d "$DEFAULT_BUILT_APP" ]]; then
    SOURCE_APP="$DEFAULT_BUILT_APP"
  else
    SOURCE_APP="/Applications/otto.app"
  fi
fi

if [[ ! -d "$SOURCE_APP" ]]; then
  echo "Source app not found: $SOURCE_APP" >&2
  echo "Build one with: bun run --cwd apps/desktop app:dir" >&2
  exit 1
fi

mkdir -p "$HOME_DIR" "$OTTO_HOME_DIR" "$PROFILE_DIR" "$STAGING_ROOT/logs"

set_plist_env() {
  local key="$1"
  local value="$2"
  /usr/libexec/PlistBuddy -c "Set :LSEnvironment:$key $value" "$PLIST" >/dev/null 2>&1 \
    || /usr/libexec/PlistBuddy -c "Add :LSEnvironment:$key string $value" "$PLIST" >/dev/null
}

EXISTING="$(pgrep -f "$APP" | head -1 || true)"
if [[ -n "$EXISTING" ]]; then
  printf '%s\n' "$EXISTING" > "$STAGING_ROOT/otto-staging.pid"
  printf 'pid=%s\napp=%s\nhome=%s\notto_home=%s\nprofile=%s\nlog=%s\nport=%s\nalready_running=1\n' \
    "$EXISTING" "$APP" "$HOME_DIR" "$OTTO_HOME_DIR" "$PROFILE_DIR" "$LOG" "$PORT"
  exit 0
fi

if [[ "${OTTO_STAGING_REFRESH:-1}" != "0" || ! -d "$BUNDLE" ]]; then
  rm -rf "$BUNDLE"
  cp -R "$SOURCE_APP" "$BUNDLE"
fi

"$ROOT/scripts/retag-electron-macos-bundle.sh" "$BUNDLE" "$MAIN_BUNDLE_ID" "$DISPLAY_NAME" "otto" >/dev/null

set_plist_env HOME "$HOME_DIR"
set_plist_env OTTO_HOME "$OTTO_HOME_DIR"
set_plist_env OTTO_SMOKE "1"
set_plist_env ELECTRON_ENABLE_LOGGING "1"
for key in OTTO_AGENT_ID LETTA_BASE_URL LETTA_CLI_PATH OTTO_MODEL OTTO_EFFORT; do
  if [[ -n "${!key:-}" ]]; then
    set_plist_env "$key" "${!key}"
  fi
done
codesign --force --deep --sign - "$BUNDLE" >/dev/null

env -u ELECTRON_RUN_AS_NODE /usr/bin/open -n -o "$LOG" --stderr "$LOG" "$BUNDLE" --args \
  "--user-data-dir=$PROFILE_DIR" \
  "--remote-debugging-port=$PORT"

for _ in {1..30}; do
  PID="$(pgrep -f "$APP" | head -1 || true)"
  if [[ -n "$PID" ]]; then
    printf '%s\n' "$PID" > "$STAGING_ROOT/otto-staging.pid"
    printf 'pid=%s\napp=%s\nhome=%s\notto_home=%s\nprofile=%s\nlog=%s\nport=%s\n' \
      "$PID" "$APP" "$HOME_DIR" "$OTTO_HOME_DIR" "$PROFILE_DIR" "$LOG" "$PORT"
    exit 0
  fi
  sleep 0.2
done

echo "Staging launch failed: no $APP process appeared" >&2
exit 1
