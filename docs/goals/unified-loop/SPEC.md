# Unified loop SPEC

## Purpose

One orchestrator tick per cron run coordinates BUILD (readonly discovery) and SHIP (PR lane) for `otto-haus/otto`.

## North star

```txt
correction -> proposal -> ratification -> standard/practice/routine -> receipt -> better next action
```

## Stages

### BUILD (readonly)

- **north_star** (8): mission / compound-behavior vs AGENTS.md north star
- **product** (8): v1 conduct — local-only, honest empty states, no forbidden claims
- **readonly_audit** (10): staging surfaces (settings, chat, letta_embedded, electron, sidebar); file issues only
- **issue_synthesizer** (4): dedupe; `gh issue create` with one p-label + `status: build candidate`

Dedupe: skip open issues, fuzzy dupes, paths in open PRs, in_flight items.

Output: append candidates to `gates.build.build_queue` and `awaiting_ratification`. Sebastian ratifies → `status: in progress`.

### SHIP (sequential)

1. **intake** (10): only `gates.build.ratified_in_progress`; one issue → one PR; file-disjoint; `Fixes #N`
2. **merge_prep** (12): triage open PRs; babysit CONFLICTING/DIRTY/CI red; dedupe pairs
3. **ship_review** (8): green lane only (MERGEABLE + CLEAN + CI green); write receipts; label `status: ready for review` if SHIP_CANDIDATE

## Spawn contract

- **Mechanism:** Cursor Task tool only
- **Concurrency:** ≤8 concurrent subagents per tick
- **Model:** Auto only; never Composer for workers
- **Never:** bulk nohup cursor agent farms

## Sebastian-only

- Ratify BUILD issues → `status: in progress`
- Merge SHIP PRs
- Close duplicate PRs

## Receipts

Every tick writes `docs/goals/unified-loop/receipts/tick-{NNN}.md` and appends to `state.yaml ticks[]`.
