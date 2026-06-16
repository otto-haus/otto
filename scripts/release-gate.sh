#!/usr/bin/env bash
# Release gate (063) — Sebastian approval required before push/tag.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== otto release gate (NOT PUSHED until Sebastian approves) ==="
bun run typecheck
bun test
bun run verify:v0
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck

echo ""
echo "Manual gates (human):"
echo "  - RELEASE_CHECKLIST.md reviewed"
echo "  - docs/v1/SHIP_STATUS.md matches reality"
echo "  - Embedded Letta smoke: bash scripts/embedded-letta-smoke.sh (CI job embedded-letta-release-gate on macOS)"
echo "  - Staging smoke: apps/desktop/scripts/deploy-staging.sh"
echo "  - Clean-machine E2E (pre-tag): NODE_PATH=\$HOME/.codex/admin/node_modules task smoke:clean-machine"
echo "  - CI green on PR (.github/workflows/ci.yml)"
echo ""
echo "NOT PUSHED — explicit Sebastian sign-off required for tag/publish."
