# 016 — Next Layer Readiness Gate

Status: done
Owner: Sebastian / Vinny / Claude
Priority: P0 when 001-009 are done
Depends on: 001-009

## Outcome

Otto is ready to add Intake, Discord, and Paperclip without building on fake state or ambiguous contracts.

## Check 1 — real Letta path

Done when:

- App has a truthful Letta readiness state.
- Finder-launched app does not depend on shell env.
- Chat cannot claim connected unless the adapter succeeds.
- Failure states show exact blockers.

## Check 2 — receipt contract

Done when:

- Successful runs write receipts.
- Failed/blocked runs write receipts.
- Receipts include timestamp, input, action, result, evidence, and blocker if any.
- Receipts are durable enough for future adapters to attach to.

## Check 3 — curation contract

Done when:

- Correction → proposal works.
- Accept/reject/defer works.
- Accepted changes alter future behavior.
- Rejected proposals do not silently reapply.
- Consequential changes require approval.

## Check 4 — file/db boundary

Done when:

- Canonical Standards/Practices/Routines are file-backed or exportable as files.
- Any database state is index/cache/runtime state, not hidden canon.
- It is clear where adapters should read/write.

## Check 5 — adapter seam

Done when there is a clear contract for external systems to return:

```txt
context
work state
artifacts
proposals
```

And Otto alone decides:

```txt
what becomes future behavior
```

## Done when

A reviewer can answer yes to this:

```txt
Can we now add Intake/Paperclip/Discord as adapters without changing Otto's authority model?
```

If yes, mark this ticket `done` and start `010`, `011`, or `012`.

## Proof

- HQ: 018 Next-Layer Readiness Gate — **`_Done`**
- Smoke: `/Users/seb/.codex/admin/otto-018-readiness-gate-smoke-20260614T040000.json`
- Adapter seam: `docs/adapter-seam.md` in worktree
- Lane 001–009: all `done` (see `000-hq-sync.md`)
- Verified: all seven gate checks mapped; 25 electron tests pass (2026-06-14)
