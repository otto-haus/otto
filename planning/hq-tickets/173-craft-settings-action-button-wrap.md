# 173 — Settings action button wraps mid-phrase at narrow width

Owner: Claude
Priority: P2
Depends on: none
Release bucket: later-generated

## Outcome

Action buttons in Settings field rows (e.g. "Reset onboarding") stay on one line
at narrow width; the hint text wraps instead. No more "Reset / onboarding"
two-line button.

## Why this matters

Responsive craft — a button whose label breaks mid-phrase reads as broken. The
`.settingsFieldRow` is `display: flex; justify-content: space-between` with the
title/hint in a shrinkable `__main` (`min-width: 0`), but the action button has
no shrink guard. So as the window narrows, the long hint ("Clears the first-run
flag so Welcome and the getting-started dock return on next launch.") squeezes
the button until its label wraps to two lines.

## Scope

- `apps/desktop/src/styles.css`: `.settingsFieldRow .btn { flex: none;
  white-space: nowrap; }` — the button keeps its intrinsic width and never wraps;
  the hint text (already `min-width: 0`) wraps to more lines instead.

## Out of scope

- Stacking the row vertically at narrow width (a larger layout change; the
  button stays inline, which reads cleaner here)
- Any non-Settings `.btn`

## Done when

- "Reset onboarding" (and any settingsFieldRow action) stays one line at ≤720px
- Wide layout unchanged
- `tsc --noEmit` passes; before/after attached

## Verification

```sh
git status --short --branch
grep -n 'settingsFieldRow .btn' apps/desktop/src/styles.css
cd apps/desktop && tsc --noEmit -p tsconfig.json
```

Visual: `#settings` at 720px — "Reset onboarding" is one line (was two).

## Collision note

Inserted at styles.css ~1822 — past every uncommitted working-tree hunk (≤1057).

## Blocker log

Leave blank unless blocked.
