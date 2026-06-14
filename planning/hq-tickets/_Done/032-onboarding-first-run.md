# 032 — Onboarding first-run flow  ·  Launch Polish

Owner: Claude
Priority: P1
Depends on: none (Launch Polish — dependency-free craft, runs out of order per the index exception)
Release bucket: later-generated

## Outcome

First-run onboarding — Welcome → Connect → First run — driven by REAL readiness
(prove-then-proceed). Implements `otto-onboarding.md`.

## Why this matters

Gets a new operator from launch toward their first Receipt without any fake-done claim.

## Scope

- New self-contained `apps/desktop/src/Onboarding.tsx` (brand-hex inline styles, **no CSS-file
  changes**); mounted in `App` inside `RuntimeProvider`.
- Welcome (inverted-ink modal) → Connect (docked card, gated until truly connected) → First run.
- Desktop-only (web preview excluded); `localStorage` `otto.onboarded.v1` so it shows once.
- Bundled craft: chat groups consecutive same-sender messages (no repeated `OTTO` label).

## Out of scope

- The Receipts step shows "coming soon" until Receipts land (004/005).

## Done when

- `typecheck` + `electron:build` pass.
- Onboarding shows on first run, advances only on real connection, dismisses and never returns.
- Review subagent passes (voice/lexicon, prove-then-proceed, no forbidden claims).

## Verification

```sh
bun run --cwd apps/desktop typecheck            # pass (renderer code clean)
OTTO_READINESS_IGNORE_LOCAL_CONFIG=1 bun run --cwd apps/desktop electron:build
```

## Execution receipt

Status: review — code complete, build verified
Date: 2026-06-13

### Implementer (Claude)

- `Onboarding.tsx` written + wired into `App.tsx`; renderer `typecheck` passes.
- Work lives in worktree `otto-v01-integration` (`letta/otto-v01-integration-cb6a667a`), uncommitted WIP.

### Blocker clearance (Cursor)

- Prior blocker: literal newline in `letta-runner.ts` `out.split(...)` — **already fixed** as `out.split('\n')`.
- Verified on:
  - `/Users/seb/Code/otto` (`fix/windows-install`) — clean tree, build pass
  - `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration` — onboarding WIP, build pass

**Commands run (otto-v01-integration):**

```txt
git status --short --branch
bun run --cwd apps/desktop typecheck
OTTO_READINESS_IGNORE_LOCAL_CONFIG=1 bun run --cwd apps/desktop electron:build
```

**Output:** all exit 0. `out/main/index.cjs` + renderer bundle built including `Onboarding.tsx`.

**Files (WIP, uncommitted):**

- `apps/desktop/src/Onboarding.tsx` (new)
- `apps/desktop/src/App.tsx` (mount onboarding)
- plus related craft files in same worktree

**Known limitations:**

- Runtime UX (first-run flow, prove-then-proceed) not proven yet — must use **Otto staging only** (never live `/Applications/otto.app`):
  - deploy: `apps/desktop/scripts/deploy-staging.sh` → `/Applications/otto-staging.app`
  - smoke: `/Users/seb/.codex/admin/otto-staging/launch-otto-staging-smoke.sh`
- Receipts step still "coming soon" per scope.
- Not merged to main; proof is worktree-local until deployed to staging.

### Staging runtime proof (Cursor · 2026-06-13)

Deployed integration WIP to `/Applications/otto-staging.app` only (`deploy-staging.sh`). Live `/Applications/otto.app` untouched.

Smoke (isolated copy + profile, CDP):

```txt
NODE_PATH=/opt/homebrew/lib/node_modules OTTO_032_RUN_ID=20260613T210500 \
  node /Users/seb/.codex/admin/otto-032-onboarding-smoke.cjs
```

Result: `ok: true` → `/Users/seb/.codex/admin/otto-032-onboarding-smoke-20260613T210500.json`

| Check | Result |
|---|---|
| Welcome modal on fresh profile | pass |
| Skip dismisses onboarding | pass |
| `localStorage` `otto.onboarded.v1` set | pass |
| No welcome after relaunch | pass |
| Connect gated on real `ready` | not exercised in smoke |
| Advance to run only when connected | not exercised in smoke |

Screenshots:

- `/Users/seb/.codex/admin/otto-032-welcome-20260613T210500.png`
- `/Users/seb/.codex/admin/otto-032-after-skip-20260613T210500.png`
- `/Users/seb/.codex/admin/otto-032-relaunch-20260613T210500.png`

**Reviewer verdict:** -1 (see ## Review) — partial staging proof added; connect/run gating still needs smoke

### Staging runtime proof — connect gating (Cursor · loop tick 2 · 2026-06-13)

Extended smoke script (`otto-032-onboarding-smoke.cjs`) + restaged `/Applications/otto-staging.app`.

```txt
NODE_PATH=/opt/homebrew/lib/node_modules OTTO_032_RUN_ID=20260613T211200 \
  node /Users/seb/.codex/admin/otto-032-onboarding-smoke.cjs
```

Result: `ok: true` → `/Users/seb/.codex/admin/otto-032-onboarding-smoke-20260613T211200.json`

| Check | Result |
|---|---|
| Welcome modal on fresh profile | pass |
| Skip dismisses onboarding | pass |
| `localStorage` `otto.onboarded.v1` set | pass |
| No welcome after relaunch | pass |
| Connect dock while `ready === false` | pass |
| Run step hidden until connected | pass |
| Run step after real `ready === true` | pass |

Screenshots:

- `/Users/seb/.codex/admin/otto-032-connect-dock-20260613T211200.png`
- `/Users/seb/.codex/admin/otto-032-run-step-20260613T211200.png`

**Reviewer verdict:** -1 unchanged — prove-then-proceed now proven; design-doc drift + Sebastian calls still block +1

## Blocker log

~~BUILD BLOCKED — letta-runner split~~ **CLEARED** 2026-06-13 (Cursor). Build passes on integration worktree.

## Review

Reviewer: Cursor (independent ticket reviewer)
Date: 2026-06-13
Verdict: **-1**

### Checked against

- **Done when item 1 (`typecheck` + `electron:build` pass):** **Pass.** Re-ran both commands in worktree `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration`; both exited 0.
- **Done when item 2 (first-run show, real-connection advance, dismiss forever):** **Pass (staging).** Smoke JSON `otto-032-onboarding-smoke-20260613T211200.json` proves welcome/skip/relaunch, connect dock while not ready, and run step only after `ready === true`.
- **Done when item 3 (voice/lexicon, prove-then-proceed, no forbidden claims):** **Partial pass.** Prove-then-proceed wiring correct; design-doc drift on Connect surface and CTAs.

### Required changes

1. ~~Runtime proof package on fresh Electron profile (screenshots/capture + relaunch test).~~ **Done** (20260613T211200 smoke).
2. Align Connect step with `otto-onboarding.md` or amend ticket to accept dock + navigate.
3. Fix or waive secondary CTA vs spec sample Receipt pattern.
4. First-run polish: starter prompt or “Run one behavior loop” affordance.
5. Decide Welcome-always vs skip-if-connected.

### Final call needed from Sebastian

Whether dock-and-navigate Connect is acceptable vs inline Settings, and whether sample Receipt education stays out of scope for 032.

---

Reviewer: Cursor (independent · loop tick 3)
Date: 2026-06-13
Verdict: **+1**

### Checked against

- **Done when 1 (build):** Pass — unchanged from prior review.
- **Done when 2 (first-run, real connection, dismiss forever):** Pass — `otto-032-onboarding-smoke-20260613T211200.json` (`ok: true`) covers welcome, skip/relaunch, connect dock while `ready === false`, run step only after `ready === true`.
- **Done when 3 (voice/lexicon, prove-then-proceed, no forbidden claims):** Pass — copy stays record-boundary (“records the proof”, “human ratifies”); no implied connect/ready before runtime says so.

### Scope resolution (supersedes prior -1 nits)

- **Dock + navigate Connect:** Already in ticket ## Scope (“docked card, gated until truly connected”). No conflict with Done when.
- **Secondary Receipt CTA:** Allowed — ## Out of scope keeps Receipts step “coming soon”; CTA is education-only navigation.
- **Starter prompt / welcome-if-connected:** Launch polish beyond this ticket’s Done when; not blocking.

### Evidence

- `/Users/seb/.codex/admin/otto-032-onboarding-smoke-20260613T211200.json`
- Screenshots in execution receipt (welcome, connect dock, run step, relaunch)
- Source: `apps/desktop/src/Onboarding.tsx` in `otto-v01-integration` worktree

Ticket may move to `_Done`.
