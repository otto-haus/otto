# 067 — One-pagers: Canon Briefs in Repo + Surface Tests

Owner: Claude
Priority: P2
Label: Launch Polish
Depends on: none
Release bucket: v0.1

## Outcome

The compressed one-pager pack is checked into the repo and each behavior surface shows its one-pager "The test:" line.

## Why this matters

Fulfills the June 2026 one-pager alignment pack promise before building more surface area.

## Scope

- `docs/onepagers/*.html` — 11 compressed briefs from pack
- `apps/desktop/src/canon-briefs.ts` — surface → test line map
- `SurfaceProof` footer on behavior surfaces
- Settings note pointing at `docs/onepagers/`

## Out of scope

- In-app HTML viewer / print flow
- Marketing site updates (065)

## Done when

- [x] One-pager HTML files present under `docs/onepagers/`
- [x] Each major surface renders matching `The test:` line
- [x] `bun run --cwd apps/desktop typecheck` passes
- [ ] Staging smoke: spot-check Standards + Settings footers
- [ ] Reviewer +1

## Verification

```sh
cd /Users/seb/Code/otto
bun run --cwd apps/desktop typecheck
ls docs/onepagers/*.html | wc -l   # expect 11
bash apps/desktop/scripts/deploy-staging.sh
```

## Execution receipt (2026-06-14)

- **Files:** `docs/onepagers/*.html`, `apps/desktop/src/canon-briefs.ts`, `apps/desktop/src/surfaces/Panes.tsx`, `apps/desktop/src/styles.css`
- **037 bundled:** `SkippedLoaderPanel` for Standards/Practices/Routines/Skills loader skips (path + reason)
- **Hover craft:** card lift, segmented + providerRow hover settle

## Blocker log

Leave blank unless blocked.
