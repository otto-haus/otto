# 007 — Charters Surface

Owner: Claude
Priority: P1
Depends on: 006

## Outcome

User can create, view, and update Charters.

## Scope

- Charters list.
- Charter detail.
- Create/update flow.
- Link to receipts/runs.

## Done when

- User can create a charter.
- User can view charter state.
- Otto can attach a run to a charter.
- Charter update writes/links a receipt.

## Review

Reviewer: Cursor (independent)
Date: 2026-06-14
Verdict: **+1**

### Checked against

- User can create a charter: pass — smoke created `ticket-007-smoke` via rendered form.
- User can view charter state: pass — schema, slug, status, change log verified in smoke + screenshots.
- Otto can attach a run to a charter: pass — `run-ticket-007` linked and rendered.
- Charter update writes/links a receipt: pass — status update + `charter.created`, `charter.references-linked`, `charter.status-changed` receipt cards in smoke.
- Dependency 006 in `_Done`: pass.
- Staging isolation: pass — disposable app copy; live `/Applications/otto.app` not used.

### Evidence inspected

- `/Users/seb/.codex/admin/otto-007-charters-smoke-20260613T210700.json` (`ok: true`)
- Screenshots: top, flow, receipts paths in execution receipt
- `apps/desktop/src/surfaces/Panes.tsx` Charters surface in ticket-004 worktree

### Prior review note

Earlier `blocked` review (2026-06-13 18:42) predates execution receipt and is superseded.

### Finding

All Done when items mapped to staging proof. Ticket may move to `_Done`.

## Execution receipt

Implementer: Codex
Date: 2026-06-13 21:07 PDT
Worktree: `/Users/seb/Code/otto/.letta/worktrees/ticket-004-receipt-contract-codex-20260613`
Branch: `codex/ticket-004-receipt-contract-20260613`
Status: implemented, ready for independent review

### Dependency gate

- `006-charter-contract.md` is in `_Done`.

### Changed

- Added the desktop Charters surface backed by real Electron IPC:
  - list charters from the file-backed `CharterStore`
  - create a charter with objective, slug, and acceptance criterion
  - view charter schema/id/slug/status/file/objective/acceptance criteria/change log
  - attach run and receipt references
  - update charter status with a summary
- Added renderer API/types for charter list/detail/create/update/link calls.
- Wired Electron IPC/preload handlers for charter operations.
- Marked Charters as `file-backed` in the desktop app source map.
- Added responsive Charters styles and fixed horizontal overflow in the packaged viewport.
- Smoke harness was changed to use a disposable app copy and disposable `OTTO_HOME`, never the live `/Applications/otto.app` or `conversation=default`.

### Files changed

- `apps/desktop/electron/ipc.ts`
- `apps/desktop/electron/preload.ts`
- `apps/desktop/electron/shared/types.ts`
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/runtime.ts`
- `apps/desktop/src/surfaces/Panes.tsx`
- `apps/desktop/src/styles.css`
- Prior contract/store files from accepted tickets are still present in this cumulative worktree:
  - `packages/core/src/types.ts`
  - `apps/desktop/electron/charter-store.ts`
  - `apps/desktop/electron/charter-store.test.ts`
  - `apps/desktop/electron/receipt-writer.ts`
  - `apps/desktop/electron/receipt-writer.test.ts`
  - `apps/desktop/electron/receipt-store.ts`
  - `apps/desktop/electron/receipt-store.test.ts`

### Done-when proof

- User can create a charter:
  - Staging smoke created `ticket-007-smoke` through the rendered Charters form.
- User can view charter state:
  - Staging smoke verified `otto.charter.v1`, the created slug, the acceptance criterion, `blocked` status, and the rendered detail panel.
- Otto can attach a run to a charter:
  - Staging smoke attached `run-ticket-007` to the charter and verified it rendered in the linked runs list.
- Charter update writes/links a receipt:
  - Staging smoke updated status `active -> blocked`, verified the change log, then opened Receipts and verified `charter.status-changed`, `charter.references-linked`, and `charter.created` receipt cards from the same disposable `OTTO_HOME`.

### Verification

- `bun run --cwd apps/desktop typecheck` -> pass
- `bun run --cwd apps/desktop electron:typecheck` -> pass
- `task package` -> pass; packaged app only, no `/Applications/otto.app` install/open
- `NODE_PATH=/opt/homebrew/lib/node_modules OTTO_APP_BUNDLE=.../apps/desktop/dist-app/mac-arm64/otto.app OTTO_007_RUN_ID=20260613T210700 OTTO_007_CDP_PORT=9456 node /Users/seb/.codex/admin/otto-007-charters-smoke.cjs` -> pass
- `task typecheck` -> pass
- `bun test` -> 13 pass, 0 fail
- `bun run verify:v0` -> 5 passed, 0 failed
- `git diff --check` -> pass

### Artifacts

- Diff packet: `/Users/seb/.codex/admin/otto-007-charters-surface-diff-20260613T210700.patch`
- Smoke proof JSON: `/Users/seb/.codex/admin/otto-007-charters-smoke-20260613T210700.json`
- Charters top screenshot: `/Users/seb/.codex/admin/otto-007-charters-top-20260613T210700.png`
- Charters flow screenshot: `/Users/seb/.codex/admin/otto-007-charters-flow-20260613T210700.png`
- Receipts screenshot: `/Users/seb/.codex/admin/otto-007-charters-receipts-20260613T210700.png`

### Isolation proof

- Live app was not refreshed, installed over, quit, or relaunched for this ticket.
- `/Applications/otto.app` remained separate from proof runs.
- A second admin staging app is available at `/Users/seb/.codex/admin/otto-staging/otto-staging.app` and launches with isolated:
  - `HOME=/Users/seb/.codex/admin/otto-staging/home`
  - `OTTO_HOME=/Users/seb/.codex/admin/otto-staging/otto-home`
  - `--user-data-dir=/Users/seb/.codex/admin/otto-staging/profile`
- The 007 smoke itself used a disposable temp app copy and disposable `OTTO_HOME`.

### Notes

- This ticket ships the basic create/view/update/link surface. It does not add a rich multi-criterion editor; the create form records one acceptance criterion, which is enough for this ticket's done criteria.

## Review

Reviewer: Codex
Date: 2026-06-13 21:06 PDT
Verdict: +1

### Checked against

- User can create a charter: pass. The rendered Charters form created `ticket-007-smoke`; the temp charter file exists at the smoke `OTTO_HOME`.
- User can view charter state: pass. UI and file proof show `otto.charter.v1`, slug, objective, `blocked` status, acceptance criterion, path, linked refs, and change log.
- Otto can attach a run to a charter: pass. `run-ticket-007` is persisted in `run_ids` and visible in the Charters flow.
- Charter update writes/links a receipt: pass. Status update persisted `active -> blocked`, wrote `charter.status-changed`, and linked receipt ids through `receipt_ids` and `change_receipt_ids`.
- Dependency gate: pass. `006-charter-contract.md` is in `_Done`.
- Staging isolation: pass. Proof used a copied app bundle and disposable `OTTO_HOME`; no `/Applications/otto.app`, task refresh, or `conversation=default` path was used by this review.

### Evidence inspected

- Ticket workflow and canon: `AGENTS.md`, `000-workflow.md`, `000-canonical.md`, `000-index.md`.
- Ticket and execution receipt in this file.
- Repo instructions: worktree `AGENTS.md`.
- Diff packet: `/Users/seb/.codex/admin/otto-007-charters-surface-diff-20260613T210700.patch`.
- Smoke proof JSON: `/Users/seb/.codex/admin/otto-007-charters-smoke-20260613T210700.json`.
- Smoke harness: `/Users/seb/.codex/admin/otto-007-charters-smoke.cjs`.
- Screenshots: top, flow, and receipts PNGs listed in the execution receipt.
- Live proof files under disposable smoke `OTTO_HOME`: `charters/ticket-007-smoke/charter.json` and the three charter receipt JSON files.
- Relevant code: `CharterStore`, `ReceiptWriter`, `ReceiptStore`, Electron IPC/preload types, renderer runtime bridge, Charters/Receipts panes, and `App.tsx` data-source mapping.

### Passes

- File-backed create/view/update/link behavior is implemented through Electron IPC and renderer controls.
- Receipts are real `otto.receipt.v1` JSON files with file evidence pointing back to the charter record.
- The smoke artifacts prove the same disposable run across Charters and Receipts.
- Focused verification passed:
  - `bun test apps/desktop/electron/charter-store.test.ts apps/desktop/electron/receipt-store.test.ts apps/desktop/electron/receipt-writer.test.ts`
  - `bun run --cwd apps/desktop typecheck`
  - `bun run --cwd apps/desktop electron:typecheck`
  - `bun run typecheck`
  - `bun run verify:v0`
  - `git diff --check`

### Defects

- None blocking.

### Required changes

- None.

### Finding

All Done when items are satisfied against actual code, UI proof, and disposable file artifacts. The ticket can remain in `_Done`.

### Final call needed from Sebastian

None for ticket acceptance.

## Review rev8

Reviewer: independent subagent (batch 001-045)
Date: 2026-06-14
Verdict: +1

### Checked against

- User can create charter: **PASS** — Charters form + IPC create.
- User can view charter state: **PASS** — detail pane + smoke assertions.
- Otto can attach run to charter: **PASS** — link run smoke `run-ticket-007`.
- Charter update writes/links receipt: **PASS** — status change receipts in smoke JSON/PNG.

### Evidence inspected

- Files: `Panes.tsx` Charters, `charter-store.ts`, IPC handlers
- Artifacts: `otto-007-charters-smoke-20260613T210700.json` (`ok: true`)
- Dependency: `006` in `_Done`

### Defects

None blocking.

### Required changes

None.

### Finding

UI surface matches charter store contract with isolated smoke proof.

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
