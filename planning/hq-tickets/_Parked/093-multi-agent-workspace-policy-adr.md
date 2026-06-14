# 093 — Multi-Agent Workspace Policy (ADR)

Owner: Codex
Priority: P3
Depends on: 076, 092
Release bucket: cathedral / product policy

**Unpark when:** **092** reviewed; before any multi-agent UI work.

## Outcome

ADR: **one primary otto agent per workspace by default**; multiple agents allowed only as an advanced isolation escape hatch.

Deliverable: `docs/v1/adr/093-multi-agent-workspace-policy.md` (draft in repo; finalize on +1)

## Why this matters

Memory continuity is the product. Premature multi-agent UI creates context debt, duplicated preferences, and “which agent knows this?” friction. Architecture should support N agents; product should not center a fleet.

## Scope

- Default: single primary agent (embedded **076** path)
- Allow second+ agent only when boundary is real:
  - different human owner
  - different authority / autonomy class
  - different secrets/tools
  - different schedule/channel
  - different long-running mission
  - strong isolation (e.g. finance vs code)
- UI: “Create another agent” behind Advanced — not onboarding default
- Letta Cloud: multiple agents technically possible; otto workspace maps 1:1 primary unless advanced flow
- Align with `docs/v1/otto-v1-surface-contracts.md` (“no multi-agent team UI” for v1)

## Non-goals

- Building multi-agent dashboard
- Per-agent billing

## Done when

- [ ] ADR merged
- [ ] **092** spec references **093**
- [ ] No v1 ticket promises fleet UI without explicit unpark
- [ ] Reviewer +1

## Blocker log

Leave blank unless blocked.
