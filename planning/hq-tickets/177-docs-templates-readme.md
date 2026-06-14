# 177 — templates/README.md (folder overview)

Owner: Claude
Priority: P2
Depends on: none
Release bucket: docs / discoverability

## Outcome

`templates/` gets a folder README indexing its 15 scaffolds, grouped by what they seed (Charter,
Practices & Routines, Standards, Approvals & autonomy, Work execution), each with a one-line
purpose and a link to the relevant concept doc. Completes the folder-README set across the repo's
artifact/concept folders (standards/ ✓, routines/ ✓, practices/ ✓, templates/).

## Why this matters

`templates/` held 15 unlabeled scaffolds with no index — a contributor had to open each to learn
what it seeds. A grounded overview makes the folder self-documenting and consistent with its
siblings. Statically groundable (descriptions taken from each template's own first line/heading);
no runtime/UI/ship-status claims.

## Scope

- Add `templates/README.md`: grouped tables listing all 15 templates with one-line purposes and
  links to the concept docs that exist on main.

## Out of scope

- Any runtime / app code change; editing the templates themselves
- Ship-status / desktop-behavior claims

## Done when

- `templates/README.md` exists; all 15 templates referenced (1:1, none invented); all doc links
  resolve on origin/main.

## Verification

```sh
for f in $(git ls-tree --name-only origin/main templates/ | sed 's#templates/##'); do grep -q "\`$f\`" templates/README.md; done
for p in docs/{architecture,practices,routines,standards,gates,autonomy,ticketcraft}.md standards; do test -e "$p"; done
```

Result: 15/15 templates referenced; 7 doc links + standards/ all resolve; descriptions grounded
in each template's own first line.
