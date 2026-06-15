# 172 — "Show readiness detail" disclosure looks inert (no expand affordance)

Owner: Claude
Priority: P2
Depends on: none
Release bucket: later-generated

## Outcome

The Settings → Readiness "Show readiness detail" `<details>` disclosure carries a
`+` / `−` expand affordance (right-aligned), matching the existing `.surfaceMeta`
disclosures — so it reads as expandable instead of inert bold text.

## Why this matters

Affordance + consistency craft. The readiness disclosure had
`summary::-webkit-details-marker { display: none }` (the default triangle hidden)
but **no replacement marker** — so "Show readiness detail" rendered as plain bold
text with nothing to signal it expands. Worse, it's inconsistent: the sibling
`.surfaceMeta` disclosures already show a `+`/`−`. So one expander looks clickable
and the other doesn't. This sits in the NOT-CONNECTED state where users most want
to expand "what's missing."

## Scope

- `apps/desktop/src/styles.css`: add `.settingsReadinessDetails > summary::after`
  with `content: '+'` (and `'−'` when `[open]`), `float: right`, mirroring the
  `.surfaceMeta > summary::after` pattern already in the file.

## Out of scope

- Other disclosures (`.surfaceMeta` already has the affordance; `.skippedPanel`
  is separate)
- Any markup change

## Done when

- "Show readiness detail" shows `+` collapsed, `−` when open
- Matches the `.surfaceMeta` disclosure convention
- `tsc --noEmit` passes; before/after attached

## Verification

```sh
git status --short --branch
grep -n 'settingsReadinessDetails > summary::after' apps/desktop/src/styles.css
cd apps/desktop && tsc --noEmit -p tsconfig.json
```

Visual: `#settings` → Readiness → "Show readiness detail" has a right-aligned `+`.

## Collision note

Inserted at styles.css ~1842 — past every uncommitted working-tree hunk (≤1057).

## Blocker log

Leave blank unless blocked.
