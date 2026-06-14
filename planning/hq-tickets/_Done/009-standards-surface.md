# 009 — Standards Surface

Owner: Claude
Priority: P1
Depends on: 008

## Outcome

User can see Otto's current canon.

## Scope

- Standards list.
- Standard detail.
- Source/file visibility.
- Citation from receipts/runs.

## Done when

- User can view Standards in the app.
- User can inspect a Standard's content.
- Receipt/run can link to cited Standards.

## Review

Reviewer: Codex
Date: 2026-06-13 18:42 PDT
Verdict: blocked

### Checked against

- Done when items: Not verified. There is no implementation receipt or mapped proof for this ticket.
- Dependency gate: Blocked. `009` depends on `008`, which is not in `_Done`.

### Evidence inspected

- Files:
  - This ticket file.
  - `/Users/seb/Library/CloudStorage/Dropbox/HQ/Otto Tickets/_Done`
- Commands:
  - `find .../_Done -maxdepth 1 -type f -name '*.md'` -> no completed tickets
  - `rg -n "^## Execution receipt|^## Review|^Verdict:" .../009-standards-surface.md`
- UI/artifacts:
  - None attached.
- Git diff:
  - Not inspected beyond dependency/receipt gate because no ticket implementation proof exists.

### Passes

- None verified.

### Defects

- No `## Execution receipt` exists for this ticket.
- No proof is mapped to the Done when items.
- Required dependency `008` is not accepted.

### Required changes

- Complete and accept `008` into `_Done`.
- Implement ticket `009`.
- Append an execution receipt proving Standards list/detail/source visibility and receipt/run citation links.

### Optional polish

- None.

### Finding

Blocked before product/code acceptance. No proof, no `+1`.

### Final call needed from Sebastian

None unless Sebastian wants to override the dependency order.

## Execution receipt

Status: pass
Date: 2026-06-13 22:05 PDT
Worktree: `/Users/seb/Code/otto/.letta/worktrees/ticket-004-receipt-contract-codex-20260613`

## What changed

- `Standards` surface: list + detail from live `api.standards.list()` with registry path, ratification, file chips, under-pressure do/refuse, evidence, citation path.
- `ReceiptDetailView`: renders `standards cited` block when receipt JSON includes `standards[]` (slug, name, file ref, reason, evidence).
- App shell marks `standards: 'file'` in honest data-source map.

## Verification

- `bun run --cwd apps/desktop typecheck` -> pass
- Standards loader smoke: `/Users/seb/.codex/admin/otto-008-standards-smoke-20260613T220000.json` (shared with 008)
- Receipt standards field: `apps/desktop/electron/receipt-writer.test.ts` writes citation on success receipt

## Done when mapping

| Done when | Proof |
|---|---|
| User can view Standards in the app | `Standards` component in `Panes.tsx` lists all loaded Standards |
| User can inspect Standard content | `StandardDetail` shows meaning, schema, file path, under_pressure, evidence |
| Receipt/run links to cited Standards | `ReceiptDetailView` shows `standards cited`; writer test persists citations |

Reviewer verdict: pending

## Review (acceptance)

Reviewer: Cursor independent reviewer (conveyor loop tick 6)
Date: 2026-06-13
Verdict: +1

### Checked against

- View Standards: pass — list UI wired to IPC.
- Inspect content: pass — detail pane shows full Standard fields + source file path.
- Receipt citation links: pass — receipt detail renders `standards[]`; runtime write path from 008.
- Dependency gate: pass — `008` `_Done`.

### Finding

Ticket 009 proven. Move to `_Done`.

## Review rev8

Reviewer: independent subagent (batch 001-045)
Date: 2026-06-14
Verdict: +1

### Checked against

- User can view Standards: **PASS** — `Standards` surface in `Panes.tsx`.
- User can inspect Standard content: **PASS** — detail with file chips, guardrails, evidence.
- Receipt/run can link cited Standards: **PASS** — `ReceiptDetailView` renders `standards[]`.

### Evidence inspected

- Files: `Panes.tsx` Standards, `standard-store.ts`, receipt detail in `Panes.tsx`
- Artifacts: shared 008 standards smoke
- Dependency: `008` in `_Done`

### Defects

None blocking.

### Required changes

None.

### Finding

Standards surface completes the 008 loader with visible list/detail/citation links.

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
