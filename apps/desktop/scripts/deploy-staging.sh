#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
APP_DIR="$ROOT/apps/desktop"
BUILT_APP="$APP_DIR/dist-app/mac-arm64/otto.app"
TARGET_APP="${OTTO_STAGING_APP:-/Applications/otto-staging.app}"
TARGET_APP_RESOLVED="$(node -e "const path = require('node:path'); console.log(path.resolve(process.argv[1]));" "$TARGET_APP")"
STAGING_ROOT="${OTTO_STAGING_ROOT:-$HOME/.codex/admin/otto-staging}"
HOME_DIR="$STAGING_ROOT/home"
OTTO_HOME_DIR="$STAGING_ROOT/otto-home"
PROFILE_DIR="$STAGING_ROOT/profile"
PORT="${OTTO_STAGING_PORT:-9445}"
BUNDLE_ID="${OTTO_STAGING_BUNDLE_ID:-haus.otto.desktop.staging}"
STAGING_LAUNCH="${OTTO_STAGING_LAUNCH:-background}"
APP_VERSION="$(node -p "require('$ROOT/package.json').version" 2>/dev/null || echo unknown)"

if [[ "$TARGET_APP_RESOLVED" == "/Applications/otto.app" || "$TARGET_APP_RESOLVED" == "/Applications/otto.app/"* ]]; then
  echo "Refusing to deploy to live app path: $TARGET_APP" >&2
  exit 1
fi

# Canonical /Applications/otto-staging.app is the release-candidate preview (#314).
# Refuse non-main checkouts unless OTTO_STAGING_REQUIRE_MAIN=0 is set explicitly.
if [[ "$TARGET_APP_RESOLVED" == "/Applications/otto-staging.app" && -z "${OTTO_STAGING_REQUIRE_MAIN+x}" ]]; then
  export OTTO_STAGING_REQUIRE_MAIN=1
fi

if [[ "${OTTO_STAGING_FETCH_MAIN:-1}" == "1" ]]; then
  echo "==> Fetching origin/main for source marker"
  git -C "$ROOT" fetch origin main 2>/dev/null || echo "WARN: could not fetch origin/main" >&2
fi

MAIN_SHA="$(git -C "$ROOT" rev-parse origin/main 2>/dev/null || echo unknown)"
MAIN_SHORT="$(git -C "$ROOT" rev-parse --short origin/main 2>/dev/null || echo unknown)"
BUILD_SHA="$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || echo unknown)"
BUILD_SHORT="$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo unknown)"

if [[ "$MAIN_SHA" != "unknown" && "$BUILD_SHA" != "$MAIN_SHA" ]]; then
  echo "WARN: build HEAD ($BUILD_SHORT) is not origin/main ($MAIN_SHORT)" >&2
  echo "staging_matches_main=false"
  if [[ "${OTTO_STAGING_REQUIRE_MAIN:-}" == "1" ]]; then
    echo "Refusing deploy: checkout main and fast-forward to origin/main first." >&2
    exit 1
  fi
else
  echo "staging_matches_main=true"
fi

if [[ "$TARGET_APP" == *"otto-staging"* ]]; then
  APP_CHANNEL="staging"
elif [[ "$TARGET_APP" == "/Applications/otto.app" ]]; then
  APP_CHANNEL="release"
else
  APP_CHANNEL="disposable"
fi

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

# Embedded Letta needs platform auth (LETTA_API_KEY) to boot the bundled CLI. Staging isolates
# OTTO_HOME under ~/.codex/admin/otto-staging/otto-home — it does not inherit shell env when
# launched via `open`. Seed otto's secret store from the deploy environment or canonical ~/.otto
# (same pattern as scripts/otto-clean-machine-e2e-smoke.cjs). Provider keys still live in Letta.
seed_staging_secrets() {
  local secrets_file="$OTTO_HOME_DIR/secrets.env"
  local key="${LETTA_API_KEY:-}"
  if [[ -z "$key" ]] && [[ -f "${HOME}/.otto/secrets.env" ]]; then
    while IFS= read -r line || [[ -n "$line" ]]; do
      local trimmed="${line#"${line%%[![:space:]]*}"}"
      trimmed="${trimmed%"${trimmed##*[![:space:]]}"}"
      if [[ -z "$trimmed" || "$trimmed" == \#* ]]; then
        continue
      fi
      if [[ "$trimmed" == LETTA_API_KEY=* ]]; then
        key="${trimmed#LETTA_API_KEY=}"
        break
      fi
    done < "${HOME}/.otto/secrets.env"
  fi
  if [[ -z "$key" ]]; then
    echo "WARN: no LETTA_API_KEY for staging — embedded runtime may show auth failed until configured" >&2
    return 0
  fi
  umask 077
  printf 'LETTA_API_KEY=%s\n' "$key" > "$secrets_file"
  chmod 600 "$secrets_file"
  echo "seeded_secrets=$secrets_file"
}

# Staging profile can accumulate placeholder agent ids (agent-primary) that block smoke init.
sanitize_staging_config() {
  local config_file="$OTTO_HOME_DIR/config.json"
  if [[ ! -f "$config_file" ]]; then
    return 0
  fi
  node - "$config_file" <<'NODE'
const fs = require('node:fs');
const path = process.argv[2];
let cfg = {};
try {
  cfg = JSON.parse(fs.readFileSync(path, 'utf8'));
} catch {
  process.exit(0);
}
const placeholders = new Set(['agent-primary', 'agent-legacy']);
const agentId = typeof cfg.agentId === 'string' ? cfg.agentId.trim() : '';
const primary = typeof cfg.primaryAgentId === 'string' ? cfg.primaryAgentId.trim() : '';
if (placeholders.has(agentId)) delete cfg.agentId;
if (placeholders.has(primary)) delete cfg.primaryAgentId;
if (cfg.connectionMode !== 'embedded') cfg.connectionMode = 'embedded';
fs.writeFileSync(path, `${JSON.stringify(cfg, null, 2)}\n`);
NODE
  echo "sanitized_config=$config_file"
}

apply_staging_icon() {
  local bundle="$1"
  local staging_icon="$APP_DIR/build/icon-staging.icns"
  local target_icon="$bundle/Contents/Resources/icon.icns"
  if [[ ! -f "$staging_icon" ]]; then
    echo "WARN: staging icon missing at $staging_icon — run node apps/desktop/scripts/generate-staging-icon.mjs" >&2
    return 1
  fi
  cp "$staging_icon" "$target_icon"
  echo "staging_icon=$target_icon"
}

stamp_bundle() {
  local bundle="$1"
  local plist="$bundle/Contents/Info.plist"
  local build_sha build_short build_branch build_time build_info_path

  build_sha="$BUILD_SHA"
  build_short="$BUILD_SHORT"
  build_branch="$(git -C "$ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
  build_time="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

  plist_set "$plist" CFBundleIdentifier "$BUNDLE_ID"
  plist_set "$plist" CFBundleDisplayName "otto staging"
  plist_set "$plist" CFBundleName "otto"
  plist_env_set "$plist" HOME "$HOME_DIR"
  plist_env_set "$plist" OTTO_HOME "$OTTO_HOME_DIR"
  plist_env_set "$plist" OTTO_PROFILE_PATH "$PROFILE_DIR"
  plist_env_set "$plist" OTTO_APP_PATH "$TARGET_APP"
  plist_env_set "$plist" OTTO_APP_CHANNEL "$APP_CHANNEL"
  plist_env_set "$plist" OTTO_APP_VERSION "$APP_VERSION"
  plist_env_set "$plist" OTTO_MAIN_SHA "$MAIN_SHA"
  plist_env_set "$plist" OTTO_MAIN_SHORT_SHA "$MAIN_SHORT"
  plist_env_set "$plist" OTTO_SMOKE "1"
  # Dogfood default: visible window so external resize (Rectangle) keeps input/paint.
  # Agent background launch temporarily overrides OTTO_WINDOW_MODE at open time only.
  plist_env_set "$plist" OTTO_WINDOW_MODE "${OTTO_WINDOW_MODE:-visible}"
  plist_env_set "$plist" ELECTRON_ENABLE_LOGGING "1"
  plist_env_set "$plist" OTTO_BUILD_SHA "$build_sha"
  plist_env_set "$plist" OTTO_BUILD_SHORT_SHA "$build_short"
  plist_env_set "$plist" OTTO_BUILD_TIME "$build_time"
  plist_env_set "$plist" OTTO_BUILD_BRANCH "$build_branch"
  build_info_path="$bundle/Contents/Resources/app/build-info.json"
  node - "$build_info_path" "$build_sha" "$build_short" "$build_time" "$build_branch" "$APP_CHANNEL" "$APP_VERSION" "$TARGET_APP" "$PROFILE_DIR" "$HOME_DIR" "$MAIN_SHA" "$MAIN_SHORT" <<'NODE'
const { writeFileSync } = require('node:fs');
const [
  path,
  sha,
  shortSha,
  builtAt,
  branch,
  channel,
  version,
  appPath,
  profilePath,
  homePath,
  mainSha,
  mainShortSha,
] = process.argv.slice(2);
writeFileSync(
  path,
  `${JSON.stringify({
    sha,
    shortSha,
    builtAt,
    branch,
    channel,
    version,
    appPath,
    profilePath,
    homePath,
    mainSha,
    mainShortSha,
  })}\n`,
);
NODE
  echo "build_marker=$build_short"
  echo "build_sha=$build_sha"
  echo "build_time=$build_time"
  echo "build_channel=$APP_CHANNEL"
  echo "origin_main=$MAIN_SHORT"
  # Embedded mode uses OTTO_HOME/letta — opt in to host settings for legacy staging only.
  if [[ "${OTTO_STAGING_USE_HOST_LETTA:-}" == "1" ]] && [[ -f "${HOME}/.letta/settings.json" ]]; then
    plist_env_set "$plist" OTTO_LETTA_SETTINGS_PATH "${HOME}/.letta/settings.json"
  fi
  if [[ -d "${ROOT}/checks" ]]; then
    plist_env_set "$plist" OTTO_ROOT "${ROOT}"
  fi
  if [[ -n "${OTTO_AGENT_ID:-}" ]]; then
    plist_env_set "$plist" OTTO_AGENT_ID "$OTTO_AGENT_ID"
  fi
  if [[ -n "${LETTA_BASE_URL:-}" ]]; then
    # Embedded "This Mac" spawns its own backend — never inject Letta Cloud into staging plist.
    if [[ "$LETTA_BASE_URL" =~ ^https?://(127\.0\.0\.1|localhost)(:[0-9]+)?(/|$) ]] \
      || [[ "$LETTA_BASE_URL" =~ ^local: ]]; then
      plist_env_set "$plist" LETTA_BASE_URL "$LETTA_BASE_URL"
    fi
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

  if [[ "$APP_CHANNEL" == "staging" ]]; then
    apply_staging_icon "$bundle"
  fi
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
seed_staging_secrets
sanitize_staging_config

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

OPEN_FLAGS=()
case "$STAGING_LAUNCH" in
  build-only)
    echo "staging_launch=build-only"
    echo "staging_app=$TARGET_APP"
    echo "home=$HOME_DIR"
    echo "otto_home=$OTTO_HOME_DIR"
    echo "profile=$PROFILE_DIR"
    echo "port=$PORT"
    exit 0
    ;;
  open)
    echo "==> Opening staging app (visible — may take focus)"
    ;;
  background)
    echo "==> Launching staging app in background (no focus steal)"
    plist_env_set "$TARGET_APP/Contents/Info.plist" OTTO_WINDOW_MODE "background"
    OPEN_FLAGS=(-g)
    ;;
  *)
    echo "WARN: unknown OTTO_STAGING_LAUNCH=$STAGING_LAUNCH — defaulting to background" >&2
    plist_env_set "$TARGET_APP/Contents/Info.plist" OTTO_WINDOW_MODE "background"
    OPEN_FLAGS=(-g)
    ;;
esac

/usr/bin/open -n "${OPEN_FLAGS[@]}" "$TARGET_APP" --args \
  "--user-data-dir=$PROFILE_DIR" \
  "--remote-debugging-port=$PORT"

if [[ "$STAGING_LAUNCH" == "background" ]]; then
  plist_env_set "$TARGET_APP/Contents/Info.plist" OTTO_WINDOW_MODE "visible"
fi

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
