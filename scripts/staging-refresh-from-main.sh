#!/usr/bin/env bash
# Refresh /Applications/otto-staging.app from the current checkout, with origin/main source markers.
# Never touches /Applications/otto.app.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

export OTTO_STAGING_FETCH_MAIN=1

echo "==> staging:main — fetch origin/main, deploy otto-staging.app with source markers"
git -C "$ROOT" fetch origin main

HEAD_SHA="$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || echo unknown)"
MAIN_SHA="$(git -C "$ROOT" rev-parse origin/main 2>/dev/null || echo unknown)"

if [[ "$HEAD_SHA" != "$MAIN_SHA" && "$MAIN_SHA" != "unknown" ]]; then
  echo "NOTE: current HEAD is not origin/main." >&2
  echo "  HEAD:         $(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo unknown)" >&2
  echo "  origin/main:  $(git -C "$ROOT" rev-parse --short origin/main 2>/dev/null || echo unknown)" >&2
  echo "Deploy continues; UI will show 'not latest main'. To build exact main:" >&2
  echo "  git checkout main && git merge --ff-only origin/main && bash scripts/staging-refresh-from-main.sh" >&2
fi

exec bash "$ROOT/apps/desktop/scripts/deploy-staging.sh"
