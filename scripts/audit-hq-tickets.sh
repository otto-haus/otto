#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HQ="$ROOT/planning/hq-tickets"
OUT="$HQ/000-audit-status.md"
stub_done=0
{
  echo "# HQ ticket audit"
  echo
  echo "Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "Branch: $(git -C "$ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown) @ $(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo unknown)"
  echo
  echo "## Counts"
} > "$OUT"
for dir in _Done _Parked; do
  n=$(find "$HQ/$dir" -maxdepth 1 -name '*.md' 2>/dev/null | wc -l | tr -d ' ')
  echo "- \`$dir/\`: $n tickets" >> "$OUT"
done
count_root=$(find "$HQ" -maxdepth 1 -name '[0-9]*.md' 2>/dev/null | wc -l | tr -d ' ')
echo "- root queue: $count_root tickets" >> "$OUT"
{
  echo
  echo "## Stub _Done flags"
  echo
  echo "| Ticket | Issue |"
  echo "|--------|-------|"
} >> "$OUT"
while IFS= read -r f; do
  base=$(basename "$f")
  issue=""
  if ! grep -q '## Execution receipt' "$f" 2>/dev/null; then issue="no Execution receipt section"
  elif grep -qi 'Not run:' "$f" 2>/dev/null; then issue="Not run items in receipt"
  elif ! grep -q 'docs/receipts/staging/' "$f" 2>/dev/null; then issue="no staging receipt link"
  fi
  if [[ -n "$issue" ]]; then
    echo "| $base | $issue |" >> "$OUT"
    stub_done=$((stub_done + 1))
  fi
done < <(find "$HQ/_Done" -maxdepth 1 -name '*.md' | sort)
echo >> "$OUT"
echo "## Summary" >> "$OUT"
echo "- Flagged stubs in _Done: $stub_done" >> "$OUT"
echo "Wrote $OUT ($stub_done flagged stubs)"
