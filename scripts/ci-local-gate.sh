#!/usr/bin/env bash
set -euo pipefail

expected_bun_version="$(tr -d '[:space:]' < .bun-version)"
actual_bun_version="$(bun --version)"

if [[ "$actual_bun_version" != "$expected_bun_version" ]]; then
  printf 'Bun version mismatch: expected %s from .bun-version, got %s\n' "$expected_bun_version" "$actual_bun_version" >&2
  exit 1
fi

bun run typecheck
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
bun test
bun run verify:v0
bun run docs:validate
bun run docs:links
OTTO_READINESS_IGNORE_LOCAL_CONFIG=1 bun run --cwd apps/desktop electron:build
bun audit
git diff --check
git diff --exit-code
