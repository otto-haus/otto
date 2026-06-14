# 162 — README repo map omits two bundled canon dirs (autonomy/, knowledge/)

Owner: Claude
Priority: P2
Depends on: none
Release bucket: later-generated

## Outcome

The README "Repo map" lists every canon directory the desktop app bundles as a
runtime resource. `autonomy/` and `knowledge/` now sit with `practices/`,
`routines/`, `standards/`, and `skill/`, column-aligned with the rest of the
tree.

## Why this matters

Docs accuracy — the repo map is the newcomer's mental model of the project, and
it had drifted behind ship's surfaces. `apps/desktop/electron-builder.yml`
bundles **six** canon dirs into the packaged app:

```yaml
extraResources: standards, practices, routines, autonomy, knowledge, skill
```

The repo map listed only four of them — `standards/`, `practices/`, `routines/`,
`skill/` — and dropped `autonomy/` and `knowledge/`, even though the README body
now features both surfaces ("Autonomy | ship"; Knowledge under Labs). A reader
scanning the map would never learn the autonomy or knowledge canon exists,
though both ship inside the app.

(The same `autonomy/` omission was fixed on `main` in #40; ship's README is a
separate, diverged file and additionally drops the newer `knowledge/` dir.)

## Scope

- `README.md`, repo-map code block: add two column-aligned lines after
  `standards/` —
  `  autonomy/       policy.yaml: zones, doors, action classification`
  `  knowledge/      AI Frontier model registry + corpus (Labs)`

## Out of scope

- Curated omissions (`planning/`, `demo/`, `examples/`, `config/`, `infra/`,
  `site/`, `channels/`, `checks/`) — not bundled as canon resources; left as-is
- Any code change

## Done when

- `autonomy/` and `knowledge/` appear in the repo map, grouped with canon dirs
- Every repo-map description column-aligns (col 18)
- No other change

## Verification

```sh
git status --short --branch
git show origin/ship/functional-labs:apps/desktop/electron-builder.yml | grep -A12 extraResources
awk 'NR>=290 && NR<=300 { match($0,/\/[[:space:]]+/); if (RSTART>0) print RSTART+RLENGTH-1 }' README.md | sort -u   # expect single value 18
```

## Blocker log

Leave blank unless blocked.
