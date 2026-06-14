# Labs

Preview lane for features that are real in code but not required for the **Ship** tier loop.

## States

| State | User sees |
|-------|-----------|
| Surface disabled (Labs off) | **Coming soon** shell — what it will do + enable in Settings → Labs |
| Surface enabled, deps missing | **Labs blocked** shell — next step in plain language (no `OTTO_*` in primary copy) |
| Surface enabled, deps ready | Normal pane |

## Lexicon (canonical)

Use `apps/desktop/src/copy/surfaces.ts` → `labsCopy`, `checksCopy`.

| Term | Use |
|------|-----|
| **Labs** | Settings section name; mono eyebrow `labs` |
| **Coming soon** | Not enabled in this workspace yet — neutral, not warn |
| **Checks** | Culture CI — compiled regressions from Standards (not “tests dashboard”) |
| **Shipped** | Labs toggle badge for v0.1-default-on surfaces |

**Forbidden in product copy:** beta, experimental, unlock premium, early access, set it and forget it, autonomous, guaranteed.

## Settings

- **Master toggle** — Labs off by default (`labs.enabled === false` on fresh profile)
- **Per-feature toggles** — disabled when master off; ids match matrix `LabFeatureId`
- Persisted in `~/.otto/config.json`; IPC `otto:labs:get` / `otto:labs:set`

## Nav

Labs-tier sidebar items (Knowledge, Channels) stay visible with a faint `coming soon` badge when master off or feature off (`surface-tiers.ts` + `Sidebar.tsx`).

## Matrix

Feature ↔ tier mapping: `docs/v1/ship-tier-matrix.md`.
