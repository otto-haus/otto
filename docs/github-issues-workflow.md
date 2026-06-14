# GitHub Issues workflow

GitHub Issues are the current intake surface for otto work.

Use Issues for:

- product nits noticed while using otto
- bugs and regressions
- UI polish requests
- follow-up ideas that should not be lost
- small work packets that may become PRs

Do not create new local ticket files for ordinary intake. The historical `planning/hq-tickets/`
and `planning/lane-tickets/` folders remain useful context and archived proof, but they are not
the default active queue.

## Issue shape

Every issue must have exactly one priority label: `p0`, `p1`, `p2`, or `p3`.

Every issue should answer:

1. What happened or what should change?
2. Why does it matter?
3. What proof/evidence exists? Link screenshots, logs, PRs, or files when available.
4. What would make it done?

Prefer small issues. One nit = one issue unless several observations are inseparable.


## Project board

The GitHub Project kanban board is the operational source of truth for work status. Use one board view and move issues through:

- `Backlog` — captured, not yet ready to pick up.
- `Ready` — clarified enough for an implementer to start.
- `In progress` — actively being worked.
- `In review` — implementation exists and needs verification / Sebastian review.
- `Done` — verified complete.

Do not use milestones as workflow truth. If GitHub Project API access is unavailable, create/update the issue with the right priority labels and leave it in Backlog via the repo/project auto-add workflow; report the Project permission gap rather than inventing a parallel status system.

## Labels

Priority labels are mandatory on every issue:

- `p0` — critical; handle before other work. Broken core flow, active user pain, release blocker, or Sebastian explicitly says P0.
- `p1` — urgent; next after P0. Important product/runtime gap.
- `p2` — normal important work. Default for ordinary bugs/enhancements when uncertain.
- `p3` — low-risk polish or backlog.

Other labels:

- `bug` — broken behavior or regression.
- `enhancement` — new capability or workflow improvement.
- `documentation` — docs-only update.
- `status: ready for review` — PR label only; CI-green and ready for Sebastian to review/merge.

Agents must respect priority when selecting work: open `p0` issues first, then `p1`, then `p2`, then `p3`. If an issue has no `p*` label, triage it and add exactly one before acting.

Any issue creation command must include exactly one priority label at creation time:

```bash
gh issue create --repo otto-haus/otto --title "..." --body-file issue.md --label p2 --label enhancement
```

Use `p0` whenever Sebastian explicitly marks the issue P0 or the issue breaks a core chat/runtime/setup flow.


## Release-only canonical app

`/Applications/otto.app` is the canonical user-facing app and must only be installed or updated from the latest published GitHub Release artifact.

Agents must not use `task refresh`, local branch builds, dirty worktrees, or staging scripts to overwrite the canonical app. Local desktop proof should use `task electron` or disposable/staging app bundles unless Sebastian explicitly authorizes touching an official bundle.

## PR review queue

Sebastian is the merge gate. Keep this queue small:

<https://github.com/otto-haus/otto/pulls?q=is%3Apr+label%3A%22status%3A+ready+for+review%22+is%3Aopen>

Only add `status: ready for review` after:

- CI is green.
- The implementer has done a real review pass.
- The PR body includes proof and any known caveats.

If more than one PR is ready for review, alert Sebastian with PR numbers, titles, and URLs.
