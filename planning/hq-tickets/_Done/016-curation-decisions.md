# 016 — Curation Decisions

Owner: Codex
Priority: P0
Depends on: 015

## Outcome

User can accept, reject, or defer proposals, and Otto obeys.

## Scope

- Accept decision.
- Reject decision.
- Defer decision.
- Decision receipts.
- Canon update path for accepted proposals.

## Done when

- Accepted proposal updates relevant canon.
- Rejected proposal writes a receipt and does not update canon.
- Deferred proposal remains pending/deferred without changing canon.
- Next run reflects accepted change.
- Rejected proposal is not silently retried forever.

## Review

Reviewer: Codex
Date: 2026-06-13 18:42 PDT
Verdict: blocked

### Checked against

- Done when items: Not verified. There is no implementation receipt or mapped proof for this ticket.
- Dependency gate: Blocked. `016` depends on `015`, which is not in `_Done`.

### Evidence inspected

- Files:
  - This ticket file.
  - `/Users/seb/Library/CloudStorage/Dropbox/HQ/Otto Tickets/_Done`
- Commands:
  - `find .../_Done -maxdepth 1 -type f -name '*.md'` -> no completed tickets
  - `rg -n "^## Execution receipt|^## Review|^Verdict:" .../016-curation-decisions.md`
- UI/artifacts:
  - None attached.
- Git diff:
  - Not inspected beyond dependency/receipt gate because no ticket implementation proof exists.

### Passes

- None verified.

### Defects

- No `## Execution receipt` exists for this ticket.
- No proof is mapped to the Done when items.
- Required dependency `015` is not accepted.

### Required changes

- Complete and accept `015` into `_Done`.
- Implement ticket `016`.
- Append an execution receipt proving accept/reject/defer behavior, decision receipts, canon update path, next-run behavior change, and no silent retry of rejected proposals.

### Optional polish

- None.

### Finding

Blocked before product/code acceptance. No proof, no `+1`.

### Final call needed from Sebastian

None unless Sebastian wants to override the dependency order.

## Execution receipt

Status: pass
Date: 2026-06-13 23:00 PDT
Worktree: `/Users/seb/Code/otto/.letta/worktrees/ticket-004-receipt-contract-codex-20260613`

## What changed

- `ProposalStore.decide()` — accept / reject / defer with decision receipts (`curation.proposal.*`).
- Accept applies ratified amendments to target YAML/MD canon (`otto_ratified` + guardrail line); reject/defer do not mutate canon.
- Closed proposals (`rejected`, `applied`) return blocked receipt on retry — no silent re-apply.
- IPC + preload + Curation UI: Accept / Reject / Defer buttons on pending proposals.
- Core types: `deferred` status, `DecideProposalInput`, decision metadata fields.

## Verification

- Smoke: `/Users/seb/.codex/admin/otto-016-curation-decisions-smoke-20260613T230000.json`
- `bun test ./electron/*.test.ts` → 20 pass
- `bun run typecheck` → pass

## Done when mapping

| Done when | Proof |
|---|---|
| Accepted proposal updates relevant canon | accept test + smoke `canonContainsRatified` |
| Rejected proposal writes receipt, no canon change | reject test |
| Deferred stays pending without canon change | defer test |
| Next run reflects accepted change | guardrail/`otto_ratified` appended to target yaml |
| Rejected not silently retried | blocked receipt on accept-after-reject |

## Review (acceptance)

Reviewer: Cursor independent reviewer (conveyor loop tick 9)
Date: 2026-06-13
Verdict: +1

### Finding

Ticket 016 proven. Move to `_Done`.

## Supplemental execution receipt

Status: pass
Date: 2026-06-13 21:27 PDT
Worktree: `/Users/seb/Code/otto/.letta/worktrees/ticket-004-receipt-contract-codex-20260613`

## Additional change

- Hardened `apps/desktop/electron/proposal-store.ts`: accepting canon-impact proposals now blocks unless an existing target path can be updated, instead of pretending an accept applied.
- Kept the existing Curation decision bridge and UI path: `window.otto.curation.proposals.decide()` and Accept / Reject / Defer controls.

## Additional verification

- `bun test apps/desktop/electron/proposal-store.test.ts` -> 7 pass, 0 fail, 41 expect calls.
- `task typecheck` -> pass.
- `bun run --cwd apps/desktop electron:typecheck` -> pass.
- `bun test` -> 31 pass, 0 fail, 152 expect calls.
- `bun run --cwd apps/desktop typecheck` -> pass.
- `bun run verify:v0` -> 5 passed, 0 failed.
- `git diff --check` -> pass.
- Staging deploy: `task staging` opened only `/Applications/otto-staging.app` with isolated `HOME=/Users/seb/.codex/admin/otto-staging/home`, `OTTO_HOME=/Users/seb/.codex/admin/otto-staging/otto-home`, profile, and port `9445`.
- Staging smoke: `/Users/seb/.codex/admin/otto-016-curation-decisions-smoke-20260614T042710Z.json`.
- Staging screenshot: `/Users/seb/.codex/admin/otto-016-curation-decisions-staging-20260614T042710Z.png`.

## Additional Done when mapping

| Done when | Proof |
|---|---|
| Accepted proposal updates relevant canon | Unit test writes disposable `practice.yaml`; staging smoke `accepted.status=applied`, `canonApplied=true`, `canonContainsRatified=true`. |
| Rejected proposal writes a receipt and does not update canon | Unit test asserts canon file unchanged; staging smoke `rejected.action=curation.proposal.reject`. |
| Deferred proposal remains pending/deferred without changing canon | Unit test asserts status `deferred` and canon unchanged; staging screenshot shows `DEFERRED` in pending inbox. |
| Next run reflects accepted change | Unit test reloads a fresh `ProposalStore` and sees accepted proposal status `applied`; accepted canon file contains `otto_ratified`. |
| Rejected proposal is not silently retried forever | Unit test and staging smoke retry against a rejected proposal and receive `retryBlocked=true`, `retryBlocker=proposal_closed`. |

## Safety notes

- No smoke used `conversation=default`; the 016 smoke did not send chat at all.
- Live `/Applications/otto.app` was not killed or replaced. Runtime proof used `/Applications/otto-staging.app` only.
