# 089 — Desktop ↔ Cloud Sync Contract

Owner: Codex
Priority: P2
Depends on: 082, 084
Release bucket: otto cloud

**Unpark when:** **082** reviewed; **084** D1 records API exists (even stub).

## Outcome

A written **sync contract** defines how desktop otto and Otto Cloud exchange receipts, proposals, approval records, and ticket status — without a second ratification path or silent canon merge.

Deliverable: `docs/v1/contracts/desktop-cloud-sync.md` (or section in `adapter-seam.md` if smaller).

## Why this matters

`docs/v1/otto-web-spec.md` defers bi-directional sync as an open decision. Without a contract, cloud becomes a fork of folder truth or desktop pushes overwrite cloud decisions unpredictably.

AGENTS.md: **folder/ticket state is truth**; chat claims are not state.

## Scope

- Authority matrix: what is SoR on disk vs D1 vs Letta memory
- Sync directions: push-only v1 vs selective pull; conflict rules (LWW forbidden for curation/tickets)
- Idempotency keys + cursor model (`sync_cursors` from otto-web-spec)
- Mutating operations: same gates as desktop (`ProposalStore.decide`, autonomy classes)
- Explicit non-sync: Letta memory blocks, provider keys, raw Paperclip truth
- Error surfaces: partial sync, offline desktop, stale cloud
- Phase map: v1 push receipts → v2 proposal decide round-trip → v3 ticket mirror read

## Non-goals

- Implementing sync workers (follow-on ticket after **084**)
- Letta memory replication
- Paperclip write-back

## Done when

- [ ] Contract doc merged; linked from `otto-web-spec.md` open decisions (resolved)
- [ ] `packages/core` or shared types sketch for sync envelope (optional stub types OK)
- [ ] No contradiction with **051** (no fake Done) or **075** (complete ≠ Done)
- [ ] Reviewer +1

## Verification

```sh
rg -l "desktop-cloud-sync|sync_cursors" docs/v1/
# manual: trace one receipt push + one conflict scenario in doc
```

## Blocker log

Leave blank unless blocked.
