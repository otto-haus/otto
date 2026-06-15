#!/usr/bin/env bash
# Ship one open p0/p1 issue to "status: ready for review" via Cursor Auto agent.
set -euo pipefail

ISSUE="${1:?usage: ship-issue-worker.sh ISSUE_NUM [TITLE] [implement|babysit] [PR_NUM]}"
TITLE="${2:-}"
MODE="${3:-implement}"
PR_NUM="${4:-}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="${OTTO_SHIP_LOG_DIR:-/tmp/otto-p0p1-ship}"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/issue-${ISSUE}.log"

if [[ -z "$TITLE" ]]; then
  TITLE="$(gh issue view "$ISSUE" --json title -q .title 2>/dev/null || true)"
fi

if [[ "$MODE" == "babysit" ]]; then
  [[ -n "$PR_NUM" ]] || { echo "babysit mode requires PR number" >&2; exit 2; }
  PROMPT="Read ${ROOT}/AGENTS.md. Babysit open PR #${PR_NUM} for GitHub issue #${ISSUE}: ${TITLE}.
- Do NOT open a duplicate PR; fix CI on the existing branch
- Verify: bun run typecheck && bun run --cwd apps/desktop typecheck (plus targeted tests)
- Push fixes, poll gh pr checks until green
- PR body must include Fixes #${ISSUE}
- Apply label: status: ready for review
- Do NOT merge"
else
  PROMPT="Read ${ROOT}/AGENTS.md. Fix GitHub issue #${ISSUE}: ${TITLE}.
- One branch: fix/issue-${ISSUE}-slug or bug/${ISSUE}-slug
- Implement minimal fix + tests if warranted
- Verify: bun run typecheck && bun run --cwd apps/desktop typecheck (plus targeted tests)
- Open PR with Fixes #${ISSUE}, test plan, proof
- Push, wait for CI green (poll gh pr checks)
- Apply label: status: ready for review
- Do NOT merge"
fi

{
  echo "=== ship-issue-worker issue #${ISSUE} mode=${MODE} pr=${PR_NUM} $(date -Iseconds) ==="
  echo "$PROMPT"
  echo "---"
} >>"$LOG"

cd "$ROOT"
cursor agent -p --trust --force --model auto "$PROMPT" 2>&1 | tee -a "$LOG"
