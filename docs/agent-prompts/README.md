# Agent operating prompts

These prompts define the current otto GitHub-Issues + Project-board operating loop.

Core rule:

```txt
Auditors create/verify issues. Composer fixes. Sebastian merges/releases only at one-way doors.
```

Merge and review gates are **per ticket / per PR** — they pause only that issue. The lane continues on the next file-disjoint Ready issue. Shared contract: `docs/agent-goals/README.md`. GoalBuddy board: `docs/goals/github-ready-loop/`.

## Files

- `codex-auditor-reviewer.md` — correctness/runtime/security/tests/release-safety auditor.
- `claude-product-auditor.md` — product/UX/craft/devex auditor.
- `composer-implementer.md` — implementation agent using Composer 2.5 Fast.
- `cursor-fixer.md` — compatibility alias pointing to Composer.

## Shared source of truth

- GitHub Issues = work items.
- GitHub Project kanban = workflow status: `Backlog`, `Ready`, `In progress`, `In review`, `Done`.
- Priority labels = work order: `p0 -> p1 -> p2 -> p3`.
- Receipts/proof = completion truth.
- Milestones are not workflow truth.

If GitHub Project API scopes are missing, agents should keep labels/issues updated and report: `Project board move needed`.

## Required priority labels

Every issue must have exactly one priority label:

- `p0` — critical cutover blocker / Sebastian explicitly P0 / core chat-runtime-setup failure.
- `p1` — urgent daily-use gap.
- `p2` — important but not blocking.
- `p3` — polish/backlog.

Agents always work `p0 -> p1 -> p2 -> p3`.

## Canonical app boundary

`/Applications/otto.app` is canonical and may only be installed/updated from the latest published GitHub Release artifact.

Local branches, dirty worktrees, and experimental builds go only to staging/disposable apps.

Agents must not quit, overwrite, relaunch, smoke-test against, or otherwise mutate either official app bundle unless Sebastian explicitly authorizes that exact action:

- `/Applications/otto.app`
- `/Applications/otto-staging.app`

## PR readiness packet

Every PR submitted for Sebastian should include:

- linked issues
- what changed
- why it matters
- tests/checks run
- screenshots/videos/data where relevant
- known limitations
- ship/no-ship recommendation
- mission-efficacy note: how this improves otto's ability to compound behavior
