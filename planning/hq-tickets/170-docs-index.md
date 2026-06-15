# 170 — docs/ index (folder landing page)

Owner: Claude
Priority: P2
Depends on: none
Release bucket: docs / discoverability

## Outcome

Opening the `docs/` folder on GitHub now renders a categorized index instead of a flat,
unordered list of 23 markdown files. A newcomer can see at a glance where install,
architecture, core concepts, desktop, roadmap, and testing docs live, and jump straight in.

## Why this matters

`docs/` held 23 top-level files with no index, so browsing it meant guessing from
filenames. The top-level README has a repo map but points at `docs/` as a single line.
A folder-level `README.md` is the page GitHub shows when you click into the directory —
it turns a pile into a navigable map, which lowers friction for both visitors and
contributors and makes the project read as well-organized (a quiet star-earner).

## Scope

- Add `docs/README.md`: grouped tables (Start here / Core concepts / Desktop app /
  Status & roadmap / Testing & ops) linking every top-level doc with a one-line gloss.
- Link back to the main README's repo map and core-concepts anchors.
- Note honestly that some docs still carry the legacy "Charter" name in their titles.

## Out of scope

- Any runtime / app code change
- Editing the linked docs themselves or renaming them
- README changes (its repo map already exists)

## Done when

- `docs/README.md` exists and renders.
- All 23 linked docs resolve; `#repo-map` and `#core-concepts` anchors exist in README;
  named subfolders (`architecture/`, `v1/`, `v3/`, `goals/`, `receipts/`) all exist.
- Framing is accurate (legacy-name caveat included; no overclaiming).

## Verification

```sh
# every linked doc + subfolder exists; README anchors present
for f in docs/*.md; do test -e "$f"; done
grep -qE '^## (Repo map|Core concepts)' README.md
git status --short --branch
```

Result: all 23 doc links verified with `test -f`; both README anchors confirmed; the five
named subfolders and `architecture/v0-contract.md` confirmed present.
