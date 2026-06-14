# 091 — Live vs Staging Deploy Runbook

Owner: Cursor
Priority: P1
Depends on: none
Release bucket: v0.1 integration

## Outcome

Operators and agents have one **canonical runbook** for where proof runs, how staging is deployed, and when live `/Applications/otto.app` may be refreshed — so “it works in repo” stops diverging from “what Sebastian opened.”

Deliverable: `docs/v1/runbooks/live-vs-staging.md` + updates to `AGENTS.md` Verify section if paths drift.

## Why this matters

Repeated confusion: craft changes land in source/staging while live app is stale. Smoke scripts, `task refresh`, `deploy-staging.sh`, and admin bundle copies are documented in tickets but not one operator-facing contract.

AGENTS.md already states:
- Live: `/Applications/otto.app`
- Staging: `task electron` / `otto-staging.app` / disposable HOME
- Do not call Electron connected unless Letta init succeeds
- Smoke never uses `conversation=default`

This ticket makes that **executable and receipt-friendly**.

## Scope

- Document three tiers:
  1. **Dev** — `task electron` (live reload, local repo)
  2. **Staging proof** — `apps/desktop/scripts/deploy-staging.sh` → `/Applications/otto-staging.app` (or admin bundle) with isolated `HOME` / `OTTO_HOME` / profile / port
  3. **Live refresh** — `task refresh` → `/Applications/otto.app` (explicit human gate; no agent default)
- Canonical commands + env vars (copy-paste blocks)
- When implementers must record staging receipt vs live refresh receipt
- Link existing scripts: `scripts/launch-otto-staging-smoke.sh`, `_workflow-run-ticket.md`
- “Stale live app” triage checklist (compare bundle mtime vs git HEAD)
- Optional: single `task staging` / `task proof` alias if missing — only if already partially exists in Taskfile

## Non-goals

- Automating live refresh without Sebastian approval
- CI/CD to public release (**063**)

## Done when

- [ ] Runbook merged; linked from `000-workflow.md` or `_workflow-run-ticket.md`
- [ ] One staging deploy + smoke executed per runbook; receipt path referenced in ticket
- [ ] Reviewer +1

## Verification

```sh
test -f docs/v1/runbooks/live-vs-staging.md
# follow runbook once → staging app shows expected build marker or version string
apps/desktop/scripts/deploy-staging.sh   # or documented equivalent
/Users/seb/.codex/admin/otto-staging/launch-otto-staging-smoke.sh  # disposable conv only
```

## Blocker log

Leave blank unless blocked.
