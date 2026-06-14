#!/usr/bin/env bash
set -euo pipefail

status=0

section() {
  printf '\n==> %s\n' "$1"
}

require_command() {
  local name="$1"
  if command -v "$name" >/dev/null 2>&1; then
    printf 'ok: %s is available\n' "$name"
  else
    printf 'missing: %s is not on PATH\n' "$name"
    status=1
  fi
}

section "Required tools"
require_command git
require_command bun
require_command task

section "Pinned Bun version"
expected_bun="$(tr -d '[:space:]' < .bun-version)"
printf 'expected: %s (.bun-version)\n' "$expected_bun"

if command -v bun >/dev/null 2>&1; then
  actual_bun="$(bun --version)"
  printf 'actual:   %s (bun --version)\n' "$actual_bun"
  if [[ "$actual_bun" != "$expected_bun" ]]; then
    printf 'mismatch: bun version does not match .bun-version\n'
    status=1
  fi

  package_manager_bun="$(
    bun -e 'const pkg = await Bun.file("package.json").json(); console.log((pkg.packageManager ?? "").replace(/^bun@/, ""));'
  )"
  printf 'package:  %s (packageManager)\n' "$package_manager_bun"
  if [[ "$package_manager_bun" != "$expected_bun" ]]; then
    printf 'mismatch: packageManager does not match .bun-version\n'
    status=1
  fi
fi

section "Next gate"
printf 'run: task ci\n'

exit "$status"
