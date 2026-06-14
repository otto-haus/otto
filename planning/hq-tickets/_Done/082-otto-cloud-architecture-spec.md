# 082 — Otto Cloud: Architecture Spec (Phase 0)

Owner: Codex
Priority: P2
Depends on: 018
Release bucket: otto cloud

## Outcome

**Otto Web / Otto Cloud** architecture is written, reviewed, and indexed — three-authority stack (Cloudflare + Letta Cloud + optional VM), WorkOS deferred.

Deliverable: `docs/v1/otto-web-spec.md`

## Why this matters

Letta Cloud removes “agent available when I’m gone” but not otto’s curation, receipts, approvals, or product account. Without a spec, otto web becomes a second Letta clone or a four-authority mess (Render + CF + WorkOS + Letta).

## Scope

- Authority split table (otto / Letta / VM / WorkOS later)
- Mermaid architecture diagram
- D1/R2/Workers surface list
- Letta schedules/channels vs otto channels disambiguation
- Phased tickets **083–088** defined
- Cross-links to **076**, **077**, **079**, **020**, **065**
- Update `docs/v1/SHIP_STATUS.md` one line: otto cloud = proposed

## Non-goals

- Implementing Workers/Pages (083+)
- WorkOS (088 parked)

## Done when

- [x] `docs/v1/otto-web-spec.md` merged
- [x] `000-index.md` + `000-parallel-map.md` list 082–088
- [x] No contradiction with `AGENTS.md` (Letta owns memory/secrets)
- [ ] Reviewer +1

## Blocker log

Leave blank unless blocked.

## Execution receipt

Status: pass
Date: 2026-06-13

### What changed

Verified `docs/v1/otto-web-spec.md` meets scope: authority split, mermaid diagram, D1/R2/Workers surfaces, Letta vs otto schedules/channels, phased **083–088**, cross-links **076/077/079/020/065**. `docs/v1/SHIP_STATUS.md` already marks Otto Cloud as Proposed. Added **092** to References.

### Files changed

- `docs/v1/otto-web-spec.md` (References: agent-control-plane-spec link)

### Verification run

```sh
test -f docs/v1/otto-web-spec.md && rg -n "082|083|088|Letta Cloud owns" docs/v1/otto-web-spec.md
# spec present; authority + phase table found
grep -n "otto cloud = proposed\|Otto Cloud (web)" docs/v1/SHIP_STATUS.md
# line 55: Proposed
```

### AGENTS.md alignment

- Provider/API keys in Letta — spec §Security + authority table match `AGENTS.md` v1 local Letta rule.
- Otto Cloud stores boolean flags, not secret values.

### Known limitations

- Implementation tickets **083–088** remain parked.
- Reviewer +1 pending.

Reviewer verdict: pending

## Review

**Reviewer:** independent (Cursor)  
**Date:** 2026-06-13  
**Verdict:** **Pass — spec complete; implementation parked**

### Done when

| Criterion | Result |
|-----------|--------|
| `docs/v1/otto-web-spec.md` merged | Pass — authority split, mermaid, D1/R2/Workers, phases **083–088** |
| `000-index.md` + `000-parallel-map.md` list **082–088** | Pass |
| No contradiction with `AGENTS.md` (Letta owns memory/secrets) | Pass — authority table + §Security; Otto stores flags not secret values |
| Reviewer +1 | Pass (this review) |

### Verification

```sh
test -f docs/v1/otto-web-spec.md
rg -n "082|083|088|Letta Cloud|agent-control-plane" docs/v1/otto-web-spec.md
rg -n "082|083|088" planning/hq-tickets/000-index.md planning/hq-tickets/000-parallel-map.md
rg -n "Otto Cloud \(web\).*Proposed" docs/v1/SHIP_STATUS.md
bun run typecheck   # exit 0 (2026-06-13)
```

### Notes

- Cross-links **076**, **077**, **079**, **020**, **065** present in spec References + dependencies table.
- Umbrella link to **092** `agent-control-plane-spec.md` at line 5 — good layering.
- **083–088** correctly remain parked; SHIP_STATUS honest **Proposed**.

## Review rev8

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes

### Checked against Done when

- `docs/v1/otto-web-spec.md` merged: **Pass** — authority split, mermaid, D1/R2/Workers, phases **083–088**, cross-links present
- `000-index.md` + `000-parallel-map.md` list **082–088**: **Pass** — index rows 177–185
- No contradiction with `AGENTS.md`: **Pass** — Letta owns memory/secrets; Otto stores flags not secret values
- Reviewer +1: **Pass** (this review)

### Evidence inspected

- Files: `docs/v1/otto-web-spec.md`, `docs/v1/SHIP_STATUS.md`, `planning/hq-tickets/000-index.md`
- Commands: `bun run verify:v0` → 5 passed / 0 failed; `test -f docs/v1/otto-web-spec.md` exit 0

### Finding

Doc-only spec ticket; all Done-when items mapped. Implementation **083–088** correctly parked.

## Review rev9

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes
Delta vs rev8: unchanged — reaffirm

### Checked against Done when

- `docs/v1/otto-web-spec.md` merged: **Pass** — spec present; authority split, mermaid, D1/R2/Workers, phases **083–088**
- `000-index.md` + `000-parallel-map.md` list **082–088**: **Pass**
- No contradiction with `AGENTS.md`: **Pass** — Letta owns memory/secrets
- Reviewer +1: **Pass** (this review)

### Evidence inspected

- Files: `docs/v1/otto-web-spec.md`, `planning/hq-tickets/000-index.md`, `docs/v1/SHIP_STATUS.md`
- Commands: `bun run verify:v0` → 5 passed / 0 failed

### Finding

No rev9 execution delta required for doc spec. rev8 +1 stands. +1.

## Review rev10

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes
Delta vs rev9: unchanged — reaffirm

### Checked against Done when

- `docs/v1/otto-web-spec.md` merged: **Pass**
- `000-index.md` + `000-parallel-map.md` list **082–088**: **Pass**
- No contradiction with `AGENTS.md`: **Pass**
- Reviewer +1: **Pass** (this review)

### Evidence inspected

- Files: `docs/v1/otto-web-spec.md`, `planning/hq-tickets/000-index.md`
- Commands: `bun run verify:v0` → 5 passed / 0 failed

### Finding

Doc-only; no rev10 delta. +1.
