# Page-by-page design review — staging

Date: 2026-06-13  
App: `/Applications/otto-staging.app`  
Canon: `docs/v1/ui-ux/SURFACES.md`, `docs/v1/ui-ux/MASTER.md`

## Scorecard (5 checks: shell · IA · detail · copy · honesty)

| Surface | Shell | IA | Detail | Copy | Honesty | Status |
|---------|-------|-----|--------|------|---------|--------|
| Chat | pass | pass | pass | pass | pass | **pass** |
| Charters | pass | pass | pass | pass | pass | **pass** |
| Standards | pass | pass | pass | pass | pass | **pass** |
| Practices | pass | pass | pass | pass | pass | **pass** |
| Routines | pass | pass | pass | pass | pass | **pass** |
| Curation | pass | pass | pass | pass | pass | **pass** |
| Receipts | pass | pass | pass | pass | pass | **pass** |
| Checks | pass | pass | pass | pass | pass | **pass** |
| Autonomy | pass | pass | pass | pass | pass | **pass** |
| Skills | pass | pass | pass | pass | pass | **pass** |
| Knowledge | pass | pass | pass | pass | pass | **pass** |
| Tickets | pass | pass | pass | pass | pass | **pass** |
| Channels | pass | pass | pass | pass | pass | **pass** |
| Settings | pass | pass | pass | pass | pass | **pass** |
| Onboarding | pass | pass | pass | pass | pass | **pass** |

**15 / 15 pass** after Phase 0 polish (Autonomy evaluate panel, Settings IA consolidation).

## Phase 0 — visual polish (this pass)

- **Autonomy** — zone grid (`.detailGrid--3`), doors + evaluate in `.detailSection`; strings in `autonomyCopy`; knowledge routing hint in meta only.
- **Settings** — tabs reduced to **General | Providers**; Memory, Culture, Labs nested under General with anchor scroll (`#settings-memory`, `#settings-culture`, `#settings-labs`).
- **CSS** — `.detailGrid--3`, autonomy/conflict/settings section classes; `InlineEmpty` margin via `.listEmpty .muted`.
- **Copy** — `receiptsCopy.sampleLede`, standards loading/conflict, settings memory/readiness strings centralized in `surfaces.ts`.

## Phase 1 — detailSection sweep

- `SkippedLoaderPanel` → `detailSection` + `loaderCopy`
- `CharterDetailView`, `ProposalDetail`, Skills/Channels/Checks detail, Knowledge registry + recall panels
- Shared primitives: `.detailSection`, `.detailGrid`, `.ratificationStrip`, `.knowledgeRecallGrid`, `.promptbar__pickers`

## Phase 2 — copy sweep

- `loaderCopy`, expanded surface copy modules in `apps/desktop/src/copy/surfaces.ts`
- Onboarding: `connectedOk`, `legacyDockEyebrow`
- Chat picker labels: `selectModelTitle`, `reasoningTitle`, `pickerRetry`, `pickerOpenSettings`

## Phase 3 — Chat + onboarding

- Model/effort pickers in **prompt bar** (SURFACES spec)
- Assistant messages wire **Correct this** → `ProposeCorrectionModal`
- Onboarding strings in `onboardingCopy`

## Manual verify

1. Open `/Applications/otto-staging.app`.
2. **Autonomy** — three zone cards, doors row, evaluate form below stats (not buried in meta).
3. **Settings** — only General + Providers tabs; scroll General for Memory / Culture / Labs sections.
4. **Chat** — model/reasoning pickers above composer; **Correct this** on assistant replies.
5. **Standards** — conflict block uses warn-tint section styling when precedent applies.

## Deferred

- Per-surface screenshot gallery (beyond existing CDP proof script)
- Command Station live counts; constitution surface (spec 122)
- Live `/Applications/otto.app` — requires Sebastian approval
