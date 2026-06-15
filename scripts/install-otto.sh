#!/usr/bin/env bash
# macOS helper — clone or use cwd, install deps, optional extension + desktop launch hint.
# Safe: does not touch /Applications/otto.app, does not publish releases, no secrets.
set -euo pipefail

REPO_URL="${OTTO_REPO_URL:-https://github.com/otto-haus/otto.git}"
INSTALL_DIR="${OTTO_INSTALL_DIR:-}"
RUN_EXTENSION="${OTTO_INSTALL_EXTENSION:-0}"
LAUNCH_HINT="${OTTO_INSTALL_LAUNCH:-}"

say() { printf '%s\n' "$*"; }
need() {
  if ! command -v "$1" >/dev/null 2>&1; then
    say "Missing required tool: $1"
    say "  Install Bun: https://bun.sh"
    say "  Install go-task: brew install go-task"
    exit 1
  fi
}

need git
need bun

if [[ -z "$INSTALL_DIR" ]]; then
  if git -C "$(pwd)" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    ROOT="$(git -C "$(pwd)" rev-parse --show-toplevel)"
    say "==> Using existing clone: $ROOT"
  else
    INSTALL_DIR="${HOME}/Code/otto"
    say "==> Cloning into $INSTALL_DIR"
    mkdir -p "$(dirname "$INSTALL_DIR")"
    if [[ -d "$INSTALL_DIR/.git" ]]; then
      say "Directory exists; pulling latest"
      git -C "$INSTALL_DIR" pull --ff-only
    else
      git clone "$REPO_URL" "$INSTALL_DIR"
    fi
    ROOT="$INSTALL_DIR"
  fi
else
  ROOT="$INSTALL_DIR"
fi

cd "$ROOT"
say "==> Installing dependencies (frozen lockfile)"
bun install --frozen-lockfile

if command -v task >/dev/null 2>&1; then
  say "==> go-task OK ($(task --version 2>/dev/null || echo installed))"
else
  say "WARN: go-task not found — install with: brew install go-task"
fi

if [[ "$RUN_EXTENSION" == "1" ]]; then
  say "==> Installing Letta Code extension files"
  bun run install-extension
  say "    Run /reload in Letta Code when ready."
fi

say ""
say "Done. Next steps:"
say "  docs/install/getting-started.md  — full human install guide"
say ""
say "  task electron   # dev desktop (terminal stays open)"
say "  task staging    # packaged /Applications/otto-staging.app"
say ""
say "Letta: use embedded mode in onboarding (default) — no separate Letta Desktop required."
say "Provider keys belong in Letta, not otto."

case "$LAUNCH_HINT" in
  electron)
    say "==> Launching task electron"
    task electron
    ;;
  staging)
    say "==> Launching task staging (requires origin/main unless OTTO_STAGING_REQUIRE_MAIN=0)"
    task staging
    ;;
esac
