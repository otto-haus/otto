# Otto Workflow — Run One Ticket

You are executing exactly one Otto ticket.

## Input

Ticket path: {{ticket_path}}

## Prime directive

Ship the ticket, not the roadmap.

## Routing

Follow the ticket `Owner:` field:

```txt
Codex  = real reasoning
Claude = writing/UI/UX/craft
Cursor = everything else / default implementation
```

If you are not the routed executor, stop and hand off instead of improvising.

## Rules

1. Read `000-canonical.md`.
2. Read `000-index.md`.
3. Read the target ticket.
4. Inspect current repo state before touching files:

```sh
git status --short --branch
git diff --stat
```

5. Do not overwrite user changes.
6. **Do not quit, replace, or verify against live `/Applications/otto.app`.** Use Otto staging only:
   - canonical runbook: `docs/v1/runbooks/live-vs-staging.md` (dev vs staging vs live refresh)
   - smoke: `/Users/seb/.codex/admin/otto-staging/launch-otto-staging-smoke.sh`
   - deploy: `task staging` or `apps/desktop/scripts/deploy-staging.sh` → `/Applications/otto-staging.app`
7. Do not push, tag, publish, rename remotes, or commit unless explicitly approved.
8. Build only the ticket scope.
9. If unclear, write the ambiguity into the ticket and stop.
10. If blocked, stop with one blocker, best fix, and current evidence.
11. Do not claim connected/live/done unless verified by the ticket criteria.
12. Append an `## Execution receipt` section to the ticket file (include staging paths for any runtime proof).
13. Move the ticket to `_InReview`, then stop for independent review. Do not move the ticket to `_Done` yourself.

## Execution loop

### 1. Orient

Summarize:

- ticket outcome
- acceptance criteria
- files likely touched
- risks
- verification commands

### 2. Plan

Write a short implementation plan into the ticket under `## Execution plan` if useful.

### 3. Build

Implement the smallest working version that satisfies the ticket.

### 4. Verify

Run the ticket's verification commands.

If a command fails, fix or record the precise blocker.

### 5. Receipt

Append to the ticket file:

Execution receipt format:

```md
## Execution receipt

Status: pass | partial | blocked
Date:

## What changed

## Files changed

## Verification run

## Evidence

## Known limitations

Reviewer verdict: pending
```

### 6. Stop

Move the ticket file to `_InReview`, then stop for review. Do not continue to the next ticket.
