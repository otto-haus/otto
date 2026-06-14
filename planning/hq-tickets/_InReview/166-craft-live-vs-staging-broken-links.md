# 166 — docs/v1/runbooks/live-vs-staging.md: 2 broken links (wrong `../` depth)

Owner: Claude
Priority: P2
Depends on: none
Release bucket: later-generated

## Outcome

Both header cross-links in `docs/v1/runbooks/live-vs-staging.md` resolve. They
pointed two directories up (`../../`) when the file sits three deep
(`docs/v1/runbooks/`), so they landed in a non-existent `docs/planning/`; now
they correctly reach repo-root `planning/`.

## Why this matters

Docs accuracy — this runbook is the "canonical operator contract for where Otto
runs … and when the live app may be refreshed," and its two source-of-truth
links (the workflow ticket and the staging-rules `AGENTS.md`) were both dead.
The file is at `docs/v1/runbooks/`, so `../../planning/…` resolves to
`docs/planning/…` (404). The targets exist at repo-root `planning/…`; the link
needed one more `../`.

## Scope

- `docs/v1/runbooks/live-vs-staging.md`, two link URLs:
  `](../../planning/…)` → `](../../../planning/…)` (labels unchanged).
- Remove trailing whitespace from the edited `Related workflow` line so
  `git diff --check` passes.

## Out of scope

- Other docs with link slips (handled separately, e.g. `runtime-transport.md`
  in #170)
- Any prose/content change beyond the link targets and edited-line whitespace
  cleanup.

## Done when

- Both links resolve from `docs/v1/runbooks/` to existing files
- Labels unchanged

## Verification

```sh
git status --short --branch
for u in \
  ../../../planning/hq-tickets/_workflow-run-ticket.md \
  ../../../planning/hq-tickets/AGENTS.md; do
  test -e "$(python3 -c "import os;print(os.path.normpath('docs/v1/runbooks/'+'$u'))")" && echo ok
done
```

## Execution receipt

2026-06-14 Codex review/repair:

- Confirmed the committed docs diff changes the two
  `docs/v1/runbooks/live-vs-staging.md` header link targets and removes trailing
  whitespace from the edited `Related workflow` line; visible labels are
  unchanged.
- Confirmed both changed URLs resolve from `docs/v1/runbooks/`:
  `../../../planning/hq-tickets/_workflow-run-ticket.md` and
  `../../../planning/hq-tickets/AGENTS.md`.
- Confirmed no `](../../planning/...)` links remain in
  `docs/v1/runbooks/live-vs-staging.md`.
- Moved this ticket to `_InReview` after proof and expanded the verification
  snippet for readability.
- Checked open PR file overlap: no currently open PR overlaps this branch's
  changed files.
- Checked `git merge-tree $(git merge-base HEAD origin/ship/functional-labs) HEAD origin/ship/functional-labs`:
  no conflicts.
- Verification passed: `bun install --frozen-lockfile`; `bun run typecheck`;
  `bun run --cwd apps/desktop typecheck`; `bun run --cwd apps/desktop electron:typecheck`;
  `bun test` (223 pass, 1 skip, 0 fail); `bun run verify:v0` (5 passed, 0
  failed); `git diff --check`.
- Screenshots: N/A, docs-only markdown link target change.

## Blocker log

Leave blank unless blocked.
