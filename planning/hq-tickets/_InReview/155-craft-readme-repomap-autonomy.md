# 155 — README repo map: add the omitted `autonomy/` canon dir

Owner: Claude
Priority: P2
Depends on: none
Release bucket: later-generated

## Outcome

The README "Repo map" lists all four bundled canon directories. `autonomy/`
now sits alongside `practices/`, `routines/`, and `standards/`, column-aligned
with the rest of the tree.

## Why this matters

Docs accuracy + alignment — the repo map is how a newcomer forms a mental model
of the project. It listed three of the four peer canon dirs and silently dropped
the fourth:

- `standards/`, `practices/`, `routines/` are in the map
- `autonomy/` (which holds `policy.yaml`) was missing

These four are explicit peers: `apps/desktop/electron-builder.yml` bundles all
four together as `extraResources`, and Autonomy is a first-class app surface
(`#autonomy`). A reader scanning the map would never learn the autonomy canon
exists, even though it ships. The new line is column-aligned (description at the
same column as every sibling) so the ASCII tree stays clean.

## Scope

- `README.md`, the repo-map code block: add one line —
  `  autonomy/       policy.yaml: zones, doors, action classification` — after
  `standards/`, matching the existing 18-column description alignment.
- Ticket bookkeeping: keep this ticket's folder state and in-ticket proof aligned
  with the conveyor contract.

## Out of scope

- Intentionally-curated omissions (`planning/`, `demo/`, `examples/`,
  `knowledge/`, `scripts/`) — internal/peripheral, not architecture-level canon
- The ship-branch "Checks / Culture CI" additions (unreleased; not on `main`)
- Any code change

## Done when

- `autonomy/` appears in the repo map, grouped with the canon dirs
- Its description column-aligns with the rest of the tree (col 18)
- No product/code change beyond the README repo-map correction and this ticket
  record

## Verification

```sh
git status --short --branch
git cat-file -e origin/main:autonomy/policy.yaml && echo "autonomy/ canon exists"
# all repo-map descriptions align at the same column:
awk 'NR>=265 && NR<=270 { match($0,/\/[[:space:]]+/); print RSTART+RLENGTH-1 }' README.md | sort -u
```

## Blocker log

Leave blank unless blocked.

## Execution receipt

Status: pass
Date: 2026-06-14

## What changed

- Added `autonomy/` to the README repo map next to the bundled canon peers.
- Moved this completed ticket to `_InReview` so folder state matches "built;
  waiting for independent review."

## Files changed

- `README.md`
- `planning/hq-tickets/_InReview/155-craft-readme-repomap-autonomy.md`

## Verification run

- `bun install --frozen-lockfile` -> pass.
- `git cat-file -e origin/main:autonomy/policy.yaml` -> pass.
- `awk 'NR>=265 && NR<=270 { match($0,/\/[[:space:]]+/); print RSTART+RLENGTH-1 }' README.md | sort -u` -> `18`.
- `git diff --check` -> pass.
- `bun run typecheck` -> pass.
- `bun run --cwd apps/desktop typecheck` -> pass.
- `bun run --cwd apps/desktop electron:typecheck` -> pass.
- `bun test` -> 35 pass, 0 fail.
- `bun run verify:v0` -> 5 passed, 0 failed.

## Evidence

- `origin/main:autonomy/policy.yaml` exists.
- `apps/desktop/electron-builder.yml` bundles `standards`, `practices`,
  `routines`, and `autonomy` as `extraResources`.
- `apps/desktop/src/components/Sidebar.tsx` and `apps/desktop/src/App.tsx`
  include the Autonomy surface.
- Screenshots: N/A; docs/ticket-state change only.

## Known limitations

- No staging app refresh or runtime smoke was run; not needed for this docs-only
  correction, and active staging must not be disrupted.

Reviewer verdict: pending
