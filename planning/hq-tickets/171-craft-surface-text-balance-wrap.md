# 171 — Surface headlines & ledes wrap with orphans (no text-wrap)

Owner: Claude
Priority: P2
Depends on: none
Release bucket: later-generated

## Outcome

Surface headlines and intro ledes wrap into balanced lines with no stranded
single word on the last line — on every coming-soon surface (`.emptySurface`)
and every live surface header (`.surfaceHero`).

## Why this matters

Typography craft, broad reach. The coming-soon surfaces are what a user sees on
~13 of the 14 workspace items, and their lede wrapped with a textbook orphan,
e.g. on Charters:

```
Operating contracts — bets, acceptance criteria, linked runs and
receipts.
```

The single-word last line ("receipts.") reads as unpolished. `text-wrap: pretty`
rebalances it to "…linked runs / and receipts." (no orphan); `text-wrap: balance`
evens multi-line headlines when they wrap (narrow widths, longer titles). None of
these rules had any `text-wrap`.

## Scope

- `apps/desktop/src/styles.css`:
  - `.emptySurface h2` → `text-wrap: balance`
  - `.emptySurface p` → `text-wrap: pretty`
  - `.surfaceHero__title` → `text-wrap: balance`
  - `.surfaceHero__lede` → `text-wrap: pretty`

## Out of scope

- The coming-soon `.notice` mono typography (a brand decision, separate)
- Any layout/size change (these are wrap-position hints only)

## Done when

- Coming-soon ledes no longer strand a single word on the last line
- Headlines balance when they wrap; single-line cases unchanged
- Content-rich surface (Settings) unaffected; `tsc --noEmit` passes
- Before/after attached

## Verification

```sh
git status --short --branch
grep -n 'text-wrap' apps/desktop/src/styles.css
cd apps/desktop && tsc --noEmit -p tsconfig.json
```

Visual: `#charters` lede wraps "…linked runs / and receipts." (was "…and / receipts.").

## Collision note

All four rules at styles.css ~1284–1308 — past every uncommitted working-tree
hunk (≤1057).

## Blocker log

Leave blank unless blocked.
