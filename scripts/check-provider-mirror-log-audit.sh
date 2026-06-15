#!/usr/bin/env bash
# Issue #96 / 078 — grep staging profile/home/logs for provider key substrings.
# Never prints matched secret values; reports path + pattern only.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAGING_ROOT="${OTTO_STAGING_ROOT:-$HOME/.codex/admin/otto-staging}"
SCAN_PATHS=(
  "$STAGING_ROOT/profile"
  "$STAGING_ROOT/home"
  "$STAGING_ROOT/logs"
)
PATTERNS=(
  'sk-[A-Za-z0-9_-]{10,}'
  'LETTA_API_KEY='
  'providerMirrorAuditFakeSecret'
)

existing=()
for path in "${SCAN_PATHS[@]}"; do
  if [[ -e "$path" ]]; then
    existing+=("$path")
  fi
done

if [[ "${#existing[@]}" -eq 0 ]]; then
  if [[ "${OTTO_RUN_STAGING_LOG_AUDIT:-}" == "1" ]]; then
    printf 'provider-mirror log audit: no staging paths under %s\n' "$STAGING_ROOT" >&2
    exit 1
  fi
  printf 'provider-mirror log audit: skip (no staging paths; set OTTO_RUN_STAGING_LOG_AUDIT=1 to require)\n'
  exit 0
fi

status=0
for path in "${existing[@]}"; do
  for pattern in "${PATTERNS[@]}"; do
    if rg -l --no-messages "$pattern" "$path" 2>/dev/null | head -1 | grep -q .; then
      printf 'provider-mirror log audit: pattern matched under %s\n' "$path" >&2
      status=1
    fi
  done
done

if [[ "$status" -ne 0 ]]; then
  printf 'Refusing: staging logs may contain provider key material.\n' >&2
  exit "$status"
fi

printf 'provider-mirror log audit: no key substrings in %d staging path(s)\n' "${#existing[@]}"
