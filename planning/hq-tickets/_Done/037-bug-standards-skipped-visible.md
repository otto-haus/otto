# 037 — Standards/Practices/Routines: show skipped loader reasons

Owner: Claude
Priority: P2
Depends on: none
Release bucket: v0.1

## Outcome

When YAML specs fail validation, the surface shows file path + reason (not silent skip count only).

## Why this matters

Operators cannot diagnose missing canon; ship checks require honest loader feedback.

## Scope

- Standards, Practices, Routines panes: render `result.skipped[]` like Receipts surface pattern
- Optional: standard-store try/catch when registry.yaml missing (return skipped, don't throw)

## Out of scope

- Fixing malformed repo YAML files themselves

## Done when

- Introduce invalid practice/routine fixture in test tmp dir → UI lists skip reason
- Standards header shows skipped chip with expandable list

## Verification

```sh
cd /Users/seb/Code/otto
bun run verify:v0
```

## Execution receipt (2026-06-14)

- **Branch:** `ship/v0.3-integration` (PR #6)
- **Fix:** `SkippedLoaderPanel` on Behavior panes (Standards, Practices, Routines, Skills) lists skipped files with reasons even when primary list is empty
- **Verify:** `bun run verify:v0` 5/5; staging Standards/Skills with intentional skip fixture
- **Reviewer:** pending +1

## Blocker log

Leave blank unless blocked.
