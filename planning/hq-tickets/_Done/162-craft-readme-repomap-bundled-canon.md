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

- Curated/non-canon omissions (`planning/`, `demo/`, `examples/`, `config/`,
  `infra/`, `site/`, `channels/`, `checks/`) — `channels/` and `checks/` are
  bundled runtime resources, but they are outside this canon-directory map
  repair; left as-is
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

## Execution receipt

- repo path: `/Users/seb/Code/otto-pr-154`
- branch: `craft/ship-3`
- files changed:
  - `README.md`
  - `planning/hq-tickets/_Done/162-craft-readme-repomap-bundled-canon.md`
  - `docs/receipts/staging/pr-154/codex-review-readme-repomap.json`
  - `docs/receipts/staging/pr-154/summary.json`
- proof:
  - Verified `standards/`, `practices/`, `routines/`, `autonomy/`, `knowledge/`, and `skill/` all exist in the repo.
  - Verified `apps/desktop/electron-builder.yml` bundles those six dirs in `extraResources`.
  - Verified README repo-map description alignment returns a single column: `18`.
  - `git diff --check` passed.
  - `bun run typecheck`, `bun run --cwd apps/desktop typecheck`, and `bun run --cwd apps/desktop electron:typecheck` passed.
  - `bun test` passed: 221 pass, 1 skip, 0 fail, 738 expects.
  - `bun run verify:v0` passed: 5/5.
- review repair:
  - Clarified out-of-scope wording so it no longer implies `channels/` and `checks/` are unbundled; they are bundled runtime resources but outside this canon-directory README map repair.

## Review

Verdict: +1

Reviewer: Codex PR review agent

Notes:
- The README additions for `autonomy/` and `knowledge/` are accurate and aligned.
- The original ticket/out-of-scope wording had a false implication about `channels/` and `checks/`; fixed in this review pass.
- Proof is recorded in `docs/receipts/staging/pr-154/codex-review-readme-repomap.json`.
