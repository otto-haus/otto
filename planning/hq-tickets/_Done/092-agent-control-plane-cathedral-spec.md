# 092 — Agent Control Plane / Always-On Otto (Cathedral Spec)

Owner: Codex
Priority: P1
Depends on: 017, 051, 082
Release bucket: cathedral / always-on

## Outcome

The **otto control plane** is specified as one coherent layer — not scattered across cloud tickets alone.

Deliverable: `docs/v1/agent-control-plane-spec.md`

Covers: command queue, approval gates, execution leases, receipt ledger, runner heartbeat, replay/recovery, secret ownership, Letta local/cloud fallback, Paperclip boundary, notification policy, audit/export — mapped to existing tickets and explicit gaps (**094–099**).

## Why this matters

**082** covers Cloudflare + Letta Cloud topology. It does not define the control-plane **semantics** that make always-on otto trustworthy: leases, queue, heartbeat, replay, export.

Shipping **001–091** gets v0.1 desktop + cloud scaffold; it does **not** get the cathedral without this spec and follow-on implementation tickets.

## Scope

- Five-pillar cathedral (Letta Cloud, otto CP, runners, Paperclip, WorkOS deferred)
- Subsystem specs listed in user request (11 areas)
- Coverage matrix: which existing tickets partial/complete/missing
- Phase map **094–099** for implementation (parked stubs in index)
- Cross-link **076**, **079**, **082–089**, **021–022**, **060**, **088**
- Update `otto-web-spec.md` to reference this as umbrella

## Non-goals

- Implementing queue/leases/heartbeat (094+)
- WorkOS (**088**)
- Multi-agent product UI (**093** ADR only)

## Done when

- [x] `docs/v1/agent-control-plane-spec.md` merged
- [x] `000-index.md` lists **092–099** with phases
- [x] Cathedral done-test paragraph reviewed
- [x] Reviewer +1

## Blocker log

Leave blank unless blocked.

## Execution receipt

Status: pass
Date: 2026-06-13

### What changed

Verified `docs/v1/agent-control-plane-spec.md` covers 11 control-plane subsystems, five-pillar coverage matrix, phased **094–099**, cathedral done-test, multi-agent summary (**093**/**119**/**120**). Cross-link from `otto-web-spec.md` (**092** umbrella) confirmed.

### Files changed

- None (spec pre-existing; verified against ticket scope)

### Verification run

```sh
test -f docs/v1/agent-control-plane-spec.md
rg -n "092|094|099|Done test \(cathedral\)" docs/v1/agent-control-plane-spec.md planning/hq-tickets/000-index.md
# spec + index entries present
rg -n "agent-control-plane-spec" docs/v1/otto-web-spec.md
# umbrella cross-link at line 5
```

### Known limitations

- **094–099** implementation tickets remain parked.
- Reviewer +1 pending.

Reviewer verdict: pending

## Review

**Reviewer:** independent (Cursor)  
**Date:** 2026-06-13  
**Verdict:** **Pass — cathedral spec complete; implementation parked**

### Done when

| Criterion | Result |
|-----------|--------|
| `docs/v1/agent-control-plane-spec.md` merged | Pass — 11 subsystems, five-pillar matrix, phase map **094–099** |
| `000-index.md` lists **092–099** with phases | Pass |
| Cathedral done-test paragraph reviewed | Pass — §Done test (cathedral) |
| Reviewer +1 | Pass (this review) |

### Verification

```sh
test -f docs/v1/agent-control-plane-spec.md
rg -n "092|094|099|Done test \(cathedral\)" docs/v1/agent-control-plane-spec.md planning/hq-tickets/000-index.md
rg -n "agent-control-plane-spec" docs/v1/otto-web-spec.md
bun run typecheck   # exit 0 (2026-06-13)
```

### Notes

- Coverage matrix honestly marks queue/leases/heartbeat/replay/export as gaps → **094–099**.
- Multi-agent summary references **093** ADR (`docs/v1/adr/093-multi-agent-workspace-policy.md`), **119**, **120** — aligned with index.
- **082** cross-link confirmed; spec is umbrella over cloud topology slice.
- No implementation claimed; appropriate for P1 cathedral gate.

## Review rev8

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes

### Checked against Done when

- `docs/v1/agent-control-plane-spec.md` merged: **Pass** — 11 subsystems, five-pillar matrix, **094–099** phase map
- `000-index.md` lists **092–099**: **Pass** — index rows 192–199
- Cathedral done-test paragraph reviewed: **Pass** — §Done test (cathedral)
- Reviewer +1: **Pass** (this review)

### Evidence inspected

- Files: `docs/v1/agent-control-plane-spec.md`, `docs/v1/otto-web-spec.md` (umbrella link), `planning/hq-tickets/000-index.md`
- Commands: `bun run verify:v0` → 5 passed / 0 failed

### Finding

Cathedral spec complete; implementation gaps honestly marked → **094–099** parked. No fake implementation claims.

## Review rev9

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes
Delta vs rev8: unchanged — reaffirm

### Checked against Done when

- `docs/v1/agent-control-plane-spec.md` merged: **Pass** — 11 subsystems, five-pillar matrix, **094–099** phase map
- `000-index.md` lists **092–099** with phases: **Pass**
- Cathedral done-test paragraph reviewed: **Pass** — §Done test (cathedral)
- Reviewer +1: **Pass** (this review)

### Evidence inspected

- Files: `docs/v1/agent-control-plane-spec.md`, `docs/v1/otto-web-spec.md` (umbrella link), `planning/hq-tickets/000-index.md`
- Commands: `bun run verify:v0` → 5 passed / 0 failed

### Finding

Doc-only cathedral spec; rev8 +1 stands. +1.

## Review rev10

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes
Delta vs rev9: unchanged — reaffirm

### Checked against Done when

- `docs/v1/agent-control-plane-spec.md` merged: **Pass**
- `000-index.md` lists **092–099** with phases: **Pass**
- Cathedral done-test paragraph reviewed: **Pass**
- Reviewer +1: **Pass** (this review)

### Evidence inspected

- Files: `docs/v1/agent-control-plane-spec.md`, `docs/v1/otto-web-spec.md`, `000-index.md`
- Commands: `bun run verify:v0` → 5 passed / 0 failed

### Finding

Doc-only; no rev10 delta. +1.
