# 145 — Window title: match the lowercase `otto` wordmark

Owner: Claude
Priority: P2
Depends on: none
Release bucket: later-generated

## Outcome

The desktop app's document title (`apps/desktop/index.html`) reads
`otto Desktop`, matching the lowercase wordmark the product uses on every other
user-facing surface. The Vite web-preview tab and the initial `document.title`
no longer show the one-off capitalized `Otto Desktop`.

## Why this matters

Pure brand craft — the little stuff. `otto` is a deliberately lowercase
wordmark, and every user-facing surface already honors it:

- `apps/desktop/electron-builder.yml` → `productName: otto`
- `apps/desktop/electron/main.ts` → BrowserWindow `title: 'otto'`
- the sidebar wordmark → `<div className="brand__name">otto</div>`
- `README.md` → `# otto`, "otto Desktop"

`index.html`'s `<title>Otto Desktop</title>` was the single user-facing place
that capitalized it. The remaining `Otto` spellings live only in internal docs
and code comments, which users never see. This aligns the last visible
outlier with the wordmark.

## Scope

- `apps/desktop/index.html`: `<title>Otto Desktop</title>` →
  `<title>otto Desktop</title>`

## Out of scope

- Re-casing `Otto` in internal docs/comments (SPEC_COMPLIANCE.md, docs/*,
  source comments) — not user-facing; separate cleanup if ever wanted
- Any change to `productName`, the Electron window title (already `otto`), or
  the app icon
- Broad redesign

## Done when

- `index.html` title is `otto Desktop`
- No other behavioral change; `bun run --cwd apps/desktop typecheck` unaffected

## Verification

Commands/checks to run:

```sh
git status --short --branch
grep -n '<title>' apps/desktop/index.html   # expect: otto Desktop
```

## Blocker log

Leave blank unless blocked.
