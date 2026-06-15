#!/usr/bin/env bash
set -euo pipefail
PR_NUMBER="${1:?usage: ship-pr-worker.sh PR_NUMBER}"
REPO="${OTTO_GH_REPO:-otto-haus/otto}"
LOG_DIR="${OTTO_PR_SHIP_LOG_DIR:-/tmp/otto-all-prs-ready}"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/pr-${PR_NUMBER}.log"

PROMPT="$(cat <<EOF
Babysit PR #${PR_NUMBER} for ${REPO}. Read AGENTS.md.
- Rebase on origin/main if conflicting; resolve minimally
- Fix CI failures on branch only
- Run bun run typecheck && bun run --cwd apps/desktop typecheck
- Ensure PR body has Fixes #N if issue-linked
- Push; poll until GitHub checks green
- Apply label: status: ready for review
- Do NOT merge. Report PR URL + CI status.
EOF
)"

{
  echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) ship-pr-worker PR #${PR_NUMBER} ==="
  cursor agent -p --trust --force --model auto "$PROMPT"
} 2>&1 | tee "$LOG"
