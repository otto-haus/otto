# 151 — File-path chips: stop breaking paths mid-character

Owner: Claude
Priority: P2
Depends on: none
Release bucket: later-generated

## Outcome

`.filechip` path pills (e.g. `~/.otto/config.json`, `~/.otto/charters/`) render
as a single unbroken line and truncate with an ellipsis when the column is too
narrow, instead of shattering mid-character across two lines
(`~/.otto/c` / `onfig.jso…`).

## Why this matters

Craft — a path broken mid-character reads as a layout bug, and it's the first
thing the eye snags on. The chip had:

```css
white-space: normal;
overflow-wrap: anywhere;
```

`overflow-wrap: anywhere` sets the chip's min-content width to ~one character,
so the surrounding grid/flex column is free to collapse the chip and the path
wraps at arbitrary characters. Visible today in **Settings → General →
RUNTIME & IDENTITY** (the runtime path under a `<select>`-narrowed column), and
latent anywhere a filechip lands in a tight column.

Switching to `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`
makes the path an atomic unit: it shows in full when there's room (verified on
the Charters empty state) and truncates cleanly with `…` when there isn't
(verified in Settings).

## Scope

- `apps/desktop/src/styles.css`, the `.filechip` rule: replace
  `white-space: normal; overflow-wrap: anywhere;` with
  `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`.

## Out of scope

- Middle-truncation (keep filename visible) — would need JS/markup; tail
  ellipsis is the clean CSS-only win
- Widening the Settings identity column / its layout
- Any markup or runtime change
- Paperclip / Cognee / Stacks / broad redesign

## Done when

- Filechip paths never break mid-character
- Full path shows when the chip has room; ellipsis when constrained
- `tsc --noEmit` (app) passes
- Before/after screenshots attached to the PR

## Verification

```sh
git status --short --branch
grep -n 'text-overflow: ellipsis' apps/desktop/src/styles.css
cd apps/desktop && tsc --noEmit -p tsconfig.json
```

Visual: `#settings` General → RUNTIME & IDENTITY path renders one line;
`#charters` empty-state path shows in full. Headless Chrome vs Vite preview.

## Blocker log

Leave blank unless blocked.
