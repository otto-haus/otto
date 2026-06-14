# 038 — Settings: refresh readiness.json for v1 surfaces

Owner: Cursor
Priority: P2
Depends on: none
Release bucket: v0.1

## Outcome

Settings readiness panel reflects wired v1 surfaces (practices, curation, receipts, autonomy, skills, knowledge, tickets, channels).

## Why this matters

Stale “Coming soon” copy contradicts file-backed panes — erodes trust in readiness gate.

## Scope

- Regenerate or hand-update `apps/desktop/src/data/readiness.json`
- Align with `DATA_SOURCE` in App.tsx

## Out of scope

- Live Discord / routine executor readiness (honest defer)

## Done when

- Settings shows file-backed or live labels matching each surface’s actual IPC wiring
- `gen-readiness.mjs` documented if used

## Verification

```sh
cd /Users/seb/Code/otto
bun run --cwd apps/desktop typecheck
```

## Blocker log

Leave blank unless blocked.
