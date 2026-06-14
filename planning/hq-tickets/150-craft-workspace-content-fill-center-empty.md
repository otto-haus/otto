# 150 — Workspace surfaces: fill the content height so empty states center

Owner: Claude
Priority: P2
Depends on: none
Release bucket: later-generated

## Outcome

Every non-chat workspace surface (`.content`) fills the available height below
the topbar, matching the chat surface (`.content--chat`). Empty/placeholder
states (Charters, Standards, Practices, Routines, Curation, Receipts, Autonomy)
sit centered in the pane instead of floating against the top with a large void
beneath them, and tall content scrolls inside the pane instead of overflowing
the clipped `.main`.

## Why this matters

Craft + trust — a floating, top-stuck empty state reads as "unfinished web
page," not "a real local app." The `.emptySurface` component was already built
to center (`margin: auto`, `justify-content: center`, `min-height: 320px`), but
its parent `.content` never filled the height to give that centering any room:

- `.app` is `height: 100vh; overflow: hidden`
- `.main` is a flex column with `overflow: hidden`
- `.content--chat` has `flex: 1; min-height: 0` and fills correctly
- `.content` (everything else) had neither, so it collapsed to content height
  and the remaining `.main` space showed as dead bg below the surface

The same gap meant `.content`'s own `overflow-y: auto` was effectively dead:
with no constrained height, tall surfaces overflowed into the `overflow: hidden`
`.main` rather than scrolling.

## Scope

- `apps/desktop/src/styles.css`, the `.content` rule: add `flex: 1; min-height:
  0;` (mirrors the existing `.content--chat` pattern). One declaration pair.

## Out of scope

- `.content--chat` (already correct)
- Any component/markup change; any runtime/architecture change
- The Settings two-column path-truncation at narrow widths (separate, pre-existing)
- Paperclip / Cognee / Stacks / broad redesign

## Done when

- Workspace empty states render vertically centered in the pane
- Content-rich surfaces are visually unchanged (verified: Settings identical)
- Chat is unaffected (uses `.content--chat`)
- `tsc --noEmit` (app + electron) passes
- Before/after screenshots attached to the PR

## Verification

```sh
git status --short --branch
grep -n '^\.content {' apps/desktop/src/styles.css   # has flex: 1; min-height: 0
cd apps/desktop && tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.electron.json
```

Visual: `#charters` / `#receipts` empty states centered; `#settings` unchanged;
`#chat` unchanged. Captured via headless Chrome against the Vite preview.

## Blocker log

Leave blank unless blocked.

## Execution receipt

- Added `flex: 1; min-height: 0;` to `.content`, matching the existing
  `.content--chat` fill pattern.
- Proof artifacts: `docs/receipts/staging/pr-25/`.
- Verification:
  - `bun run --cwd apps/desktop typecheck`
  - `bun run --cwd apps/desktop electron:typecheck`
  - `bun run typecheck`
  - `bun test` -> 35 pass / 0 fail
  - `bun run verify:v0` -> 5 pass / 0 fail
  - `git diff --check`
  - Playwright screenshots for Charters, Receipts, Settings, and Chat at
    1040x720.
- Measured Charters and Receipts content: `flex-grow: 1`, `min-height: 0px`,
  `overflow-y: auto`, content height 613px, empty surface height 320px.
- Settings path-chip wrapping remains a separate main-branch issue covered by
  PR #27.
