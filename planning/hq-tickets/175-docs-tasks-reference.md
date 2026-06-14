# 175 — docs/TASKS.md (`task` command reference)

Owner: Claude
Priority: P2
Depends on: none
Release bucket: docs / developer-friendliness

## Outcome

`docs/TASKS.md` documents every `task` (go-task) recipe in `Taskfile.yml`, grouped by purpose
(run / build / quality / smoke / docs / utilities), with the danger-prone ones flagged. A
developer who clones otto can now discover the 25 task shortcuts instead of reading the Taskfile.

## Why this matters

`Taskfile.yml` defines 25 task shortcuts (`task dev`, `task electron`, `task check`, …) but
nothing in the docs mentions the `task` command — so the convenience layer is invisible to
newcomers. A grounded reference lowers day-1 friction for contributors and surfaces the safe
vs. destructive tasks (`smoke:desktop` vs `smoke:desktop:live`, `refresh`/`staging`).

Picked as a statically-groundable win after the workflow's candidate (`QUICKSTART_DESKTOP.md`)
failed verification — it asserted live UI/readiness-state behavior that can't be grounded in a
docs-only loop (that's NUX-agent territory). This doc, by contrast, is a verbatim transcription
of `Taskfile.yml`'s `desc:` fields — no runtime/UI/ship-status claims.

## Scope

- Add `docs/TASKS.md`: tables grouping all 25 tasks with their verbatim descriptions, a usage
  preamble (`task` lists all), and a note flagging the tasks that touch `/Applications`.

## Out of scope

- Any runtime / app code change
- README/CONTRIBUTING edits (churned by open PRs)
- Describing app behavior/UI/readiness states (defer to the NUX agent, which can run + verify)

## Done when

- `docs/TASKS.md` exists; `../Taskfile.yml` and `docs/INSTALL.md` links resolve on main.
- Every task in `Taskfile.yml` is documented; no task is invented (1:1 with the Taskfile).

## Verification

```sh
# 1:1 coverage with the real Taskfile, no invented tasks
doc=$(grep -oE '`task [a-z0-9:_-]+`' docs/TASKS.md | sed 's/`task //;s/`//' | sort -u)
real=$(git show origin/main:Taskfile.yml | grep -E '^  [a-z][a-z0-9:_-]*:' | sed 's/^  //;s/:$//' | sort -u)
comm -3 <(echo "$real") <(echo "$doc")   # empty == exact match
```

Result: 25/25 tasks documented, none invented; descriptions verbatim from `Taskfile.yml`.
