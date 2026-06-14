# 005 — Receipts Surface

Owner: Claude
Priority: P0
Depends on: 004

## Outcome

User can inspect Otto's proof trail.

## Scope

- Receipts list.
- Receipt detail.
- Filters or simple search if cheap.
- Links to related run/chat if available.

## Done when

- User can open Receipts surface.
- User can view receipt detail.
- Success and blocked receipts are visible.
- Receipt content matches the contract from ticket 004.

## Review

Reviewer: Codex
Date: 2026-06-13 18:42 PDT
Verdict: blocked

### Checked against

- Done when items: Not verified. There is no implementation receipt or mapped proof for this ticket.
- Dependency gate: Blocked. `005` depends on `004`, which is still in root and blocked because `001` and `002` are not in `_Done`.

### Evidence inspected

- Files:
  - This ticket file.
  - `/Users/seb/Library/CloudStorage/Dropbox/HQ/Otto Tickets/_Done`
- Commands:
  - `find .../_Done -maxdepth 1 -type f -name '*.md'` -> no completed tickets
  - `rg -n "^## Execution receipt|^## Review|^Verdict:" .../005-receipts-surface.md`
- UI/artifacts:
  - None attached.
- Git diff:
  - Not inspected beyond dependency/receipt gate because no ticket implementation proof exists.

### Passes

- None verified.

### Defects

- No `## Execution receipt` exists for this ticket.
- No proof is mapped to the Done when items.
- The required receipt contract from ticket `004` is not accepted.

### Required changes

- Complete and accept `004` into `_Done`.
- Implement ticket `005`.
- Append an execution receipt with proof for receipts list/detail, success and blocked receipt visibility, and conformance to ticket `004`.

### Optional polish

- None.

### Finding

Blocked before product/code acceptance. No proof, no `+1`.

### Final call needed from Sebastian

None unless Sebastian wants to override the dependency order.

## Execution receipt

Implementer: Codex
Date: 2026-06-13 20:37 PDT
Suggested status: review

### Repo

- Path: `/Users/seb/Code/otto/.letta/worktrees/ticket-004-receipt-contract-codex-20260613`
- Branch: `codex/ticket-004-receipt-contract-20260613`
- Dependency: `004-receipt-contract.md` is in `_Done` with reviewer `+1`.
- Diff artifact: `/Users/seb/.codex/admin/otto-005-receipts-surface-diff-20260613.patch`

### Files changed for this ticket

- `apps/desktop/electron/receipt-store.ts`
- `apps/desktop/electron/receipt-store.test.ts`
- `apps/desktop/electron/ipc.ts`
- `apps/desktop/electron/preload.ts`
- `apps/desktop/electron/shared/types.ts`
- `apps/desktop/src/runtime.ts`
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/surfaces/Panes.tsx`
- `apps/desktop/src/styles.css`

Existing ticket 004 files remain in the same dirty worktree because 005 builds on the accepted receipt contract:

- `packages/core/src/types.ts`
- `apps/desktop/electron/config-store.ts`
- `apps/desktop/electron/letta-runner.ts`
- `apps/desktop/electron/receipt-writer.ts`
- `apps/desktop/electron/receipt-writer.test.ts`
- `apps/desktop/tsconfig.electron.json`

### What was implemented

- Added an Electron `ReceiptStore` that reads real `otto.receipt.v1` JSON files from `OTTO_HOME/receipts` or `~/.otto/receipts`.
- Added receipt IPC and preload bridge methods:
  - `otto:receipts:list`
  - `otto:receipts:get`
  - `window.otto.receipts.list()`
  - `window.otto.receipts.get(id)`
- Replaced the placeholder Receipts pane with a file-backed surface:
  - opens from the sidebar Receipts nav;
  - shows receipt count, local receipt directory, search, and status filters;
  - lists success, blocked, and failed receipts from real files only;
  - opens detail for the selected receipt;
  - renders contract fields: `schema`, `id`, `timestamp`, `status`, `subject`, `action`, `input`, `result`, `evidence`, `blocker`, and source file path;
  - shows subject/chat ids and evidence refs when available.
- Kept the web preview honest: without Electron IPC, it says receipts are available in the desktop app rather than showing mock data.
- Marked the Receipts source pill as `file-backed`.

### Verification

- `git diff --check` -> pass
- `task typecheck` -> pass
- `bun test` -> 10 pass, 0 fail
- `bun run verify:v0` -> 5 passed, 0 failed
- `task package` -> pass; built `apps/desktop/dist-app/mac-arm64/otto.app` without replacing `/Applications/otto.app`
- Staging app copy created at `/Users/seb/.codex/admin/otto-staging/otto-staging.app`
- Staging launch script: `/Users/seb/.codex/admin/otto-staging/launch-otto-staging-smoke.sh`
- Final rendered smoke used staging app only:
  - command: `NODE_PATH=/opt/homebrew/lib/node_modules OTTO_005_RUN_ID=20260613T204500 OTTO_005_CDP_PORT=9441 node /Users/seb/.codex/admin/otto-005-receipts-smoke.cjs`
  - proof JSON: `/Users/seb/.codex/admin/otto-005-receipts-smoke-20260613T204500.json`
  - blocked screenshot: `/Users/seb/.codex/admin/otto-005-receipts-blocked-20260613T204500.png`
  - success screenshot: `/Users/seb/.codex/admin/otto-005-receipts-success-20260613T204500.png`
  - console messages: none relevant

### Done-when mapping

- User can open Receipts surface: proven by staging screenshot and smoke click on sidebar Receipts nav.
- User can view receipt detail: proven by smoke assertions for blocked and success detail panes.
- Success and blocked receipts are visible: proven by seeded `otto.receipt.v1` success and blocked records in staging `OTTO_HOME/receipts`, visible in list screenshots and asserted by smoke.
- Receipt content matches contract from ticket 004: proven by `ReceiptStore` validation, receipt detail fields, unit tests, and rendered assertions for `otto.receipt.v1`, status, action, subject, result, evidence, and blocker.

### Isolation note

- Sebastian reported live `/Applications/otto.app` was being disrupted during verification. After that, verification was moved to `/Users/seb/.codex/admin/otto-staging/otto-staging.app` with isolated `HOME`, `OTTO_HOME`, profile, debug port, and `OTTO_SMOKE=1`.
- Final rendered proof did not replace or relaunch `/Applications/otto.app`.
- Process check after staging smoke showed the live app still running and no staging app process left behind.

### Known gaps

- There is no deep link to a live chat/run route yet. The pane shows the receipt `subject` id and evidence refs when present, which is the available related run/chat context in the current contract.
- The receipt reader skips malformed JSON files rather than surfacing a full invalid-file diagnostics table. It reports the skipped count in the toolbar.

### Final call needed from Sebastian

None.

## Review

Reviewer: Codex independent Otto ticket reviewer
Date: 2026-06-13 20:41 PDT
Verdict: +1

### Checked against

- User can open Receipts surface: pass. The smoke script clicks the Receipts nav, the proof JSON has `ok=true`, and both screenshots show the Receipts route selected with a file-backed source pill.
- User can view receipt detail: pass. The smoke checks blocked detail fields first, then clicks the success receipt and checks the success detail id, conversation id, and evidence ref.
- Success and blocked receipts are visible: pass. The smoke proof records two receipt cards, one `blocked` and one `success`, and both screenshots show those cards in the list.
- Receipt content matches the contract from ticket 004: pass. The surface reads `otto.receipt.v1` JSON from `OTTO_HOME/receipts`, validates/list-loads schema/id/timestamp/status/subject/action/input/result/evidence/blocker, and renders the contract fields in the detail pane. The seeded smoke receipts contain the ticket 004 required fields.
- Dependency/folder state: pass. Tickets `001`, `002`, `003`, and `004` are in `_Done`; `004-receipt-contract.md` contains reviewer `Verdict: +1`; `005-receipts-surface.md` is in `_InReview`.

### Evidence inspected

- Files:
  - `/Users/seb/Library/CloudStorage/Dropbox/HQ/Otto Tickets/AGENTS.md`
  - `/Users/seb/Library/CloudStorage/Dropbox/HQ/Otto Tickets/000-canonical.md`
  - `/Users/seb/Library/CloudStorage/Dropbox/HQ/Otto Tickets/000-index.md`
  - `/Users/seb/Library/CloudStorage/Dropbox/HQ/Otto Tickets/000-workflow.md`
  - `/Users/seb/Library/CloudStorage/Dropbox/HQ/Otto Tickets/_workflow-review-ticket.md`
  - `/Users/seb/Library/CloudStorage/Dropbox/HQ/Otto Tickets/_Done/004-receipt-contract.md`
  - `/Users/seb/Library/CloudStorage/Dropbox/HQ/Otto Tickets/_InReview/005-receipts-surface.md`
  - `apps/desktop/electron/receipt-store.ts`
  - `apps/desktop/electron/receipt-store.test.ts`
  - `apps/desktop/electron/ipc.ts`
  - `apps/desktop/electron/preload.ts`
  - `apps/desktop/electron/shared/types.ts`
  - `apps/desktop/src/runtime.ts`
  - `apps/desktop/src/App.tsx`
  - `apps/desktop/src/surfaces/Panes.tsx`
  - `apps/desktop/src/styles.css`
- Commands:
  - `git status --short --branch` -> expected dirty worktree for tickets 004/005; no unrelated tracked surface found in the reviewed area.
  - `find .../_Done -maxdepth 1 -type f -name '00[1-4]-*.md'` -> `001`, `002`, `003`, `004` present in `_Done`.
  - `find .../_InReview -maxdepth 1 -type f -name '005-*.md'` -> `005` present in `_InReview`.
  - `git diff --check` -> pass.
  - `bun test apps/desktop/electron/receipt-store.test.ts` -> 2 pass, 0 fail.
  - Smoke proof `jq` check -> `ok=true`, two cards, zero console messages.
  - Seed receipt `jq` contract check -> true for both success and blocked receipt JSON files.
  - Process check for the 005 proof path/run/debug port -> no remaining process matched `/Users/seb/.codex/admin/otto-staging/otto-staging.app`, `otto-005-receipts-20260613T204500`, or port `9441`.
- UI/artifacts:
  - `/Users/seb/.codex/admin/otto-005-receipts-smoke-20260613T204500.json`
  - `/Users/seb/.codex/admin/otto-005-receipts-blocked-20260613T204500.png`
  - `/Users/seb/.codex/admin/otto-005-receipts-success-20260613T204500.png`
  - Seeded success and blocked receipt JSON under the smoke `OTTO_HOME/receipts` directory.
- Git diff:
  - Reviewed `/Users/seb/.codex/admin/otto-005-receipts-surface-diff-20260613.patch` and the live worktree files. The diff adds the file-backed ReceiptStore, IPC/preload bridge, renderer receipt types, Receipts pane list/detail/filter UI, and receipt styles while preserving ticket 004 receipt writer/contract work.

### Passes

- All ticket 005 Done when items are satisfied with mapped proof.
- The UI does not fabricate operational receipts; web preview stays honest, and desktop reads real local receipt files only.
- The visible receipt cards and detail pane match the ticket 004 `otto.receipt.v1` contract basis.
- Search/status filters were added within scope.
- No old Vinny/Veto/cockpit naming found in the reviewed changed receipt surface files.

### Defects

None blocking.

### Required changes

None.

### Optional polish

- If the filters are tuned later, consider clearing or reselecting the detail pane when the active filter excludes the currently selected receipt. This is not required for ticket 005 acceptance.
- A separate `/Applications/otto-staging.app` process was running locally, but it did not match the 005 smoke proof path, run id, or debug port, so I did not treat it as a ticket blocker.

### Finding

Ticket 005 is proven against its Done when items and dependency gate. The implementation may move to `_Done`.

### Final call needed from Sebastian

None for ticket acceptance. Commit/push/release remain separate approval boundaries.
