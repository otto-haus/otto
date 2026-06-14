# 152 — Empty-state headings: balance the wrap (no stranded words)

Owner: Claude
Priority: P2
Depends on: none
Release bucket: later-generated

## Outcome

The centered headings on every workspace empty state wrap into balanced lines
instead of stranding a single word on the last line ("…in the desktop / app.").
Body copy uses `text-wrap: pretty` so it never drops an orphan word either.

## Why this matters

Typography craft — a one-word last line ("app.") on a big centered headline is
exactly the kind of detail that separates "real app" from "unstyled page." It
showed on every \`.emptySurface\` heading:

- Practices: "Practices are available in the desktop / **app.**"
- Curation: "Curation inbox is available in the desktop / **app.**"
- Autonomy: "Autonomy policy is available in the / **desktop app.**"

`text-wrap: balance` (Chromium / Electron supported) evens the line lengths of
short multi-line headings; `text-wrap: pretty` does the lighter orphan-avoidance
pass for the body paragraph. CSS-only, no markup or JS.

## Scope

- `apps/desktop/src/styles.css`:
  - `.emptySurface h2` → add `text-wrap: balance`
  - `.emptySurface p` → add `text-wrap: pretty`

## Out of scope

- Topbar `h1` surface titles (single words; nothing to balance)
- A global `text-wrap` rule for all headings (could follow; scoped here to the
  surfaces with the visible defect)
- Any markup/runtime change
- Paperclip / Cognee / Stacks / broad redesign

## Done when

- Empty-state headings wrap into balanced lines (no stranded final word)
- `tsc --noEmit` (app) passes
- Before/after screenshots attached to the PR

## Verification

```sh
git status --short --branch
grep -n 'text-wrap' apps/desktop/src/styles.css
cd apps/desktop && tsc --noEmit -p tsconfig.json
```

Visual: `#practices` / `#curation` / `#autonomy` headings balanced. Headless
Chrome vs Vite preview.

## Blocker log

Leave blank unless blocked.

## Execution receipt

- Added `text-wrap: balance` to `.emptySurface h2`.
- Added `text-wrap: pretty` to `.emptySurface p`.
- Reviewer proof found the compact mobile sidebar still rendered the New chat
  label after nav labels were hidden; fixed the same media query so the primary
  action renders as an icon button under 900px.
- Proof artifacts: `docs/receipts/staging/pr-28/`.
- Verification:
  - `bun run --cwd apps/desktop typecheck`
  - `bun run typecheck`
  - `bun test` -> 35 pass / 0 fail
  - `bun run verify:v0` -> 5 pass / 0 fail
  - `git diff --check`
  - Playwright screenshots at 1040x720 and 390x844 for Practices, Curation,
    and Autonomy.
