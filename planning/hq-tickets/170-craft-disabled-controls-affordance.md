# 170 — Disabled controls in Settings look fully interactive

Owner: Claude
Priority: P2
Depends on: none
Release bucket: later-generated

## Outcome

Disabled controls in Settings read as gated rather than inviting: the disabled
memory "Search blocks…" input and the gated Labs feature checkboxes are dimmed
with a not-allowed cursor, so a user can tell at a glance what's actually
actionable.

## Why this matters

Affordance craft — controls that are disabled but look enabled invite clicks
that do nothing, which reads as broken. Two cases in Settings:

- The memory **Search blocks…** input is `disabled={!blocks.length}` (no runtime
  / no memory blocks), but rendered as a full, inviting field with no disabled
  styling.
- The Labs feature checkboxes (`disabled={!hydrated || labs.enabled !== true}`)
  were visually identical to the live "Enable Labs" toggle, so the gated ones
  looked actionable.

No disabled treatment existed for `.charterInput` or `.labsRow__toggle input`.

## Scope

- `apps/desktop/src/styles.css` (inserted by the `.labsRow__toggle` block, a
  collision-safe zone):
  - `.charterInput:disabled { opacity: .55; cursor: not-allowed; background: var(--bg-2) }`
  - `.labsRow__toggle input:disabled { opacity: .4; cursor: not-allowed }`
  - `.labsRow__toggle input:not(:disabled) { cursor: pointer }`

## Out of scope

- Any markup change (the `disabled` attributes already exist)
- The `--faint` global contrast question (design-token decision, separate)

## Done when

- Disabled memory search input + gated Labs checkboxes render dimmed/not-allowed
- Enabled controls unaffected (the live "Enable Labs" toggle stays full-strength)
- `tsc --noEmit` passes; before/after attached

## Verification

```sh
git status --short --branch
grep -n ':disabled' apps/desktop/src/styles.css | grep -E 'charterInput|labsRow'
cd apps/desktop && tsc --noEmit -p tsconfig.json
```

Visual: `#settings` Memory observatory "Search blocks…" input reads as disabled.

## Collision note

Inserted at styles.css ~1518 — past all uncommitted working-tree hunks (≤1057).

## Blocker log

Leave blank unless blocked.
