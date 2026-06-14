# 119 — Product: Primary Agent Default UX

Owner: Claude
Priority: P1
Depends on: 076, 080
Release bucket: v0.1 product policy

## Outcome

Product **defaults to one primary otto agent per workspace** — no fleet UI, no onboarding agent picker beyond create/select the one.

Implements **093** ADR in desktop UX (not just doc).

## Why this matters

Memory continuity is the product. Multi-agent UI before **120** creates context debt and contradicts “one compounding behavior loop.”

## Scope

- Onboarding (**080**): single agent create/resume path; copy explains one primary agent
- Settings: **Primary agent** section; agent id + “Open in Letta” (**047**); no list of agents by default
- Remove or hide any dev-era multi-agent affordances in Chat shell
- `config.json`: `primaryAgentId` explicit; document in **079** transport doc
- Empty state copy per **093** ADR (no “add another agent” in v1 main path)
- Advanced section placeholder: “Isolated second agent — coming soon” OR link to **120** when unparked (honest empty state OK)

## Non-goals

- Implementing second agent creation (**120**)
- Letta Cloud multi-agent management UI

## Done when

- [ ] Fresh onboarding leaves user with exactly one primary agent
- [ ] Settings shows primary agent; no fleet dashboard
- [ ] ADR **093** cross-linked in ticket receipt
- [ ] Reviewer +1

## Verification

```sh
# staging smoke: onboarding → Settings shows one primaryAgentId
# grep UI for forbidden v1 patterns: "add agent", "agent fleet", "switch agent" in main nav
```

## Blocker log

Leave blank unless blocked.
