#!/usr/bin/env bash
set -euo pipefail

base_ref="${BIOME_CHANGED_BASE:-origin/main}"
files=()

while IFS= read -r file; do
  [[ -n "$file" ]] && files+=("$file")
done < <(
  git diff --name-only --diff-filter=ACMRT "${base_ref}...HEAD" -- \
    apps/desktop/src \
    apps/desktop/electron \
    packages
)

if [[ "${#files[@]}" -eq 0 ]]; then
  echo "No changed app/package files to lint against ${base_ref}."
  exit 0
fi

bunx --bun @biomejs/biome@1.9.4 lint "${files[@]}"
