# 061 — Practice Mining Observe Loop

Owner: Codex
Priority: P2
Depends on: 053, 016, 052
Release bucket: vNext practices

## Outcome

Otto can **observe repeated behavior** and draft Practice proposals — human still ratifies.

Implements `docs/practice-mining.md` loop steps 1–2 automatically; steps 3–4 remain Curation.

## Scope

- Heuristics: repeated receipt patterns, recurring manual commands, duplicate artifacts
- Output: `practice-proposal` yaml draft + Curation proposal
- Routine `practice-mining` trial invokes observer
- No auto-activation

## Out of scope

- ML clustering
- Auto-editing active practices

## Done when

- Fixture repeated behavior generates proposal in inbox
- No proposal on single occurrence
- Receipt logs observation inputs (paths only, no secrets)

## Verification

```sh
bun test
bun run verify:v0
```

## Blocker log

Leave blank unless blocked.
