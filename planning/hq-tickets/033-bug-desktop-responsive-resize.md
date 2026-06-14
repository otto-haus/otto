# 033 — Desktop: responsive resize layout

Owner: Claude
Priority: P0
Depends on: none
Release bucket: v0.1

## Outcome

Resizing the otto desktop window does not produce clipped sidebar, horizontal scroll, or broken main/content flex chain at common widths.

## Why this matters

User-reported: “strange things happen when I change the size.” Shell credibility blocks every surface demo.

## Scope

- Unify sidebar compact grid (`app--sidebar-compact`) with JS `matchMedia` + `sidebar.is-collapsed`
- Main/content flex chain for workspace panes (not only chat)
- Tooltip overflow clamp at narrow widths
- Viewport smoke at 1280 / 1100 / 900 / 640 widths

## Out of scope

- Per-pane split layout redesign beyond existing 1100px stack breakpoint
- Mobile-native layout

## Done when

- Resize at 1280→640 on Chat, Standards, Settings: no horizontal scroll, no overlapping topbar
- Staging deploy includes fix
- Evidence: screenshot set or receipt path referenced below

## Verification

```sh
cd /Users/seb/Code/otto
bun run --cwd apps/desktop typecheck
bash apps/desktop/scripts/deploy-staging.sh
# Manual: resize /Applications/otto-staging.app at listed widths
```

## Execution receipt (2026-06-14)

- **Repo:** `/Users/seb/Code/otto` (uncommitted)
- **Files:** `apps/desktop/src/App.tsx`, `apps/desktop/src/styles.css`
- **Changes:** `app--sidebar-compact` class syncs grid 68px column; `.main`/`.content` flex 1 + min-height 0; removed duplicate CSS-only 900px grid override
- **Staging:** `/Applications/otto-staging.app` deployed
- **Verify:** `bun run verify:v0` 5/5 pass
- **Reviewer:** pending Sebastian +1

## Blocker log

Leave blank unless blocked.
