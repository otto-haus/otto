# 168 — Coming-soon surfaces float at the top (vertically center them)

Owner: Claude
Priority: P1
Depends on: none
Release bucket: later-generated

## Outcome

Every "coming soon" workspace surface (12 of the 14 sidebar surfaces today)
centers its content in the pane instead of pinning it to the top with a large
empty void beneath. The app reads as intentional and finished rather than
half-rendered.

## Why this matters

Experiential quality — this is what a user sees on **most** of the app right
now. `Charters / Standards / Practices / Routines / Curation / Receipts /
Checks / Autonomy / Skills / Knowledge / Tickets / Channels` all render the
coming-soon shell, and on every one of them the eyebrow + title + blurb + notice
sat in the upper third with ~half the pane empty below. That floating-content
look is the single biggest "this feels unfinished" tell in the current build.

Root cause: `.content` already fills the pane (`flex: 1`) and `.emptySurface`
self-centers, but the coming-soon path wraps the empty state in
`.comingSoonShell { display: grid; max-width: 640px }`, which has **no vertical
centering** — so as a flex child of `.content` it aligns to the top
(`flex-start`). Chat's empty state centers because it uses `margin: auto`;
the coming-soon shell just never got it.

## Scope

- `apps/desktop/src/styles.css`, `.comingSoonShell`: add `margin: auto` (centers
  the shell on both axes within the flex-column `.content`). One declaration.

## Out of scope

- `ComingSoonSurface.tsx` (being actively edited) — not touched; this is
  CSS-only
- `.labsBlockedShell` and other shells — separate, left as-is
- Any copy / content change

## Done when

- Coming-soon content is vertically centered on the workspace surfaces
- Content-rich surfaces (Settings) and Chat are unaffected (verified identical)
- `tsc --noEmit` passes
- Before/after screenshots attached

## Verification

```sh
git status --short --branch
grep -n '\.comingSoonShell {' apps/desktop/src/styles.css   # has margin: auto
cd apps/desktop && tsc --noEmit -p tsconfig.json
```

Visual: `#charters` / `#practices` / `#checks` content centers; `#settings`
unchanged. Headless Chrome vs Vite preview.

## Collision note

Verified safe against the uncommitted working tree: the local `styles.css`
edits are all in the sidebar region (lines ≤ ~1036); `.comingSoonShell` is at
~1497, so this merges without conflict.

## Blocker log

Leave blank unless blocked.
