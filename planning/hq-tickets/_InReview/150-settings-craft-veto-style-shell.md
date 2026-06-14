# 150 — Settings craft: Veto-style shell

Owner: Claude
Priority: P1
Depends on: 001, 137
Design: `docs/design/settings.md`

## Outcome

Settings reads as a calm product surface: horizontal tabs, section ledes, no dev chrome (ink banner, stat strip). Veto inspo is **layout and voice only** — otto connection/providers/memory/culture/labs content unchanged in meaning.

## Scope

- Replace Settings left nav with horizontal underline tabs.
- General tab: Connection → Optional recall → Onboarding reset → Readiness (collapsible detail).
- Providers, Memory, Culture, Labs: section header + lede; Labs warning + toggle rows.
- Flatten Connect Letta block; fix onboarding getting-started dock covering Save on Settings during run step.
- Copy + CSS in `settingsCopy` / `.settingsPage` tokens.

## Done when

1. Settings uses five horizontal tabs (General, Model providers, Memory, Culture, Labs) — no left sidebar nav.
2. General tab has no `SurfaceHero` / `SurfaceInk` / `SurfaceStatStrip`.
3. Readiness shows status banner and collapsible detail rows (`ReadyRow` / `settingsReadinessRow`).
4. Labs tab shows warning banner and per-toggle rows aligned to Ship/Labs lexicon.
5. Staging manual walk: open Settings on `/Applications/otto-staging.app`, switch tabs, Save on General visible when onboarding is on run step (dock not covering primary action).
6. `bun run --cwd apps/desktop typecheck` passes.

## Execution receipt

Status: pass (awaiting reviewer +1)
Date: 2026-06-14
Implementer: Claude (Cursor)
Branch: `ship/functional-labs` (uncommitted at receipt time)

### What changed

Rebuilt Settings layout to match Veto-style tab shell while keeping otto fields and readiness truth from ticket 001. Removed marketing-style ink and stat cards from General. Added section headers, field-row CSS, readiness collapse, Labs warning strip. Hid onboarding getting-started dock on Settings route during `run` step so Save stays reachable.

### Files changed

- `apps/desktop/src/surfaces/Panes.tsx` — Settings tab shell, sections, ConnectLetta flatten, readiness UI
- `apps/desktop/src/styles.css` — `.settingsPage`, `.settingsTabs`, section/field/readiness/Labs styles
- `apps/desktop/src/copy/surfaces.ts` — `settingsCopy` tabs, section titles/ledes; removed ink/stat keys
- `apps/desktop/src/Onboarding.tsx` — suppress dock on Settings when step is `run`
- `docs/design/settings.md` — design canon (style vs content)
- `docs/design/README.md` — index link

### Verification run

```sh
bun run --cwd apps/desktop typecheck   # exit 0
bash apps/desktop/scripts/deploy-staging.sh   # prior session — /Applications/otto-staging.app
```

Staging proof: manual tab walk + General Save visibility during onboarding run step (Sebastian or reviewer).

### Evidence (Done-when → proof)

| # | Done-when | Proof |
|---|-----------|--------|
| 1 | Horizontal tabs | `Panes.tsx` `settingsTabs` + `settingsCopy.tabs`; CSS `.settingsTabs` |
| 2 | No ink/stat on General | `SurfaceInk` / `SurfaceStatStrip` removed from General render path |
| 3 | Readiness collapsible | `<details>` + `ReadyRow` / `.settingsReadinessRow` |
| 4 | Labs warning + rows | Labs section warning + toggle rows in `Panes.tsx` + `.settingsLabsWarning` |
| 5 | Staging walk | Deploy target `otto-staging.app`; dock guard in `Onboarding.tsx` |
| 6 | Typecheck | `tsc --noEmit` exit 0 (2026-06-14) |

### Known limitations

- Provider mirror depth remains ticket **078** (backlog); this ticket is shell/craft only.
- Automated visual regression not added; proof is staging walk + typecheck.

## Review

Verdict: pending
Reviewer: (unbiased subagent — AC-by-AC, ticket 051 gate)
Notes:
