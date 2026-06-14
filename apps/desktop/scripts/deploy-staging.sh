#!/bin/bash
# Deploy the current desktop build to the STAGING otto ONLY.
# Never touches /Applications/otto.app — that is the user's live instance.
set -euo pipefail
cd "$(dirname "$0")/.."
STG=/Applications/otto-staging.app

OTTO_READINESS_IGNORE_LOCAL_CONFIG=1 bun run electron:build

# quit ONLY staging (leave the user's otto.app running)
pkill -f 'otto-staging.app/Contents/MacOS/otto' 2>/dev/null || true
sleep 1

rsync -a --delete out/ "$STG/Contents/Resources/app/out/"
/usr/libexec/PlistBuddy -c 'Set :CFBundleName otto staging' "$STG/Contents/Info.plist" 2>/dev/null || true
/usr/libexec/PlistBuddy -c 'Set :CFBundleDisplayName otto staging' "$STG/Contents/Info.plist" 2>/dev/null || true
/usr/libexec/PlistBuddy -c 'Set :CFBundleIdentifier haus.otto.desktop.staging' "$STG/Contents/Info.plist" 2>/dev/null || true
codesign --force --deep --sign - "$STG" >/dev/null 2>&1

mkdir -p /tmp/otto-staging-data
"$STG/Contents/MacOS/otto" --user-data-dir=/tmp/otto-staging-data >/tmp/otto-staging.log 2>&1 &
echo "deployed to STAGING (otto-staging.app). /Applications/otto.app untouched."
