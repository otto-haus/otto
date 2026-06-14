# 148 — Electron window backgroundColor: match the CSS paper field (no launch flash)

Owner: Claude
Priority: P2
Depends on: none
Release bucket: later-generated

## Outcome

The Electron `BrowserWindow` paints the exact same warm-paper color the
renderer paints (`--bg: #f8f7f2`), so there is no flash or edge seam in the
moment before the renderer mounts, or at the window edges during a resize.

## Why this matters

Pure craft — the kind of seam you feel before you can name it. A window
`backgroundColor` exists *specifically* to cover the pre-paint frame, but it was
set to `#fbfaf7` while the page actually paints `--bg: #f8f7f2` (`html` + `body`
background). The two warm-whites differ by ~3/channel, so launch showed a faint
lighter flash that snapped to the slightly darker paper once React mounted, and
fast resizes could reveal a hairline lighter band at the edges. Matching the
window color to the token removes it.

## Scope

- `apps/desktop/electron/main.ts`: `backgroundColor: '#fbfaf7'` →
  `'#f8f7f2'` (the value of CSS `--bg`), plus a comment tying it to the token
  so it cannot silently drift again.

## Out of scope

- Introducing a shared TS/CSS color source (can't import CSS vars into the main
  process; a one-line comment is the pragmatic guard)
- Any other window option (sizes, titleBarStyle, webPreferences are correct)
- Dark-mode / theming work
- Paperclip / Cognee / Stacks / broad redesign

## Done when

- Window `backgroundColor` equals CSS `--bg` (`#f8f7f2`)
- `bun run --cwd apps/desktop electron:typecheck` passes
- No other behavioral change

## Verification

Commands/checks to run:

```sh
git status --short --branch
grep -n backgroundColor apps/desktop/electron/main.ts   # expect #f8f7f2
grep -nE '^\s*--bg:' apps/desktop/src/styles.css        # confirm token value
cd apps/desktop && tsc --noEmit -p tsconfig.electron.json
```

## Blocker log

Leave blank unless blocked.
