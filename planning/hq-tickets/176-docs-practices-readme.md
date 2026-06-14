# 176 — practices/README.md (folder overview)

Owner: Claude
Priority: P2
Depends on: none
Release bucket: docs / discoverability

## Outcome

`practices/` gets a folder README mirroring its `standards/` and `routines/` siblings: a one-line
summary of each of the five Practices (charter, decision, field-note, follow-up, review), what
each Practice folder holds, and how Practices fit otto's culture model. Browsing `practices/` now
explains itself instead of showing an unlabeled list of dirs.

## Why this matters

`standards/` and `routines/` both have folder READMEs; `practices/` was the odd one out. A
consistent, grounded overview lowers comprehension friction for contributors exploring the repo
and completes the symmetry across the three culture-layer folders. Statically groundable (verbatim
from each `practice.yaml` summary), no runtime/UI/ship-status claims.

## Scope

- Add `practices/README.md` mirroring `routines/README.md`'s structure: per-practice one-liners
  (from each `practice.yaml` `summary`), the "each folder holds" list (practice.yaml / README.md /
  templates), and a short culture-model diagram (from `standards/README.md`).

## Out of scope

- Any runtime / app code change
- Editing the practice specs or existing sibling READMEs
- Ship-status / desktop-behavior claims

## Done when

- `practices/README.md` exists; all links resolve on origin/main; all 5 practices listed match
  the real subdirs; summaries verbatim from `practice.yaml`.

## Verification

```sh
for p in docs/practices.md docs/practice-mining.md packages/core/src/types.ts standards routines practices/{charter,decision,field-note,follow-up,review}; do test -e "$p"; done
git ls-tree --name-only origin/main practices/ | grep -v README   # 5 dirs, all documented
```

Result: all links present; 5/5 practices documented; per-practice summaries verbatim from each
`practice.yaml`; spec type `PracticeSpec` confirmed in packages/core/src/types.ts.
