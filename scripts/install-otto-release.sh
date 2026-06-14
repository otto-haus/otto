#!/usr/bin/env bash
# Issue #305 — canonical install of /Applications/otto.app from latest GitHub Release artifact.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="otto-haus/otto"
TARGET_APP="/Applications/otto.app"
if [[ -n "${OTTO_RELEASE_REPO:-}" && "${OTTO_RELEASE_REPO}" != "$REPO" ]]; then
  echo "Refusing OTTO_RELEASE_REPO override for canonical otto.app install: ${OTTO_RELEASE_REPO}" >&2
  exit 2
fi
if [[ -n "${OTTO_APP:-}" && "${OTTO_APP}" != "$TARGET_APP" ]]; then
  echo "Refusing OTTO_APP override for canonical otto.app install: ${OTTO_APP}" >&2
  echo "Use disposable bundles only with separate proof tooling, not the live release installer." >&2
  exit 2
fi

if [[ -n "${OTTO_RELEASE_WORK_DIR:-}" ]]; then
  WORK_DIR="$OTTO_RELEASE_WORK_DIR"
  CLEAN_WORK_DIR=0
else
  WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/otto-release-install.XXXXXX")"
  CLEAN_WORK_DIR=1
fi

cleanup() {
  if [[ -n "${MOUNTED_DMG:-}" ]]; then
    hdiutil detach "$MOUNTED_DMG" >/dev/null 2>&1 || true
  fi
  if [[ "${CLEAN_WORK_DIR:-0}" == "1" && -n "${WORK_DIR:-}" && -d "$WORK_DIR" && "${OTTO_RELEASE_KEEP_WORK_DIR:-}" != "1" ]]; then
    rm -rf "$WORK_DIR"
  fi
}
trap cleanup EXIT

if [[ "${OTTO_ALLOW_RELEASE_INSTALL:-}" != "1" ]]; then
  cat >&2 <<'EOF'
Refusing to install /Applications/otto.app without OTTO_ALLOW_RELEASE_INSTALL=1.

Canonical live install (GitHub Release artifact only):
  OTTO_ALLOW_RELEASE_INSTALL=1 task install:release

Agents must use task staging or a disposable bundle for proof — never mutate otto.app.
EOF
  exit 2
fi

echo "==> Resolving latest GitHub Release for $REPO"
RELEASE_JSON="$(curl -fsSL -H 'Accept: application/vnd.github+json' -H 'User-Agent: otto-install-release' \
  "https://api.github.com/repos/${REPO}/releases/latest")"

TAG="$(python3 - <<'PY' "$RELEASE_JSON"
import json, sys
print(json.loads(sys.argv[1]).get("tag_name") or "")
PY
)"

if [[ -z "$TAG" ]]; then
  echo "Latest release tag missing for $REPO" >&2
  exit 1
fi

ASSET_NAME="$(python3 - <<'PY' "$RELEASE_JSON"
import json, re, sys
data = json.loads(sys.argv[1])
assets = data.get("assets") or []
pat = re.compile(r"(?:^|/)(?:otto[-_.]?)?(?:v?\d[\w.-]*)?(?:desktop|mac)(?:[-_.][\w.-]+)?\.(?:zip|dmg)$", re.I)
for asset in assets:
    name = asset.get("name") or ""
    if pat.search(name):
        print(name)
        break
PY
)"

if [[ -z "$ASSET_NAME" ]]; then
  echo "Latest release $TAG has no desktop .app artifact (.zip/.dmg)." >&2
  python3 - <<'PY' "$RELEASE_JSON"
import json, sys
assets = [a.get("name") for a in (json.loads(sys.argv[1]).get("assets") or [])]
print("Published assets:", ", ".join(assets) or "(none)", file=sys.stderr)
PY
  echo "Publish a macOS desktop artifact on the release before installing otto.app." >&2
  exit 3
fi

echo "==> Downloading $ASSET_NAME ($TAG)"
mkdir -p "$WORK_DIR/download"
if command -v gh >/dev/null 2>&1; then
  gh release download "$TAG" -R "$REPO" -p "$ASSET_NAME" -D "$WORK_DIR/download"
else
  URL="$(python3 - <<'PY' "$RELEASE_JSON" "$ASSET_NAME"
import json, sys
data = json.loads(sys.argv[1])
target = sys.argv[2]
for asset in data.get("assets") or []:
    if asset.get("name") == target:
        print(asset.get("browser_download_url") or "")
        break
PY
)"
  curl -fsSL -o "$WORK_DIR/download/$ASSET_NAME" "$URL"
fi

DOWNLOAD_PATH="$WORK_DIR/download/$ASSET_NAME"
EXTRACT_DIR="$WORK_DIR/extract"
mkdir -p "$EXTRACT_DIR"

case "$ASSET_NAME" in
  *.zip)
    ditto -xk "$DOWNLOAD_PATH" "$EXTRACT_DIR"
    ;;
  *.dmg)
    MOUNTED_DMG="$WORK_DIR/mount"
    mkdir -p "$MOUNTED_DMG"
    hdiutil attach -nobrowse -readonly -mountpoint "$MOUNTED_DMG" "$DOWNLOAD_PATH" >/dev/null
    DMG_APP="$(find "$MOUNTED_DMG" -maxdepth 1 -name '*.app' -type d | head -1)"
    if [[ -z "$DMG_APP" ]]; then
      echo "Downloaded DMG did not contain a macOS .app bundle" >&2
      exit 1
    fi
    ditto "$DMG_APP" "$EXTRACT_DIR/otto.app"
    hdiutil detach "$MOUNTED_DMG" >/dev/null
    MOUNTED_DMG=""
    ;;
  *)
    echo "Unsupported desktop asset type: $ASSET_NAME" >&2
    exit 1
    ;;
esac

SOURCE_APP="$(find "$EXTRACT_DIR" -maxdepth 3 -name 'otto.app' -type d | head -1)"
if [[ -z "$SOURCE_APP" || ! -f "$SOURCE_APP/Contents/MacOS/otto" ]]; then
  echo "Downloaded artifact did not contain otto.app" >&2
  exit 1
fi

plist_env_set() {
  local plist="$1"
  local key="$2"
  local value="$3"
  /usr/libexec/PlistBuddy -c "Print :LSEnvironment" "$plist" >/dev/null 2>&1 \
    || /usr/libexec/PlistBuddy -c "Add :LSEnvironment dict" "$plist" >/dev/null
  /usr/libexec/PlistBuddy -c "Set :LSEnvironment:$key $value" "$plist" >/dev/null 2>&1 \
    || /usr/libexec/PlistBuddy -c "Add :LSEnvironment:$key string $value" "$plist" >/dev/null
}

echo "==> Installing release $TAG to $TARGET_APP"
TMP_TARGET="/Applications/.otto-release-${TAG//\//-}.app"
rm -rf "$TMP_TARGET"
ditto "$SOURCE_APP" "$TMP_TARGET"
plist_env_set "$TMP_TARGET/Contents/Info.plist" OTTO_RELEASE_TAG "$TAG"
plist_env_set "$TMP_TARGET/Contents/Info.plist" OTTO_BUILD_BRANCH "release/$TAG"
xattr -cr "$TMP_TARGET" >/dev/null 2>&1 || true
codesign --force --deep --sign - "$TMP_TARGET" >/dev/null
codesign --verify --deep --strict "$TMP_TARGET" >/dev/null

if pgrep -f "$TARGET_APP/Contents/MacOS/otto" >/dev/null 2>&1; then
  pkill -f "$TARGET_APP/Contents/MacOS/otto" || true
  sleep 1
fi

rm -rf "$TARGET_APP"
mv "$TMP_TARGET" "$TARGET_APP"

echo "installed_app=$TARGET_APP"
echo "release_tag=$TAG"
echo "asset=$ASSET_NAME"
echo "install_cmd=OTTO_ALLOW_RELEASE_INSTALL=1 task install:release"

if [[ "${OTTO_RELEASE_OPEN:-1}" == "1" ]]; then
  env -u ELECTRON_RUN_AS_NODE open "$TARGET_APP"
fi
