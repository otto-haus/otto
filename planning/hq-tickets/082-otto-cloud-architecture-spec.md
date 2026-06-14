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

- [ ] `docs/v1/otto-web-spec.md` merged
- [ ] `000-index.md` + `000-parallel-map.md` list 082–088
- [ ] No contradiction with `AGENTS.md` (Letta owns memory/secrets)
- [ ] Reviewer +1

## Blocker log

Leave blank unless blocked.
