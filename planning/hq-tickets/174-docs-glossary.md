# 174 — docs/GLOSSARY.md (core terminology reference)

Owner: Claude
Priority: P2
Depends on: none
Release bucket: docs / discoverability

## Outcome

A `docs/GLOSSARY.md` gives newcomers a one-screen reference for otto's core vocabulary
(Standards, Practices, Routines, Charters, Approvals, Receipts, Curation, otto Desktop) plus
the four primitives and the Letta substrate — each linked to the doc that goes deeper. Lowers
the comprehension barrier without bouncing between five docs.

## Why this matters

otto's dense domain language is a real friction point for first-time readers. A compact,
authoritative glossary is a standard OSS convenience that makes the project self-serve and
more approachable (a quiet star-earner). Definitions are copied verbatim from the README
Core concepts table, so the glossary stays consistent with the canonical source.

Selected by the discover→select→draft→verify workflow. The workflow's own draft **failed
verification** (broken links + ship-status overclaims) because its agents grounded against the
dirty local working tree (files like `docs/v1/labs.md`, `docs/runtime-transport.md`,
`ship-tier-matrix.md` exist locally but not on main). This ticket's content was re-authored
**grounded strictly against origin/main**: every linked doc is confirmed to exist on main, and
no Labs/ship-tier claims are made beyond what the README states (Curation: not built in v0.1).

## Scope

- Add `docs/GLOSSARY.md`: core-concepts table (verbatim README definitions + links), the four
  primitives, a short substrate section (Letta, Gate, Autonomy), and a "go deeper" footer.

## Out of scope

- Any runtime / app code change
- README/CONTRIBUTING edits (churned by open PRs)
- Enumerating individual Standards (volatile — kept at the concept level on purpose)
- Labs/Channels/ship-tier claims (not groundable on main right now)

## Done when

- `docs/GLOSSARY.md` exists; every relative link resolves on main; README `#core-concepts`
  and `#primitives` anchors exist.
- No claim exceeds what the README states; Curation marked "Not built in v0.1".

## Verification

```sh
for p in README.md CONTRIBUTING.md examples/example-charter docs/{standards,practices,routines,architecture,gates,desktop,autonomy,INSTALL}.md; do test -e "$p"; done
grep -qE '^## (Core concepts|Primitives)' README.md
```

Result: all 11 links present; both anchors confirmed; definitions verbatim from README;
only docs that exist on origin/main are linked.
