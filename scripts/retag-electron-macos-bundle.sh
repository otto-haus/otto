#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<'USAGE'
Usage: scripts/retag-electron-macos-bundle.sh <app-bundle> <bundle-id> [display-name] [bundle-name]

Retags a packaged macOS Electron .app and its helper apps, then ad-hoc signs it.
Use this when making a local staging copy with a different bundle identifier.
USAGE
}

if [[ $# -lt 2 || $# -gt 4 ]]; then
  usage
  exit 2
fi

BUNDLE="$1"
MAIN_BUNDLE_ID="$2"
DISPLAY_NAME="${3:-}"
BUNDLE_NAME="${4:-}"
PLIST="$BUNDLE/Contents/Info.plist"

if [[ ! -d "$BUNDLE" ]]; then
  echo "App bundle not found: $BUNDLE" >&2
  exit 1
fi

if [[ ! -f "$PLIST" ]]; then
  echo "Info.plist not found: $PLIST" >&2
  exit 1
fi

if [[ ! "$MAIN_BUNDLE_ID" =~ ^[A-Za-z0-9.-]+$ ]]; then
  echo "Invalid bundle id: $MAIN_BUNDLE_ID" >&2
  exit 1
fi

set_plist_value() {
  local plist="$1"
  local key="$2"
  local value="$3"
  /usr/libexec/PlistBuddy -c "Set :$key $value" "$plist" >/dev/null 2>&1 \
    || /usr/libexec/PlistBuddy -c "Add :$key string $value" "$plist" >/dev/null
}

set_plist_value "$PLIST" CFBundleIdentifier "$MAIN_BUNDLE_ID"
if [[ -n "$DISPLAY_NAME" ]]; then
  set_plist_value "$PLIST" CFBundleDisplayName "$DISPLAY_NAME"
fi
if [[ -n "$BUNDLE_NAME" ]]; then
  set_plist_value "$PLIST" CFBundleName "$BUNDLE_NAME"
fi

helper_plists=(
  "$BUNDLE/Contents/Frameworks/otto Helper.app/Contents/Info.plist"
  "$BUNDLE/Contents/Frameworks/otto Helper (GPU).app/Contents/Info.plist"
  "$BUNDLE/Contents/Frameworks/otto Helper (Plugin).app/Contents/Info.plist"
  "$BUNDLE/Contents/Frameworks/otto Helper (Renderer).app/Contents/Info.plist"
)
helper_ids=(
  "$MAIN_BUNDLE_ID.helper"
  "$MAIN_BUNDLE_ID.helper.GPU"
  "$MAIN_BUNDLE_ID.helper.Plugin"
  "$MAIN_BUNDLE_ID.helper.Renderer"
)

for i in "${!helper_plists[@]}"; do
  helper_plist="${helper_plists[$i]}"
  if [[ ! -f "$helper_plist" ]]; then
    echo "Electron helper Info.plist not found: $helper_plist" >&2
    exit 1
  fi
  set_plist_value "$helper_plist" CFBundleIdentifier "${helper_ids[$i]}"
done

codesign --force --deep --sign - "$BUNDLE" >/dev/null
echo "Retagged $BUNDLE as $MAIN_BUNDLE_ID"
