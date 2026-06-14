#!/usr/bin/env bash
# release-gate — fail-fast checks before tagging a public otto release.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

say() { printf '\n==> %s\n' "$*"; }

say "lint"
task lint

say "typecheck"
task typecheck

say "unit tests"
bun test

say "v0 verification"
task verify

say "desktop electron build"
OTTO_READINESS_IGNORE_LOCAL_CONFIG=1 bun run --cwd apps/desktop electron:build

say "regression checks"
# Security fix: Use mktemp to create a secure, unpredictable temporary file 
# and ensure cleanup via trap to prevent symlink/path traversal attacks.
TMP_LOG=$(mktemp)
trap 'rm -f "$TMP_LOG"' EXIT

if grep -R "WebkitMask\|maskImage\|dangerouslySetInnerHTML" apps/desktop/src apps/desktop/electron >"$TMP_LOG" 2>&1; then
  cat "$TMP_LOG"
  echo "release-gate: rejected broken icon/rendering mechanism" >&2
  exit 1
fi

if ! grep -R "coming soon" apps/desktop/src/App.tsx apps/desktop/src/surfaces/Panes.tsx >/dev/null; then
  echo "release-gate: coming-soon placeholder copy missing" >&2
  exit 1
fi

if ! grep -R "advanced overrides" apps/desktop/src/surfaces/Panes.tsx apps/desktop/src/Onboarding.tsx >/dev/null; then
  echo "release-gate: Letta connection copy must frame manual URL/agent fields as advanced overrides" >&2
  exit 1
fi

say "release gate passed"
