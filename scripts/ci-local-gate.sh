#!/usr/bin/env bash
set -euo pipefail

expected_bun_version="$(tr -d '[:space:]' < .bun-version)"
actual_bun_version="$(bun --version)"

if [[ "$actual_bun_version" != "$expected_bun_version" ]]; then
  printf 'Bun version mismatch: expected %s from .bun-version, got %s\n' "$expected_bun_version" "$actual_bun_version" >&2
  exit 1
fi

run_gate() {
  local label="$1"
  shift

  printf '\n==> %s\n' "$label"
  "$@"
}

run_gate "package manager pin" bun run check:package-manager
run_gate "core/practices typecheck" bun run typecheck
run_gate "desktop renderer typecheck" bun run --cwd apps/desktop typecheck
run_gate "desktop Electron typecheck" bun run --cwd apps/desktop electron:typecheck
run_gate "shell syntax check" bun run check:shell
run_gate "unit tests" bun test
run_gate "sensitive file paths" bun run check:sensitive-files
run_gate "v0 verifier" bun run verify:v0
run_gate "docs tool pins" bun run check:docs-tools
run_gate "docs validate" bun run docs:validate
run_gate "docs links" bun run docs:links
run_gate "desktop Electron build" env OTTO_READINESS_IGNORE_LOCAL_CONFIG=1 bun run --cwd apps/desktop electron:build
run_gate "dependency audit" bun audit
run_gate "diff whitespace check" git diff --check
run_gate "working tree clean check" git diff --exit-code
