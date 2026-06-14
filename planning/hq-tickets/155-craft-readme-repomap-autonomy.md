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

## Out of scope

- Intentionally-curated omissions (`planning/`, `demo/`, `examples/`,
  `knowledge/`, `scripts/`) — internal/peripheral, not architecture-level canon
- The ship-branch "Checks / Culture CI" additions (unreleased; not on `main`)
- Any code change

## Done when

- `autonomy/` appears in the repo map, grouped with the canon dirs
- Its description column-aligns with the rest of the tree (col 18)
- No other change

## Verification

```sh
git status --short --branch
git cat-file -e origin/main:autonomy/policy.yaml && echo "autonomy/ canon exists"
# all repo-map descriptions align at the same column:
awk 'NR>=265 && NR<=270 { match($0,/\/[[:space:]]+/); print RSTART+RLENGTH-1 }' README.md | sort -u
```

## Blocker log

Leave blank unless blocked.
