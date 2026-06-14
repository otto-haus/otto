#!/usr/bin/env bash
set -euo pipefail

bun run typecheck
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
bun test
bun run verify:v0
bun run --cwd apps/desktop electron:build
bun audit
git diff --check
