# 050 — Standards: Precedent Conflict Path

Owner: Codex (contract) + Claude (UI)
Priority: P1
Depends on: 009
Release bucket: v0.1 culture

## Outcome

When two Standards appear to conflict, Otto surfaces **precedent case law** instead of improvising — the Standards one-pager test.

## Why this matters

`standards/precedents/` exists but runtime/UI does not cite it. Culture needs case law, not chat improvisation.

## Scope

- Codex: conflict detection contract (which standard ids, what triggers surfacing)
- Precedent lookup by tags/collision keys
- Standards surface UI: "Conflict" banner + precedent excerpt + link to full markdown
- Chat can receive precedent pack via structured citation (optional hook)
- Receipt when precedent cited in a review/decision

## Out of scope

- LLM auto-judge which standard wins
- Editing precedents from UI (file canon only)

## Done when

- Fixture conflict (e.g. Candor vs Kindness scenario) shows precedent `2026-06-13-candor-vs-kindness.md`
- No precedent → honest "no case law yet" + propose Curation path
- Unit tests for lookup function
- Staging screenshot

## Verification

```sh
bun test ./apps/desktop/electron/standard-store.test.ts
bun run --cwd apps/desktop typecheck
```

## Blocker log

Leave blank unless blocked.
