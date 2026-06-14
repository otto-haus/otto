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
