# 142 — Sebastian release sign-off ceremony

Owner: Cursor+Claude
Priority: P0
Depends on: 063, 140
Release bucket: v0.1.3 gate

## Outcome

A repeatable ceremony packet Sebastian can run once per release cut: demo script, checklist walkthrough, explicit approval receipt, and NOT PUSHED until signed.

## Why this matters

063 defines the gate; this ticket makes sign-off **ceremonial and auditable** — no implicit “looks good” from chat.

## Scope

- Checklist derived from `RELEASE_CHECKLIST.md` final gate table
- Staging demo script (Ship tier only; Labs documented separately)
- Approval receipt template under `docs/receipts/staging/`
- Append Sebastian verdict block to ticket 063 cross-link

## Out of scope

- Push, tag, or publish without explicit Sebastian approval
- Marketing apex deploy (141 / 065)
- Unparking cloud or integration tickets

## Done when

- Runbook `docs/v1/runbooks/sebastian-release-sign-off.md` exists
- Demo script references staging app + smoke JSON paths
- Empty approval receipt template filled once in dry-run (staging only)
- Reviewer `+1` on ceremony completeness (not on shipping)

## Verification

```sh
test -f docs/v1/runbooks/sebastian-release-sign-off.md
grep -q "Sebastian approves" RELEASE_CHECKLIST.md
```

## Blocker log

Leave blank unless blocked.

## Review

Verdict: pending
