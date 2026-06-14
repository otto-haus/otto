# Otto v0.1 Build Plan — Spec Compliance + Local Desktop

## 0. Mission

Make Otto v0.1 honestly shippable as a local-first repo/product artifact.

This is not “make demos look good.” This is: implement, test, demo, and receipt the subset of the Otto v1 spec that can truthfully ship in v0.1.

Definition of Shipped:
A feature is Shipped only if it is:
1. Built
2. Tested
3. Demoed
4. Tried by Sebastian
5. Approved by Sebastian
6. Included in release

Until Sebastian approves, status is not Shipped.

---

## 1. Roles

Sebastian/Vinny = PM / eng manager:
- own product spec
- own acceptance criteria
- own naming/taste
- own shipped/not-shipped truth
- approve final release

Claude = engineer:
- implement
- test
- commit locally
- render demos
- produce receipts
- report blockers honestly

---

## 2. Canonical decisions

Implement target namespace:

```txt
Product: Otto
Domain: otto.haus
GitHub org/repo: otto-haus/otto
Package scope: @otto-haus/
Future dream domain: ot.to
Historical only: Vinny OS
```

Do not say “namespace locked” until Sebastian approves final push. For this build, implement `otto-haus`, but final push still requires approval.

Do not use as canonical:

```txt
otto-do
otto-hq
otto.do
@otto-do
@otto-hq
Vinny OS
cockpit
console
dashboard
```

Allowed only in historical/compat notes:

```txt
VINNY_HOME
VINNY_OS_ROOT
```

Language:
- use **workspace**
- avoid slash labels
- pick one canonical word per surface

Sidebar surfaces:

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

---

## 3. Stack decision

No SaaS stack for v0.1.

Do not add:
- WorkOS
- Supabase
- hosted DB
- auth
- billing
- backend service
- website backend

Use:
- local-first files
- Letta runtime/memory
- Bun + TypeScript packages
- Electron/Vite/React desktop
- Git/GitHub
- Remotion demos

---

## 4. Paths

Canonical repo/worktree:

```sh
/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration
```

Old Electron reference:

```sh
/Users/seb/Code/vinny-desktop
```

Use it as source material only. Prefer porting into canonical repo:

```sh
/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/apps/desktop
```

Specs:

```sh
/Users/seb/Library/CloudStorage/Dropbox/This Cycle/otto/Otto v1 Spec.md
/Users/seb/Library/CloudStorage/Dropbox/This Cycle/_Meta/Veto OS Desktop Shell — Spec.md
```

Aesthetic reference:

```sh
/Users/seb/Library/CloudStorage/Dropbox/This Cycle/_Meta
```

Do not copy private Dropbox content into the public repo unless explicitly approved.

---

## 5. Global constraints

Stay local:
- no push
- no tag
- no GitHub release
- no npm publish
- no GitHub metadata changes

Protect work:
- no `git clean`
- no destructive reset
- no deleting old worktrees
- no pruning without explicit approval

Stop and ask if:
- namespace/package rename breaks workspace resolution
- Electron runtime requires Letta backend changes
- feature cannot be honestly demonstrated
- private info appears in public files
- branch merge pulls stale duplicate systems
- demo pipeline becomes flaky

---

# Phase 0 — Freeze, inspect, and verify baseline

## Goal

Establish exact current state before edits.

## Commands

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

Also inspect Electron reference:

```sh
cd /Users/seb/Code/vinny-desktop
npm run typecheck || true
env -u ELECTRON_RUN_AS_NODE npm run dev
```

## Deliverable

Append baseline to:

```txt
receipts/otto-v01/baseline.md
```

Include:
- branch
- dirty state
- commands run
- pass/fail
- known broken flows

Commit? No, unless files are changed.

---

# Phase 1 — Namespace/package sweep to otto-haus

## Goal

Make repo identity match target identity.

## Required changes

Replace current local implementation namespace:

```txt
otto-do → otto-haus
@otto-do → @otto-haus
otto-do/otto → otto-haus/otto
```

Update:
- `package.json`
- `bun.lock`
- package manifests
- imports
- README
- RELEASE_CHECKLIST
- demo source
- receipts
- docs
- scripts
- Desktop text
- GitHub metadata notes

Do not introduce website dependency.

## Verification

```sh
grep -RIn "otto-do\|@otto-do\|otto.do\|otto-hq\|@otto-hq" . \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist || true

bun install
bun run typecheck
bun test
bun --cwd apps/desktop run typecheck
bun --cwd apps/desktop run build
bun run verify:v0
```

Expected:
- no accidental old namespace
- only intentional historical notes if any
- workspace packages resolve as `@otto-haus/*`

## Commit checkpoint

Commit locally:

```txt
rename namespace to otto-haus
```

---

# Phase 2 — Spec compliance matrix + Ship Checks

## Goal

Convert spec into objective Ship Checks: done/partial/missing criteria per surface.

## Create files

```txt
SPEC_COMPLIANCE.md
SHIP_CHECKS/
  standards.md
  curation.md
  approvals.md
  autonomy.md
  charter.md
  tickets.md
  practices.md
  routines.md
  channels.md
  skills.md
  knowledge.md
  desktop.md
  runs-receipts.md
  worker-orchestration.md
  namespace.md
```

## Ship Check format

Each file must use:

```md
# <Surface> Checklist

## Spec promise

## Required file contract

## Required runtime behavior

## Required Desktop surface

## Required tests

## Required demo

## Required receipt

## Status

- [x] Done — evidence: `<path>`
- [~] Partial/prototype — evidence: `<path>`; missing: `<gap>`
- [ ] Not done — missing: `<gap>`

## Ship decision

One of:
- Ship in v0.1
- Ship as Proposed
- Defer
- Cut from public claims

## Fix tickets
```

## SPEC_COMPLIANCE.md format

Table columns:
- Surface
- Spec promise
- File contract
- Runtime behavior
- Desktop surface
- Tests
- Demo
- Receipt
- Status
- Ship decision
- P0/P1/P2 gaps

## Truth rules

- Docs-only is not built.
- Prototype-only is not runtime.
- Demo re-enactment is not live flow.
- If it cannot be run locally, it is not Shipped.
- If Curation/Approvals are not central runtime behavior, mark partial/deferred.

## Commit checkpoint

```txt
add Ship Checks
```

---

# Phase 2.5 — Claims audit

Before implementing, audit every public claim in:
- README.md
- RELEASE_CHECKLIST.md
- docs/otto-v01-status.md
- demo/README.md
- receipts/otto-v01/*.md
- demo/src/features.tsx

For each claim, classify:
- Supported by working code
- Supported by file artifact only
- Supported by demo reenactment
- Unsupported / overclaim

Any unsupported claim must be removed or downgraded before final.

Deliverable:

```txt
CLAIMS_AUDIT.md
```

---

# Phase 3 — Decide v0.1 cutline

## Goal

Decide what can honestly ship.

## Likely initial cutline

Ship candidates:
- Charter
- Practices
- Routines
- Skills
- Standards
- Autonomy/Ticketcraft
- Receipts/Runs if file contract + proof path exists
- Desktop only if accurately labeled preview/local shell

Proposed:
- Knowledge

Likely defer unless implemented:
- Curation central engine
- Approvals as emitted Curation records
- Channels
- full worker orchestration
- live Electron runtime if not stable

## Required edits

Update:
- `RELEASE_CHECKLIST.md`
- `README.md`
- `docs/otto-v01-status.md`
- per-feature receipts

Ensure no feature overclaims.

## Commit checkpoint

```txt
set v0.1 cutline
```

---

# Phase 4 — Desktop convergence

## Goal

Make Desktop match the spec and product shape.

## Decision

Canonical desktop must live in:

```txt
apps/desktop
```

Use:
- current Otto Vite shell for visual/product shape
- old Electron app only as runtime reference

## Required UX

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

No slash labels.

Must not show:

```txt
Vinny
veto
Veto OS
cockpit
console
dashboard
.veto-os
```

## Required behavior

Minimum:
- app launches locally
- sidebar navigation works
- Practices surface reads real `practices.json`
- surfaces clearly distinguish real/prototype
- no red stack on load
- runtime status is cleanly represented
- debug hidden by default

## Electron runtime decision

If porting Electron now:
- put Electron main/preload/SDK runner inside `apps/desktop`
- set `memfs: false` by default
- use `~/.otto`
- expose `window.otto`
- disable Send until session ready
- handle runtime unavailable cleanly

If not porting Electron now:
- mark Desktop as **preview shell**
- explicitly say live Letta runtime is not wired
- do not imply chat is functional

## Commands

```sh
bun --cwd apps/desktop run dev
bun --cwd apps/desktop run typecheck
bun --cwd apps/desktop run build
```

If Electron is added:

```sh
env -u ELECTRON_RUN_AS_NODE bun --cwd apps/desktop run electron:dev
```

## Receipt

Update:

```txt
receipts/otto-v01/desktop.md
```

Must answer:
- exact command
- what appears
- interactive vs read-only
- runtime status
- broken/missing

## Commit checkpoint

```txt
align desktop with Otto workspace spec
```

---

# Phase 4.5 — One-app rule

Do not leave two competing desktop apps.

By end of this build, decide and document:
- canonical desktop path
- archived/reference desktop path
- what was ported
- what remains unported

Default:
- canonical: `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration/apps/desktop`
- reference only: `/Users/seb/Code/vinny-desktop`

No release should imply both are active products.

Deliverable:

```txt
docs/desktop-convergence.md
```

---

# Phase 5 — Runtime/file contract implementation by surface

For each surface, ensure at minimum:

## Standards

Required:
- `standards/registry.yaml`
- active standard docs
- precedents
- anti-patterns
- standard receipt template
- review loop doc
- Desktop surface lists standards

Tests:
- schema/registry validation if feasible
- otherwise documented manual check

Ship if:
- files exist
- standards are referenced by Reviews/Receipts/Curation docs
- fake-done standard can be shown blocking or evaluating work

## Curation

Required:
- central proposal type/schema
- queue location
- classification policy
- risk/reversibility rules
- proposal lifecycle
- Desktop Curation surface
- Curation emits Approval records

If missing central engine, mark Deferred/Partial.

## Approvals

Required:
- Approval type/file schema
- pending/approved/denied/expired statuses
- scoped + time-bound
- emitted by Curation, not peer subsystem
- Desktop Curation shows pending approvals
- gate logic respects approved/unexpired/in-scope

If approvals exist only as templates/docs, mark Partial.

## Autonomy

Required:
- autonomy policy doc
- safe/unsafe action taxonomy
- worker model
- worktree policy
- merge policy
- ticket state
- autonomy receipt
- Desktop Autonomy surface

Ship if docs/templates are coherent and used in release process. Runtime orchestration can be manual if stated.

## Charter

Required:
- extension command
- skill
- charter.yaml/state/ledger/templates
- approval gates
- receipts
- example charter
- install instructions

Test:
- install/load if possible
- at minimum run typecheck and inspect extension

## Tickets

Required:
- `templates/ticket.yaml`
- `templates/worker-packet.md`
- docs/ticketcraft
- bounded slice semantics
- receipt requirement

If no command/runtime exists, mark Built as template/spec, not live.

## Practices

Required:
- core PracticeSpec type
- loader
- validator
- CLI
- five practice specs
- tests
- Desktop reads real practices

Must pass:

```sh
bun test
bun packages/practices/src/cli.ts
```

## Routines

Required:
- Routine type
- routine specs
- templates: routine/run/receipt
- approval requirement for recurring activation
- routine skill/extension if claimed
- Desktop Routines surface

If no runtime executor, mark Partial.

## Channels

Required if shipping:
- channel type
- channel configs
- outbound approval gate
- Discord docs/templates
- receipt path

If not implemented, mark Deferred and remove demo/ship claims.

## Skills

Required:
- skill files
- install/load instructions
- scope and triggers
- relationship to Practices/Routines

Test:
- file existence
- no stale names
- manual load if feasible

## Knowledge

Required:
- model registry
- capability notes
- provider costs
- observed performance template
- update receipt
- Curation proposal template
- status proposed

Ship decision:
- likely Proposed, not Shipped.

## Runs/Receipts

Required:
- core Run/Receipt types
- templates
- release receipts
- per-feature receipts
- no artifact/no progress rule
- Desktop Receipts surface

If runtime does not create runs automatically, say manual/file-backed.

## Worker orchestration

Required:
- worker packet
- worktree policy
- ticket lifecycle
- receipt requirement
- stop conditions

If no actual orchestrator command exists, mark Spec/Manual, not runtime.

---

# Phase 6 — Verify every flow

Create:

```txt
FLOW_TESTS.md
```

For each shipped/proposed surface:

```md
## <Feature>

Command:
Expected:
Actual:
Pass/fail:
Evidence:
Limitations:
```

Required commands:

```sh
bun run verify:v0
bun run typecheck
bun test
bun packages/practices/src/cli.ts
bun --cwd apps/desktop run typecheck
bun --cwd apps/desktop run build
```

If Electron runtime is included:

```sh
env -u ELECTRON_RUN_AS_NODE bun --cwd apps/desktop run electron:dev
```

---

# Phase 7 — Demo refresh

## Goal

Demos must reflect actual status after spec compliance.

For every demo:
- show real artifact/state/test path where possible
- final status card:
  - Built
  - Tested
  - Tried
  - Approved
- Tried/Approved remain unchecked until Sebastian approves

If a feature is Proposed:
- say Proposed clearly

If Deferred:
- no video unless explicitly useful as “deferred explanation”

## Commands

```sh
cd demo
bun install
bun run render:all
```

Expected outputs:

```txt
demo/out/otto-v01-charter.mp4
demo/out/otto-v01-practices.mp4
...
```

Copy/symlink to Desktop for review if useful.

## Commit checkpoint

```txt
refresh demos and receipts
```

---

# Phase 8 — Final verification and release gate

## Run

```sh
bun run verify:v0
bun run typecheck
bun test
bun --cwd apps/desktop run typecheck
bun --cwd apps/desktop run build
git status --short --branch
```

## Final output format

Return only:

1. Shipped table
2. Spec compliance scorecard
3. Demo links
4. Test receipt summary
5. Blockers
6. Exact approval asks

## Final approval asks

Ask Sebastian to approve:
- README story
- namespace `otto-haus/otto`, `@otto-haus`, `otto.haus`
- each shipped feature
- each proposed/deferred feature status
- demos
- release checklist
- push/tag plan

No push until approved.
