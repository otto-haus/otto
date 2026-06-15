# 178 — autonomy/README.md (folder overview)

Owner: Claude
Priority: P2
Depends on: none
Release bucket: docs / discoverability

## Outcome

`autonomy/` gets a folder README summarizing `policy.yaml`: the doctrine, the three zones
(green/yellow/red), and the eight one-way doors — linked to `docs/autonomy.md` and `docs/gates.md`.
Completes the folder-README set across the repo's culture/governance folders (standards/, routines/,
practices/, templates/, autonomy/).

## Why this matters

`autonomy/` held only `policy.yaml` with no overview. The autonomy model (reversible = autonomous,
one-way doors escalate) is core to how otto works, so a grounded summary lowers comprehension
friction and completes the README symmetry. Statically groundable (verbatim from policy.yaml); no
runtime/UI/ship-status claims.

## Scope

- Add `autonomy/README.md`: doctrine quote, zones table, one-way-doors list — all from policy.yaml,
  linking docs/autonomy.md (concept) and docs/gates.md (enforcement).

## Out of scope

- Any runtime / app code change; editing policy.yaml
- Ship-status / desktop-behavior claims

## Done when

- `autonomy/README.md` exists; links resolve on origin/main; all 8 doors + 3 zones match policy.yaml
  (none invented).

## Verification

```sh
for p in autonomy/policy.yaml docs/autonomy.md docs/gates.md; do test -e "$p"; done
# door ids in README match policy.yaml exactly
```

Result: all links present; 8/8 doors + 3/3 zones match policy.yaml; doctrine quoted verbatim.
