#!/usr/bin/env bash
set -euo pipefail

status=0

while IFS= read -r script; do
  if bash -n "$script"; then
    printf 'ok: %s\n' "$script"
  else
    printf 'syntax error: %s\n' "$script" >&2
    status=1
  fi
done < <(git ls-files '*.sh')

exit "$status"
