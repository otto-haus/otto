# 048 — Chat: Propose from Correction

Owner: Cursor
Priority: P0
Depends on: 014, 016, 002
Release bucket: v0.1 behavior loop

## Outcome

From Chat, Sebastian can turn a correction into a **Curation proposal** without opening the Curation pane first — closing the magic-moment loop step 1.

```txt
mistake → correction → proposal → ratify → changed behavior
```

## Why this matters

IPC `create-from-correction` exists; Chat UI does not. One-pager V1 test "correction → compounds" stays Partial until this ships.

## Scope

- Message action: "Propose from correction" on user message or assistant mistake context
- Target picker: memory / practice / routine / standard / knowledge / task
- Calls existing proposal store; shows proposal id + link to Curation
- Classification preview (route ask vs auto_apply note)
- Receipt for proposal creation

## Out of scope

- Auto-accept
- Inline ratification (use Curation pane)
- Discord propose path (020)

## Done when

- Staging: one correction creates proposal visible in Curation inbox
- Proposal includes future-behavior statement + evidence refs
- Canon unchanged until accept
- Unit test for IPC handler path

## Verification

```sh
bun test ./apps/desktop/electron/proposal-store.test.ts
bun run --cwd apps/desktop typecheck
```

## Blocker log

Leave blank unless blocked.

## Execution receipt

**Branch:** `ship/v0.3-integration` · **Date:** 2026-06-13

| Done when | Proof |
|-----------|-------|
| Correction creates proposal visible in Curation | `Chat.tsx` → `submitProposal` → `api.curation.proposals.createFromCorrection`; toast + navigate to Curation |
| Future behavior + evidence refs | `ProposeCorrectionModal` fields; evidence `{ kind: 'message', ref: messageId }` |
| Canon unchanged until accept | `ProposalStore.createFromCorrection` leaves practice files untouched (existing store tests) |
| Classification preview (ask vs auto_apply) | `otto:curation:proposals:classify` IPC + modal live preview via `classify` prop |
| Message actions | `MessageActions`: "Propose from correction" + "Correct this" on otto messages |
| Unit test IPC classify path | `proposal-store.test.ts` → `classify preview matches IPC handler contract` |

**Verified:** `bun run --cwd apps/desktop typecheck`; `bun test ./apps/desktop/electron/proposal-store.test.ts`.

## Review

**Reviewer:** Independent · **Date:** 2026-06-13

**Verdict:** Partial — full Chat → IPC → store path implemented; unit tests pass; staging E2E not demonstrated.

| Done when | Status | Evidence |
|-----------|--------|----------|
| Correction creates proposal visible in Curation | Code only | `submitProposal` → `createFromCorrection` + toast + `onNavigate('curation')`; not staging-verified |
| Future behavior + evidence refs | Proven (code) | `ProposeCorrectionModal` fields; `evidence: [{ kind: 'message', ref: messageId }]` |
| Canon unchanged until accept | Proven (unit) | `proposal-store.test.ts` accept/reject/defer paths |
| Unit test IPC classify path | Proven | `classify preview matches IPC handler contract` test |

**Also shipped (scope):** `MessageActions` propose/correct buttons; live classification preview via `otto:curation:proposals:classify`; proposal creation receipt from store.

**Verification run:** `bun test proposal-store.test.ts` ✓ · `bun run --cwd apps/desktop typecheck` ✗ (`Onboarding.tsx:135`).

**+1:** No — staging “one correction → Curation inbox” not proven; typecheck fails on branch.
