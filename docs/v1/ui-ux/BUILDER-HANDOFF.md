# UI/UX → Builder handoff

You build plumbing and wire data. The UX lane owns visual system, copy, and component shells.

## First wiring pack — Chat wedge (045 + 046 + 123)

UX lane delivers this **first**. Wire in a **separate PR** — do not rewrite layout.

| Component | Location | Builder hook | UX status |
|-----------|----------|--------------|-----------|
| `PermissionCard` + `Modal` | Chat overlay | `runtime.onPermission(request)` → show; buttons call `runtime.permission.respond(id, decision)` | **Wired** — session allow maps to allow until runtime exposes scope |
| `ThreadList` | `Sidebar.tsx` | `threads.list()` → rows; select → load conversation; **New chat** → create thread (not wipe history) | **Shell** — localStorage archive on New chat; select disabled until **046** store |
| `MessageActions` | Assistant message row | **Correct this** → `curation.proposals.createFromCorrection({...})` → `toastCopy.proposalCreated` | **Wired** — default correction copy; target `{ kind: 'standard' }` until richer picker |

Props/interfaces will be exported from `components/ui/`. Thread index uses `otto.chat.threads.v1` in localStorage until `threads.list()` ships.

**081** craft (dev chrome removal) is UX-owned in same files — merge UX PR before builder PR when possible.

**081 shipped in this pack:** removed default `cli:` path from not-ready Chat; sidebar footer no longer shows raw agent id; working pulse uses `chatCopy.workingPulse`.

---

## Before you touch a surface

1. Read `docs/v1/ui-ux/MASTER.md` + the surface section in `SURFACES.md`.
2. Import UI primitives from `apps/desktop/src/components/ui/`.
3. Import strings from `apps/desktop/src/copy/surfaces.ts` — do not hardcode duplicate copy.
4. Run staging smoke; screenshot for UX review.

## Wiring checklist

### Command Station (`CommandStationStrip`)

```tsx
<CommandStationStrip
  onNavigate={setActive}
  counts={{
    curationPending: pendingCount,      // optional — omit until real
    recentReceipts: recentCount,
    openTickets: openCount,
    autonomyDoors: doorCount,
  }}
/>
```

Omit `counts` entirely until stores expose truth. UI shows `—` — that is correct.

### Curation toasts

Already wired in `Panes.tsx` via `useToast` + `toastCopy`. Do not duplicate.

### Correct this (**048** / **123**)

1. Add message action in `Chat.tsx` calling `api.curation.proposals.createFromCorrection`.
2. Toast: `{ title: toastCopy.proposalCreated, body: \`… · ${toastCopy.openCuration}\`, tone: 'ok' }`.
3. Optional: `onNavigate('curation')`.

### Permission modal (**045**)

Use `Modal` + `PermissionCard` in `components/ui/` — wired in Chat wedge pack #1.

### Multi-thread list (**046**)

Sidebar or Chat head — use `SplitLayout` / card list patterns; thread subtitle in mono.

## File ownership

| UX lane | Builder lane |
|---------|--------------|
| `styles.css` (visual) | `electron/*-store.ts` |
| `components/ui/*` | `ipc.ts`, `preload.ts` |
| `copy/surfaces.ts` | `runtime.ts` types |
| `SURFACES.md` AC copy | store list/get APIs |

Avoid parallel edits to `Panes.tsx` — prefer UX PR for markup/copy; builder PR for data hooks. Merge UX first when conflicts.

---

## Phase 0b components (shipped)

| Component | Path | Notes |
|-----------|------|-------|
| `WebPreviewFrame` | `components/ui/WebPreviewFrame.tsx` | `webPreviewEmpty[surface]` for !api paths |
| `ReceiptCard` | `components/ui/ReceiptCard.tsx` | Receipts list (**124**) |
| `CultureCard` | `components/ui/CultureCard.tsx` | Culture nav cards |
| `MemoryWritebackGate` | `components/ui/MemoryWritebackGate.tsx` | Modal shell — wire when writeback IPC lands |
| `CheckBlockBanner` | `components/ui/CheckBlockBanner.tsx` | Chat inline block UI — wire on **133** block events |
| `ChecksSurfaceShell` | `surfaces/ChecksSurfaceShell.tsx` | Pane shell — **not routed** until **133** + sidebar entry |

Copy: `curationCopy`, `receiptsCopy`, `checksCopy`, `cultureCiCopy`, `memoryWritebackCopy` in `copy/surfaces.ts`.

**134 blocked on 133:** do not call `checks.list` or subscribe to block events until builder exposes IPC. `CheckBlockBanner` accepts props only — no fabricated rows.

Phase 1 reference migrations: **Curation** + **Receipts** use `SurfacePage`, `SurfaceHeader`, `FilterBar`, `SplitLayout`, `InlineEmpty`.

## Definition of done (UI)

- [ ] Uses shared components where applicable
- [ ] Copy from `copy/surfaces.ts` or PR adds there first
- [ ] Empty states honest (no fake data)
- [ ] `SurfaceProof` footer on canon surfaces
- [ ] Staging screenshot attached to ticket receipt
- [ ] UX lane +1 on craft

## Verification

```sh
bun run --cwd apps/desktop typecheck
apps/desktop/scripts/deploy-staging.sh
# manual: exercise surface empty + loaded + error paths
```
