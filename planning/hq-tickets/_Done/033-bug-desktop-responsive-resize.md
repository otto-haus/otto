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

- **Branch:** `ship/v0.3-integration` (PR #6)
- **Commit:** `6bf74cd` — `apps/desktop/src/App.tsx`, `apps/desktop/src/styles.css`
- **Changes:** `app--sidebar-compact` syncs grid 68px column with JS collapse; `.main`/`.content` flex 1 + min-height 0; removed duplicate CSS-only 900px grid override
- **Staging:** `/Applications/otto-staging.app` via `apps/desktop/scripts/deploy-staging.sh`
- **Verify:** `bun run verify:v0` 5/5; `bun test ./apps/desktop/electron/*.test.ts` 37+ pass
- **Reviewer:** pending Sebastian resize smoke +1

## Blocker log

Leave blank unless blocked.

## Review rev8

Reviewer: independent subagent (batch 001-045)
Date: 2026-06-14
Verdict: -1

### Checked against

- Resize at 1280→640 on Chat, Standards, Settings: no horizontal scroll, no overlapping topbar: **UNPROVEN** — no screenshot set, no staging receipt at listed widths.
- Staging deploy includes fix: **UNPROVEN** — receipt claims deploy; no artifact in `docs/receipts/staging/` for 033.
- Evidence: screenshot set or receipt path referenced: **FAIL** — no receipt path in ticket body; nothing under `docs/receipts/staging/` for 033.

### Evidence inspected

- `apps/desktop/src/App.tsx` (`matchMedia` + `app--sidebar-compact`)
- `apps/desktop/src/styles.css` (grid 68px, `.main`/`.content` flex chain)
- Ticket ## Execution receipt (2026-06-14)
- `docs/receipts/staging/` (no 033 entry)

### Defects

- Code changes exist but resize behavior is unproven at required widths/surfaces.
- Ticket lists receipt path "below" but none is present.

### Required changes

- Run resize smoke at 1280 / 1100 / 900 / 640 on Chat, Standards, Settings against `/Applications/otto-staging.app`.
- Add receipt under `docs/receipts/staging/` (JSON + PNGs) and reference it in the ticket.

### Finding

Implementation likely present; no +1 without resize proof → -1.

## Execution receipt (rev9 — staging CDP capture)

Date: 2026-06-14  
**git:** `fff0152` · **app:** `/Applications/otto-staging.app` (CDP 9445)  
**script:** `scripts/otto-staging-rev8-proof.cjs`  
**manifest:** `docs/receipts/staging/staging-rev8-proof-20260614070035.json`

| Width | Surfaces | Horizontal scroll |
|-------|----------|-------------------|
| 1280 / 1100 / 900 / 640 | Chat, Standards, Settings | none (all `scrollWidth === clientWidth`) |

**Screenshots:** `docs/receipts/staging/033-resize-{1280,1100,900,640}-{chat,standards,settings}.png` (12 PNGs)  
**Runtime:** disposable smoke conversation; `runtimeReady: true`  
**Receipt:** `docs/receipts/staging/033-bug-desktop-responsive-resize.md`

## Review rev9

Reviewer: independent subagent (batch 001-045 rev9)
Date: 2026-06-14
Verdict: +1

### Checked against

- Resize 1280→640 on Chat, Standards, Settings without horizontal scroll/overlap: **PASS** — `staging-rev8-proof-20260614070035.json` tickets.033 all widths `horizontalScroll:false`.
- Staging deploy includes fix: **PASS** — `/Applications/otto-staging.app`, git `fff0152`.
- Evidence screenshot set or receipt path: **PASS** — 12 PNGs under `docs/receipts/staging/033-resize-*.png` + `033-bug-desktop-responsive-resize.md`.

### Evidence inspected

- Files: `App.tsx`, `styles.css`
- Artifacts: manifest JSON + PNGs on disk (verified)
- Receipt: `## Execution receipt (rev9 — staging CDP capture)`

### Finding

Rev8 -1 cleared: resize proof mapped at required widths/surfaces.

## Review rev10

Reviewer: independent reviewer (batch 001-045 rev10)
Date: 2026-06-14
Verdict: +1
Delta vs rev9: unchanged

### Checked against Done when

- Resize 1280→640 no horizontal scroll: **PASS** — manifest `tickets.033.ok:true`.
- Staging deploy: **PASS** — `/Applications/otto-staging.app` @ `fff0152`.
- Screenshot/receipt path: **PASS** — 12 PNGs + `033-bug-desktop-responsive-resize.md`.

### Evidence inspected

- Execution rev10 receipts + `docs/receipts/staging/` (focus: 001/017/018 rev9; 033/036/037 rev9 staging; 026/039/041-044/045 rev10)
- Prior `## Review rev9` mappings

### Finding

Rev9 staging resize proof (`staging-rev8-proof-20260614070035.json`) holds; no new rev10 capture required.
