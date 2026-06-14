# 163 — Provider-type segmented control: tablist without tab children

Owner: Claude
Priority: P2
Depends on: none
Release bucket: later-generated

## Outcome

The Settings → Model providers "Provider type" segmented control is a valid ARIA
tablist: its Local / Cloud buttons carry `role="tab"` and `aria-selected`, so
assistive tech announces them as tabs and conveys which is active — matching the
Settings tabs in the same file.

## Why this matters

a11y — a `role="tablist"` is only valid if its children are `role="tab"`. The
segmented control declared the container role but its buttons were plain
buttons:

```jsx
<div className="segmented" role="tablist" aria-label="Provider type">
  <button …>Local</button>   // no role="tab", no aria-selected
  <button …>Cloud</button>
</div>
```

So a screen reader announces "Provider type, tab list" but then finds buttons,
not tabs, and never hears which one is selected (the active state was
class-only: `is-active`). The same component file already does this correctly at
the Settings tabs (`role="tab"` + `aria-selected`); this brings the segmented
control in line.

## Scope

- `apps/desktop/src/surfaces/Panes.tsx`, `ModelProviders` segmented control: add
  `role="tab"` and `aria-selected={tab === 'local' | 'cloud'}` to the two
  buttons (mirrors the existing `settingsTabs` pattern; `aria-selected` tracks
  the same state the `is-active` class already uses).

## Out of scope

- `aria-controls` / `role="tabpanel"` wiring — the in-file tab pattern doesn't
  use it either; kept consistent and minimal
- Any visual/CSS change (none — `is-active` styling untouched)

## Done when

- Both segmented buttons have `role="tab"` + `aria-selected`
- `tsc --noEmit` (app) passes
- No visual change (Settings renders identically; verified)

## Verification

```sh
git status --short --branch
grep -n 'role="tab"' apps/desktop/src/surfaces/Panes.tsx   # now 2 literals (settingsTabs + segmented)
cd apps/desktop && tsc --noEmit -p tsconfig.json
```

Note: the control lives in the Model-providers tab, reached by a click not
expressible in a headless screenshot, and the fix is invisible (ARIA only) — so
visual before/after doesn't apply. Proof: diff + typecheck + a no-regression
screenshot of `#settings`.

## Blocker log

Leave blank unless blocked.
