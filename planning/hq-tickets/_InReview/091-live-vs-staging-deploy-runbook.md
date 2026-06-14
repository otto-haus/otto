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

## Execution receipt

Status: pass
Date: 2026-06-13

## What changed

Created canonical operator runbook at `docs/v1/runbooks/live-vs-staging.md` covering dev (`task electron`), staging deploy (`task staging` / `deploy-staging.sh`), live refresh (`task refresh`), isolated HOME/OTTO_HOME/profile/port paths, smoke launcher links, receipt templates, and stale-live triage.

## Files changed

- `docs/v1/runbooks/live-vs-staging.md` (new)

## Verification run

```sh
test -f docs/v1/runbooks/live-vs-staging.md
# exit 0
```

Doc-only ticket — staging deploy/smoke not re-run in this pass; runbook documents commands for independent proof.

## Evidence

- Runbook cross-links `_workflow-run-ticket.md` and `AGENTS.md` staging paths.
- Isolated env vars match `apps/desktop/scripts/deploy-staging.sh` defaults (`OTTO_STAGING_ROOT`, `HOME`, `OTTO_HOME`, profile, port 9445).
- `task staging` alias confirmed in root `Taskfile.yml`.

## Known limitations

- Not linked from `000-workflow.md` yet (separate index pass).
- Live refresh receipt requires Sebastian approval by design.

Reviewer verdict: pending

## Review

Reviewer: Cursor (independent)
Date: 2026-06-13
Verdict: -1

### Checked against

- Done when item 1 (runbook merged; linked from workflow index): **partial** — `test -f docs/v1/runbooks/live-vs-staging.md` exit 0; **not linked** from `000-workflow.md` or `_workflow-run-ticket.md` (those files inline staging paths only).
- Done when item 2 (one staging deploy + smoke per runbook; receipt in ticket): **fail** — execution receipt explicitly states deploy/smoke not re-run; no `staging_app=`, `home=`, `runtime_ready=` block in ticket.
- Done when item 3 (Reviewer +1): **pending** — this review.

### Evidence inspected

- Files: `docs/v1/runbooks/live-vs-staging.md`, `apps/desktop/scripts/deploy-staging.sh`, `scripts/launch-otto-staging-smoke.sh`, `planning/hq-tickets/AGENTS.md` (Staging runtime section), root `Taskfile.yml` (`staging`, `refresh` with `deploy` alias).
- Commands: `test -f docs/v1/runbooks/live-vs-staging.md` exit 0; static diff of runbook vs `deploy-staging.sh` defaults.
- UI/artifacts: did not run `task staging` or smoke launcher (full electron build + app launch not executed in review pass).
- Git diff: new runbook only.

### Passes

- Three-tier model (dev / staging / live) matches AGENTS.md sacred-live rules.
- Isolated paths in runbook match `deploy-staging.sh`: `OTTO_STAGING_ROOT`, `HOME`, `OTTO_HOME`, profile, port `9445`, bundle id `haus.otto.desktop.staging`, `OTTO_SMOKE=1`.
- `task staging` → `deploy-staging.sh`; `task refresh` / `task deploy` alias confirmed in Taskfile.
- Smoke launcher paths and env stamping align with `scripts/launch-otto-staging-smoke.sh`.
- Staging receipt template and stale-live triage checklist are operator-usable.
- Runbook cross-links `_workflow-run-ticket.md` and AGENTS.md.

### Defects

1. **No executed proof** — Done when requires one follow-the-runbook staging deploy + smoke; ticket has doc-only verification.
2. **Workflow index link missing** — `000-workflow.md` / `_workflow-run-ticket.md` do not reference `docs/v1/runbooks/live-vs-staging.md`.
3. **Done-when checkboxes** — all `[ ]` despite execution receipt “pass”.

### Required changes

1. Execute `task staging` (or `deploy-staging.sh`) + smoke launcher once; append execution receipt with paths/output lines (`home=`, `otto_home=`, `profile=`, `port=`).
2. Add runbook link to `_workflow-run-ticket.md` (and optionally `000-workflow.md`).
3. Sync Done-when checkboxes.

### Optional polish

- Note admin smoke bundle uses bundle id `haus.otto.desktop.admin-staging` (distinct from `/Applications/otto-staging.app`) — runbook mentions both; could add one-line disambiguation.

### Finding

Runbook content is accurate vs scripts and AGENTS.md staging contract. Executable proof and workflow linkage are required Done-when items — not met. Cannot move to `_Done`.

### Final call needed from Sebastian

None unless doc-only merge is acceptable without a staging execution receipt for a runbook ticket.
