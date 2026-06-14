# 066 — Skills Capability Library Seed

Owner: Cursor
Priority: P3
Depends on: 056, 041
Release bucket: vNext skills

## Outcome

Expand `skill/**/SKILL.md` beyond charter/routine with **stubs** for core capabilities: GitHub, browser proof, PDFs, 1Password, Discord — guardrails included.

## Why this matters

Skills one-pager Partial: only 2 skills in repo; Practices should call Skills.

## Scope

- Skill stubs with triggers, constraints, approval requirements
- Skills surface lists all with load status
- No live secrets; 1Password skill documents CLI patterns only

## Out of scope

- Full MCP implementations for each
- Auto-install to Letta without user action

## Done when

- ≥5 skills listed in desktop surface
- Each has SKILL.md passing skill-vetter checklist (manual)
- Autonomy policy tags dangerous caps

## Verification

```sh
bun test ./apps/desktop/electron/skill-store.test.ts
```

## Blocker log

Leave blank unless blocked.
