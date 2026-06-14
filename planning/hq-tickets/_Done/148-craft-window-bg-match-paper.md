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
- `apps/desktop/electron/window-background.test.ts`: regression coverage that
  parses `BrowserWindow.backgroundColor` and CSS `--bg` and requires them to
  match `#f8f7f2`.

## Out of scope

- Introducing a shared TS/CSS color source (can't import CSS vars into the main
  process; a one-line comment is the pragmatic guard)
- Any other window option (sizes, titleBarStyle, webPreferences are correct)
- Dark-mode / theming work
- Paperclip / Cognee / Stacks / broad redesign

## Done when

- Window `backgroundColor` equals CSS `--bg` (`#f8f7f2`)
- Regression test protects that equality
- `bun run --cwd apps/desktop electron:typecheck` passes
- No other behavioral change

## Verification

Commands/checks to run:

```sh
git status --short --branch
grep -n backgroundColor apps/desktop/electron/main.ts   # expect #f8f7f2
grep -nE '^\s*--bg:' apps/desktop/src/styles.css        # confirm token value
cd apps/desktop && tsc --noEmit -p tsconfig.electron.json
bun test apps/desktop/electron/window-background.test.ts
```

## Blocker log

Leave blank unless blocked.

## Execution receipt

- Repo path: `/Users/seb/Code/otto-pr-19`
- Branch: `craft/window-bg-match-paper`
- Files changed:
  - `apps/desktop/electron/main.ts`
  - `apps/desktop/electron/window-background.test.ts`
  - `docs/receipts/staging/pr-19/summary.json`
  - `docs/receipts/staging/pr-19/desktop-home.png`
  - `docs/receipts/staging/pr-19/codex-review-window-background.json`
- Commands/checks:
  - `bun test apps/desktop/electron/window-background.test.ts`
  - `bun run --cwd apps/desktop electron:typecheck`
  - `bun run --cwd apps/desktop typecheck`
  - `bun run typecheck`
  - `bun test`
  - `bun run verify:v0`
  - `git diff --check`
- Evidence:
  - `docs/receipts/staging/pr-19/codex-review-window-background.json` records `browserWindowBackgroundColor: "#f8f7f2"`, `cssBgToken: "#f8f7f2"`, `valuesMatch: true`, and `matchesExpectedWarmPaper: true`.
  - `docs/receipts/staging/pr-19/desktop-home.png`
- Known gaps:
  - Launch-flash proof is represented by static main-process/CSS equality plus screenshot/data, not by a slow-motion launch video.

## Review

Verdict: +1

Evidence:
- `BrowserWindow.backgroundColor` now matches CSS `--bg` exactly: `#f8f7f2`.
- Reviewer regression test fails if either value drifts.
- `bun test` passed: 36 pass / 0 fail / 162 expects.
- `bun run verify:v0` passed: 5 passed / 0 failed.
- No other `BrowserWindow` options were changed.

Unmet Done when items: none.

Exact fixes required: none.

May move to `_Done`: yes.
