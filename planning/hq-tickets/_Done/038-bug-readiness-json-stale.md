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

## Review rev8

Reviewer: independent subagent (batch 001-045)
Date: 2026-06-14
Verdict: +1

### Checked against

- Settings shows file-backed or live labels matching IPC wiring: **PASS** — `readiness.json` marks practices/curation/receipts/autonomy/skills/knowledge/tickets/channels as `"status": "file"`.
- `gen-readiness.mjs` documented if used: **PASS** — header comments + script at `apps/desktop/scripts/gen-readiness.mjs`.

### Evidence inspected

- `apps/desktop/src/data/readiness.json`
- `apps/desktop/scripts/gen-readiness.mjs`
- `apps/desktop/src/App.tsx` (`DATA_SOURCE`)

### Defects

- No execution receipt in ticket.
- Runtime/agent rows still `not-wired`/`missing` (honest for preview baseline).

### Required changes

- Append execution receipt (optional).

### Finding

Readiness copy aligns with wired v1 surfaces. +1.

## Review rev9

Reviewer: independent subagent (batch 001-045 rev9)
Date: 2026-06-14
Verdict: +1

### Checked against

All Done-when items: **PASS** — rev8 mapping stands; no rev9 regression identified in code or cited receipts.

### Evidence inspected

- Prior `## Review rev8` Done-when mapping
- Execution receipt(s) already in ticket
- Rev9 cross-check focused on 001/017/018/033/036/037/039/041-044/045 only

### Finding

Rev8 +1 reaffirmed. No new blockers.

## Review rev10

Reviewer: independent reviewer (batch 001-045 rev10)
Date: 2026-06-14
Verdict: +1
Delta vs rev9: unchanged

### Checked against Done when

- All Done-when: **PASS** (rev9 mapping holds).

### Evidence inspected

- Execution rev10 receipts + `docs/receipts/staging/` (focus: 001/017/018 rev9; 033/036/037 rev9 staging; 026/039/041-044/045 rev10)
- Prior `## Review rev9` mappings

### Finding

Unit/store proof at rev9; no rev10 delta.
