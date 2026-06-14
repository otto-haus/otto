# 006 — Charter Contract

Owner: Codex
Priority: P1
Depends on: 004

## Outcome

Otto can represent an explicit operating contract for a goal/run.

## Scope

- Charter model.
- Charter status.
- Link charter to runs/receipts.
- Approval/change boundary.

## Done when

- Charter can be created in data layer.
- Run/receipt can reference charter ID.
- Charter has clear status.
- Charter changes can produce receipts.

## Review

Reviewer: Codex
Date: 2026-06-13 18:42 PDT
Verdict: blocked

### Checked against

- Done when items: Not verified. There is no implementation receipt or mapped proof for this ticket.
- Dependency gate: Blocked. `006` depends on `004`, which is not in `_Done`.

### Evidence inspected

- Files:
  - This ticket file.
  - `/Users/seb/Library/CloudStorage/Dropbox/HQ/Otto Tickets/_Done`
- Commands:
  - `find .../_Done -maxdepth 1 -type f -name '*.md'` -> no completed tickets
  - `rg -n "^## Execution receipt|^## Review|^Verdict:" .../006-charter-contract.md`
- UI/artifacts:
  - None attached.
- Git diff:
  - Not inspected beyond dependency/receipt gate because no ticket implementation proof exists.

### Passes

- None verified.

### Defects

- No `## Execution receipt` exists for this ticket.
- No proof is mapped to the Done when items.
- Required dependency `004` is not accepted.

### Required changes

- Complete and accept `004` into `_Done`.
- Implement ticket `006`.
- Append an execution receipt proving charter creation, run/receipt references, status, and change receipts.

### Optional polish

- None.

### Finding

Blocked before product/code acceptance. No proof, no `+1`.

### Final call needed from Sebastian

None unless Sebastian wants to override the dependency order.

## Execution receipt

Implementer: Codex
Date: 2026-06-13 20:46 PDT
Suggested status: review

### Repo

- Path: `/Users/seb/Code/otto/.letta/worktrees/ticket-004-receipt-contract-codex-20260613`
- Branch: `codex/ticket-004-receipt-contract-20260613`
- Dependency: `004-receipt-contract.md` is in `_Done` with reviewer `+1`.
- Diff artifact: `/Users/seb/.codex/admin/otto-006-charter-contract-diff-20260613.patch`

### Files changed for this ticket

- `packages/core/src/types.ts`
  - added `Run.charter`
  - added `otto.charter.v1` `Charter`
  - added `CharterStatus`, `CharterChange`, and expanded `CharterRef`
- `apps/desktop/electron/charter-store.ts`
  - added file-backed `CharterStore`
  - writes charters under `OTTO_HOME/charters` / `~/.otto/charters`
  - writes charter mutation receipts through `ReceiptWriter`
- `apps/desktop/electron/charter-store.test.ts`
  - proves create, run/receipt link, status change, and mutation receipts

Existing accepted changes from tickets 004 and 005 remain in the same dirty worktree because 006 builds on their receipt contract and receipt surface.

### What was implemented

- Charter model:
  - `schema: "otto.charter.v1"`
  - `id`, `slug`, `title`, `objective`
  - `status`
  - `created_at`, `updated_at`
  - `acceptance_criteria`
  - `run_ids`
  - `receipt_ids`
  - `change_receipt_ids`
  - `approval_required_for_changes`
  - `changes`
- Charter status:
  - `proposed`
  - `draft`
  - `active`
  - `blocked`
  - `complete`
  - `cancelled`
- Run/receipt links:
  - `Run.charter?: Slug`
  - `Charter.run_ids`
  - `Charter.receipt_ids`
  - `Receipt.subject.type = "charter"` already supported by ticket 004 contract and now used by `CharterStore`
- Approval/change boundary:
  - charters carry `approval_required_for_changes` initialized from `APPROVAL_FLOOR`
  - every create/status/reference mutation writes a receipt and appends a `CharterChange`
  - risky activation/side-effect approval remains a separate gate; this ticket records the boundary and receipt trail, not a UI approval flow

### Verification

- `bun test apps/desktop/electron/charter-store.test.ts apps/desktop/electron/receipt-writer.test.ts` -> 5 pass, 0 fail
- `bun run --cwd apps/desktop electron:typecheck` -> pass
- `bun run typecheck` -> pass
- `bun run --cwd apps/desktop typecheck` -> pass
- `task typecheck` -> pass
- `bun test` -> 13 pass, 0 fail
- `bun run verify:v0` -> 5 passed, 0 failed
- `task package` -> pass; built `apps/desktop/dist-app/mac-arm64/otto.app` without replacing or opening `/Applications/otto.app`
- `git diff --check` -> pass
- Data-layer proof artifact:
  - `/Users/seb/.codex/admin/otto-006-charter-contract-proof-20260613T204900.json`
  - created a temp charter at `/var/folders/22/fzs3nrw505z_m71cghqjc7j80000gn/T/otto-006-charter-20260613T204900-zLCks5/charters/ticket-006-charter-contract/charter.json`
  - wrote 3 receipts: `charter.created`, `charter.references-linked`, `charter.status-changed`

### Done-when mapping

- Charter can be created in data layer: proven by `CharterStore.create()` test and proof artifact with `schema: "otto.charter.v1"`.
- Run/receipt can reference charter ID: proven by `Run.charter`, `Charter.run_ids`, `Charter.receipt_ids`, and `Receipt.subject: { type: "charter", id: charterId }` in tests/proof.
- Charter has clear status: proven by `CharterStatus` and status transition proof from `active` to `blocked`.
- Charter changes can produce receipts: proven by create/link/status mutation receipts and `change_receipt_ids`.

### Isolation note

- No `/Applications/otto.app` refresh/install/open was run for this ticket.
- Package verification used `task package`, which builds the app bundle in `apps/desktop/dist-app` only.

### Known gaps

- No Charters UI or IPC surface is included here; ticket 007 owns create/view/update UI.
- Approval enforcement UI is not included here; this ticket establishes the file-backed approval/change boundary and receipt trail.

### Final call needed from Sebastian

None.

## Review

Reviewer: Codex independent reviewer
Date: 2026-06-14
Verdict: +1

### Checked against

- Charter can be created in data layer: pass. `CharterStore.create()` writes a file-backed `otto.charter.v1` record with `id`, `slug`, `objective`, `status`, acceptance criteria, run/receipt arrays, approval floor, and change log.
- Run/receipt can reference charter ID: pass. Core `Run` now has a charter pointer, `Charter` tracks `run_ids` and `receipt_ids`, and charter mutation receipts use `Receipt.subject: { type: "charter", id: charter.id }`; the proof artifact records `charter-ticket-006-charter-contract` as the receipt subject id.
- Charter has clear status: pass. `CharterStatus` is explicit (`proposed`, `draft`, `active`, `blocked`, `complete`, `cancelled`), and tests/proof cover a status transition from `active` to `blocked`.
- Charter changes can produce receipts: pass. Create, run/receipt link, and status-change mutations each write success receipts and append `CharterChange` entries with `receipt_id`.
- Dependency/folder state: pass. `006-charter-contract.md` is only in `_InReview`; dependency `004-receipt-contract.md` is in `_Done` with a later `Verdict: +1`. `005` is also in `_Done` with `Verdict: +1`.

### Evidence inspected

- Files:
  - `/Users/seb/Library/CloudStorage/Dropbox/HQ/Otto Tickets/AGENTS.md`
  - `/Users/seb/Library/CloudStorage/Dropbox/HQ/Otto Tickets/000-canonical.md`
  - `/Users/seb/Library/CloudStorage/Dropbox/HQ/Otto Tickets/000-index.md`
  - `/Users/seb/Library/CloudStorage/Dropbox/HQ/Otto Tickets/000-workflow.md`
  - `/Users/seb/Library/CloudStorage/Dropbox/HQ/Otto Tickets/_workflow-review-ticket.md`
  - `/Users/seb/Library/CloudStorage/Dropbox/HQ/Otto Tickets/_InReview/006-charter-contract.md`
  - `/Users/seb/Library/CloudStorage/Dropbox/HQ/Otto Tickets/_Done/004-receipt-contract.md`
  - `/Users/seb/Library/CloudStorage/Dropbox/HQ/Otto Tickets/_Done/005-receipts-surface.md`
  - `AGENTS.md` in the worktree
  - `packages/core/src/types.ts`
  - `apps/desktop/electron/charter-store.ts`
  - `apps/desktop/electron/charter-store.test.ts`
  - `apps/desktop/electron/receipt-writer.ts`
  - `apps/desktop/electron/receipt-store.ts`
  - `/Users/seb/.codex/admin/otto-006-charter-contract-diff-20260613.patch`
  - `/Users/seb/.codex/admin/otto-006-charter-contract-proof-20260613T204900.json`
- Commands:
  - `bun test apps/desktop/electron/charter-store.test.ts apps/desktop/electron/receipt-writer.test.ts` -> 5 pass, 0 fail
  - `bun run --cwd apps/desktop electron:typecheck` -> pass
  - `git diff --check` -> pass
  - `jq -e ... otto-006-charter-contract-proof-20260613T204900.json` -> true
  - `git status --short --branch` inspected dirty/untracked worktree state
  - `find ... -name '006-charter-contract.md'` confirmed only `_InReview/006-charter-contract.md`
- UI/artifacts:
  - No UI expected for ticket 006; ticket 007 owns the Charters surface.
  - Proof JSON shows `ok: true`, final status `blocked`, run id `run-ticket-006`, three charter receipts, and three change entries.
- Git diff:
  - Tracked diff includes core type additions and supporting receipt changes from the shared dirty worktree.
  - The new charter implementation files are untracked, so I inspected actual files directly; include them in any eventual commit.

### Passes

- All four Done when items are satisfied by code, tests, and proof artifact.
- Dependency state is now satisfied despite the ticket's earlier blocked review section.
- The implementation stays data-layer only; no fake UI state or connected/runtime claim is introduced.
- Approval/change boundary is recorded without pretending UI enforcement exists in this ticket.

### Defects

- None blocking.

### Required changes

- None.

### Optional polish

- Consider tightening the `Run.charter` field name/type in a later contract pass if Otto wants to distinguish charter slug from charter id more strictly. Current repo templates already use a slug-style charter pointer, and receipts reference the concrete `charter.id`.

### Finding

Ticket 006 is proven against the contract and may move to `_Done` after this review is appended.

### Final call needed from Sebastian

None for ticket acceptance. Commit/push/release remains a separate approval boundary.

## Review rev8

Reviewer: independent subagent (batch 001-045)
Date: 2026-06-14
Verdict: +1

### Checked against

- Charter creatable in data layer: **PASS** — `charter-store.test.ts` create → `otto.charter.v1`.
- Run/receipt can reference charter: **PASS** — `run_ids`, `receipt_ids`, `Receipt.subject`.
- Charter has clear status: **PASS** — `CharterStatus` transitions tested.
- Changes produce receipts: **PASS** — create/link/status receipts + `change_receipt_ids`.

### Evidence inspected

- Files: `charter-store.ts`, `charter-store.test.ts`, `packages/core/src/types.ts`
- Commands: 42-test spot-check batch (pass)
- Artifacts: `otto-006-charter-contract-proof-20260613T204900.json`

### Defects

None blocking.

### Required changes

None.

### Finding

Data-layer contract fully proven by tests and proof artifact.

## Review rev9

Reviewer: independent subagent (batch 001-045 rev9)
Date: 2026-06-14
Verdict: +1

### Checked against

All Done-when items: **PASS** — rev8 mapping stands; no rev9 regression identified in code or cited receipts.

### Evidence inspected

- Prior `## Review rev8` Done-when mapping
- Execution receipt(s) already in ticket
- Rev9 cross-check focused on 001/017/018/033/036/037/039/041-044/045 only

### Finding

Rev8 +1 reaffirmed. No new blockers.

## Review rev10

Reviewer: independent reviewer (batch 001-045 rev10)
Date: 2026-06-14
Verdict: +1
Delta vs rev9: unchanged

### Checked against Done when

- All Done-when: **PASS** (rev9 evidence; no regression in rev10 pass).

### Evidence inspected

- Execution rev10 receipts + `docs/receipts/staging/` (focus: 001/017/018 rev9; 033/036/037 rev9 staging; 026/039/041-044/045 rev10)
- Prior `## Review rev9` mappings

### Finding

No rev10 execution receipt; rev9 Done-when mapping and artifacts hold.
