# Scout receipt — Standards surface (#448)

**Date:** 2026-06-14  
**Scope:** Read-only map (Lead pickup after Scout subagent usage limit)

## Surface wiring

| Area | Path | Notes |
|------|------|-------|
| UI component | `apps/desktop/src/surfaces/Panes.tsx` | `Standards` + `StandardDetail` — list/detail, conflicts, file-backed loader |
| Nav gate | `apps/desktop/src/surface-tiers.ts` | `standards: ship` but was in `WORKSPACE_PREVIEW_SURFACES` → `surfaceGate` returned `coming-soon` |
| Sidebar | `apps/desktop/src/components/Sidebar.tsx` | Top-level Standards nav item |
| Copy | `apps/desktop/src/copy/surfaces.ts` | `standardsCopy`, `listEmpty.standards` |
| IPC | `apps/desktop/electron/ipc.ts` | `otto:standards:list`, `get`, `citations-for-text`, `conflict-for-standard` |
| Store | `apps/desktop/electron/standard-store.ts` | Reads `standards/registry.yaml` + markdown canon |
| Types | `packages/core/src/types.ts` | `StandardRecord`, `StandardsRegistry` |
| Ship check | `SHIP_CHECKS/standards.md` | File contract done; runtime enforcement deferred |

## Nav "soon" gate

`isSurfaceComingSoon('standards')` was **true** because `standards` ∈ `WORKSPACE_PREVIEW_SURFACES` (lines 97–107, 109–111, 129–131 in `surface-tiers.ts`). Tier was already `ship`; product shell blocked navigation.

## Tests (pre-change)

- `apps/desktop/electron/standard-store.test.ts`
- `apps/desktop/src/surface-tiers.test.ts`
- No dedicated standards UI filter tests (gap)

## Gaps vs #448

1. Standards nav showed **coming soon** despite ship tier
2. No search/filter or domain grouping in UI
3. Registry lacked `domain` metadata for IA
4. Detail view omitted markdown rationale excerpt and curation path copy
5. Automated Standards enforcement still deferred (Curation — out of scope)

## Worker file set (minimal)

- `apps/desktop/src/surface-tiers.ts` + test
- `apps/desktop/src/standards-filter.ts` + test
- `apps/desktop/src/surfaces/Panes.tsx`
- `apps/desktop/src/copy/surfaces.ts`
- `apps/desktop/electron/standard-store.ts`
- `packages/core/src/types.ts`
- `standards/registry.yaml`
