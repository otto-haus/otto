# 063 — Release Lane v0.1 (Sebastian Gate)

Owner: Cursor + Claude
Priority: P1
Depends on: 033–038, 045, 048, 054, 055, 056, 051
Release bucket: v0.1 release

## Outcome

Otto v0.1 is **ready for Sebastian approval**: demos refreshed, README hero honest, release checklist current, PR stack mergeable — **no push/tag until explicit approval**.

## Why this matters

55 commits ahead; live app stale; RELEASE_CHECKLIST outdated vs repo. Release is a deliberate door.

## Scope

- Refresh `RELEASE_CHECKLIST.md`, `docs/v1/SHIP_STATUS.md`, `SPEC_COMPLIANCE.md` vs reality
- README public story (lowercase otto, owl mark, behavior layer framing)
- Verify all ship checks referenced
- Prepare tag message + GitHub metadata (do not push)
- Staging promotion checklist separate from live app

## Out of scope

- Publishing without Sebastian sign-off
- npm publish
- Changing license/visibility

## Done when

- Release table matches tested reality (no Curation "cut" if engine exists — update honestly)
- Sebastian checklist items filled with evidence links
- `bun run verify:v0` green
- Explicit "NOT PUSHED" banner in receipt until approval

## Verification

```sh
cd /Users/seb/Code/otto
bun run verify:v0
bun run typecheck
bun test
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
```

## Blocker log

Leave blank unless blocked.
