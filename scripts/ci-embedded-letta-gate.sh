#!/usr/bin/env bash
# #678 — macOS CI release gate: package dir .app and run embedded-letta-smoke.sh.
# Does not launch Electron, mutate /Applications/otto.app, or require Letta provider keys.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export CSC_IDENTITY_AUTO_DISCOVERY="${CSC_IDENTITY_AUTO_DISCOVERY:-false}"
export OTTO_READINESS_IGNORE_LOCAL_CONFIG="${OTTO_READINESS_IGNORE_LOCAL_CONFIG:-1}"

echo "=== ci-embedded-letta-gate (#678) ==="
bun run --cwd apps/desktop electron:build
(cd apps/desktop && bunx electron-builder --mac dir --arm64)

APP="$ROOT/apps/desktop/dist-app/mac-arm64/otto.app"
if [[ ! -d "$APP" ]]; then
  echo "error: packaged app missing at $APP" >&2
  exit 1
fi

export OTTO_EMBEDDED_APP="$APP"
if [[ "${GITHUB_ACTIONS:-}" == "true" ]]; then
  export OTTO_RECEIPT_DIR="${OTTO_RECEIPT_DIR:-${RUNNER_TEMP:-/tmp}/otto-embedded-letta-receipts}"
fi

bash "$ROOT/scripts/embedded-letta-smoke.sh"
