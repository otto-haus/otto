# 160 — examples/ walkthrough README

Owner: Claude
Priority: P2
Depends on: none
Release bucket: docs / discoverability

## Outcome

A newcomer browsing `examples/` lands on a README that explains the one example present —
`example-charter/` — file by file, mapped to otto's "Charters" core concept. They get a
concrete "this is what otto writes on disk" reference without reading source.

## Why this matters

The repo ships a real, self-dogfooded Charter under `examples/example-charter/` (5 files),
but nothing explains what it is or how to read it, and the top-level README never links to
it. Abstract concepts ("operating contracts, gates, receipts") land harder than one worked
artifact. A short, honest walkthrough turns an unexplained folder into a fast-comprehension
on-ramp — the kind of concreteness that earns stars and lowers the bar to understanding.

## Scope

- Add `examples/README.md`: a file-by-file table (charter.md / charter.yaml / state.yaml /
  ledger.md / approvals/) describing each file's role, plus a short "how to read it" path.
- Link back to the top-level README core concepts and CONTRIBUTING.md.

## Out of scope

- Any runtime / app code change
- Editing the example files themselves
- New examples or a runnable demo

## Done when

- `examples/README.md` exists and renders.
- Every relative link resolves to a real file; the `#core-concepts` anchor exists in README.
- Framing is honest: the example is described as a static illustration, not a runnable demo.

## Verification

```sh
# all linked paths exist
for p in README.md CONTRIBUTING.md examples/example-charter/*; do test -e "$p"; done
grep -q '^## Core concepts' README.md   # anchor target
git status --short --branch
```

Result: all 7 linked paths present; `#core-concepts` anchor confirmed; grounded against the
actual contents of the five `example-charter/` files.
