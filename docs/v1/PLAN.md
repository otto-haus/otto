# Otto v0.1 PLAN

## Wave 5 status (2026-06-13)

Lane 001–009 are **done** in the worktree. This Cycle tickets and Ship Checks synced.

- Tickets + proof: `planning/hq-tickets/` (see `000-index.md`, `000-parallel-map.md`); lane archive: `planning/lane-tickets/`
- Ship status master: `SHIP_STATUS.md`
- Worktree: `/Users/seb/Code/otto/.letta/worktrees/ticket-004-receipt-contract-codex-20260613`
- Gate 016 / HQ 018: **review** — do not start Intake/Discord/Paperclip until accepted

Verification:

```sh
cd /Users/seb/Code/otto/.letta/worktrees/ticket-004-receipt-contract-codex-20260613/apps/desktop
bun test ./electron/*.test.ts
bun run typecheck
```

---

## Purpose

This is the execution plan for making Otto v0.1 honestly shippable.

The Build Contract defines the standards. Ship Checks define per-surface done-ness. This PLAN tells the engineer what to do, in what order.

```txt
No Fake Done = principle
Ship Check = per-surface acceptance artifact
PLAN.md = execution sequence
Receipts = proof it happened
```

## Operating model

- Sebastian/Vinny = PM / eng manager: spec, taste, acceptance criteria, cutline, approvals.
- Claude = engineer: implementation, tests, commits, demos, receipts, blocker reports.

No push, tag, release, npm publish, or GitHub metadata changes without Sebastian approval.

## Canonical target for this build

```txt
Product: Otto
Domain: otto.haus
Repo: otto-haus/otto
Package scope: @otto-haus/
Future dream: ot.to
```

Implement this target locally, but final public namespace still requires Sebastian approval before push.

## Primary workspace

```sh
cd /Users/seb/Code/otto/.letta/worktrees/otto-v01-integration
```

Reference-only desktop app:

```sh
/Users/seb/Code/vinny-desktop
```

Specs / contracts:

```sh
/Users/seb/Library/CloudStorage/Dropbox/This Cycle/otto/Otto v0.1 Build Contract — Spec Compliance.md
/Users/seb/Library/CloudStorage/Dropbox/This Cycle/otto/SHIP_CHECKS/
/Users/seb/Library/CloudStorage/Dropbox/This Cycle/otto/Otto v1 Spec.md
/Users/seb/Library/CloudStorage/Dropbox/This Cycle/_Meta/Veto OS Desktop Shell — Spec.md
```

---

# Phase 0 — Baseline

## Do

```sh
cd /Users/seb/Code/otto/.letta/worktrees/otto-v01-integration
git status --short --branch
git worktree list
bun install
bun run verify:v0 || true
bun run typecheck || true
bun test || true
bun --cwd apps/desktop run typecheck || true
bun --cwd apps/desktop run build || true
```

Inspect old Electron reference:

```sh
cd /Users/seb/Code/vinny-desktop
npm run typecheck || true
env -u ELECTRON_RUN_AS_NODE npm run dev
```

## Write

```txt
receipts/otto-v01/baseline.md
```

Include pass/fail, current branch, known broken flows.

## Commit

Only if files changed:

```txt
record baseline receipt
```

---

# Phase 1 — Namespace sweep

## Do

Rename implementation target:

```txt
otto-do     -> otto-haus
@otto-do    -> @otto-haus
otto-do/otto -> otto-haus/otto
otto.do     -> otto.haus, except historical unavailable-domain note
```

Update packages, imports, lockfile, docs, demos, receipts, release checklist.

## Verify

```sh
grep -RIn "otto-do\|@otto-do\|otto-hq\|@otto-hq\|otto.do" . \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist || true
bun install
bun run typecheck
bun test
bun --cwd apps/desktop run typecheck
bun --cwd apps/desktop run build
bun run verify:v0
```

## Commit

```txt
rename namespace to otto-haus
```

---

# Phase 2 — Install Ship Checks in repo

## Do

Copy or recreate Ship Checks from Dropbox into repo:

```txt
SHIP_CHECKS/
```

Create/update:

```txt
SPEC_COMPLIANCE.md
CLAIMS_AUDIT.md
```

## Fill first-pass status

For every surface, mark:
- `[x]` done with evidence
- `[~]` partial/prototype/proposed with gap
- `[ ]` missing

Surfaces:
- Namespace
- Desktop
- Charter
- Practices
- Routines
- Standards
- Curation
- Approvals
- Autonomy
- Tickets
- Skills
- Knowledge
- Channels
- Runs/Receipts
- Worker orchestration
- Release gate

## Commit

```txt
add Ship Checks and spec compliance matrix
```

---

# Phase 3 — Claims audit and cutline

## Do

Audit claims in:

```txt
README.md
RELEASE_CHECKLIST.md
docs/otto-v01-status.md
demo/README.md
receipts/otto-v01/*.md
demo/src/features.tsx
```

Classify every claim:
- working code
- file artifact only
- demo reenactment
- unsupported / overclaim

## Update

Downgrade/remove any unsupported claim.

Likely cutline:
- Ship candidates: Charter, Practices, Routines, Skills, Standards, Autonomy/Ticketcraft, Runs/Receipts if file-backed proof exists, Desktop if preview is honest.
- Proposed: Knowledge.
- Defer unless implemented: Curation engine, Approvals emitted by Curation, Channels, full worker orchestration, live Electron runtime.

## Commit

```txt
set v0.1 cutline and claims audit
```

---

# Phase 4 — Desktop convergence

## Goal

One canonical desktop.

Canonical path:

```txt
apps/desktop
```

Reference only:

```txt
/Users/seb/Code/vinny-desktop
```

## Do

- Keep/port the new Otto workspace shell.
- If adding Electron runtime, port it into `apps/desktop`.
- Do not leave two active desktop products.
- Use `~/.otto`, `window.otto`, `OTTO_*` where relevant.
- Set `memfs:false` by default if using Letta SDK.
- No red stack on load.
- Send disabled until runtime ready.
- Debug hidden by default.

## Required UI

Sidebar:

```txt
Chat
Charters
Standards
Practices
Routines
Curation
Receipts
Autonomy
Settings
```

No visible:

```txt
Vinny
veto
Veto OS
cockpit
console
dashboard
.veto-os
```

## Verify

```sh
bun --cwd apps/desktop run typecheck
bun --cwd apps/desktop run build
bun --cwd apps/desktop run dev
```

If Electron runtime included:

```sh
env -u ELECTRON_RUN_AS_NODE bun --cwd apps/desktop run electron:dev
```

## Write

```txt
docs/desktop-convergence.md
receipts/otto-v01/desktop.md
```

## Commit

```txt
converge desktop workspace
```

---

# Phase 5 — Fill P0 surface gaps

Work surface-by-surface using `SHIP_CHECKS/`.

Order:
1. Practices — easiest real runtime proof.
2. Runs/Receipts — proof substrate.
3. Charter — core behavior contract.
4. Standards — fake-done/canon layer.
5. Routines — repeated practice bundles.
6. Autonomy/Tickets — worker/worktree contracts.
7. Skills — capability packaging.
8. Knowledge — proposed only unless ratified.
9. Curation/Approvals — implement or explicitly defer.
10. Channels — implement or explicitly defer.
11. Worker orchestration — manual/spec or runtime, but be honest.

For each surface:
- update Ship Check
- update SPEC_COMPLIANCE
- update receipt
- update README/release claims
- add tests if feasible

## Commit cadence

Commit after each coherent surface or small group:

```txt
complete <surface> Ship Check
```

---

# Phase 6 — Flow tests

## Create

```txt
FLOW_TESTS.md
```

For every shipped/proposed surface:

```md
## <Surface>
Command:
Expected:
Actual:
Pass/fail:
Evidence:
Limitations:
```

## Required commands

```sh
bun run verify:v0
bun run typecheck
bun test
bun packages/practices/src/cli.ts
bun --cwd apps/desktop run typecheck
bun --cwd apps/desktop run build
```

If Electron included:

```sh
env -u ELECTRON_RUN_AS_NODE bun --cwd apps/desktop run electron:dev
```

## Commit

```txt
add flow tests
```

---

# Phase 7 — Demos and receipts refresh

## Do

Refresh demos only after cutline and flow tests.

Every demo must show:
- actual artifact/state/test path where possible
- honest status card
- Tried unchecked until Sebastian tries
- Approved unchecked until Sebastian approves
- Proposed status when applicable

## Commands

```sh
cd demo
bun install
bun run render:all
```

## Update

```txt
demo/README.md
receipts/otto-v01/*.md
RELEASE_CHECKLIST.md
docs/otto-v01-status.md
```

## Commit

```txt
refresh demos and release receipts
```

---

# Phase 8 — Final local gate

## Run

```sh
cd /Users/seb/Code/otto/.letta/worktrees/otto-v01-integration
bun run verify:v0
bun run typecheck
bun test
bun --cwd apps/desktop run typecheck
bun --cwd apps/desktop run build
git status --short --branch
```

## Final response format

Return only:

1. Shipped table
2. Spec compliance scorecard
3. Demo links
4. Test receipt summary
5. Blockers
6. Exact approval asks

## Approval asks

Ask Sebastian to approve:
- namespace `otto-haus/otto`, `@otto-haus`, `otto.haus`
- README story
- each shipped feature
- proposed/deferred statuses
- demos
- release checklist
- push/tag plan

No push until approval.
