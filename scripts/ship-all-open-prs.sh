#!/usr/bin/env bash
set -euo pipefail
MAX="${OTTO_PR_SHIP_MAX_PARALLEL:-1}"
LOG_DIR="${OTTO_PR_SHIP_LOG_DIR:-/tmp/otto-all-prs-ready}"
mkdir -p "$LOG_DIR"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORKER="$ROOT/scripts/ship-pr-worker.sh"

mapfile -t PRS < <(gh pr list --state open --limit 200 --json number --jq '.[].number | select(. != 413)')

running=0
for n in "${PRS[@]}"; do
  while (( running >= MAX )); do
    wait -n 2>/dev/null || wait
    ((running--)) || true
  done
  "$WORKER" "$n" &
  ((running++)) || true
  if (( MAX <= 1 )); then
    wait
    running=0
  fi
done
wait
