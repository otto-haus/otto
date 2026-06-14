# otto Desktop — UI/UX Master

Owner lane: **Claude (craft)** · Builder wires data · No mock operational counts.

## North star

otto is the **behavior layer** — not a chat client, not a dashboard SaaS wall.

Every surface must answer one of:

1. What is otto managing?
2. What needs Sebastian?
3. What was proven?

## Visual language

**Canonical source (Dropbox):**

```txt
/Users/seb/Library/CloudStorage/Dropbox/This Cycle/otto/Brand Style Guide.html
```

All UI/UX, onboarding, **065** otto.haus, and **115** pricing pages must match this guide — not invent parallel tokens. Desktop implementation: `apps/desktop/src/styles.css` (`:root`). When guide and repo drift, **guide wins**; sync CSS in UX PR.

Guide tokens (reference):

```txt
Ink:        --ink, --ink-soft, --mut, --faint (oklch)
Surfaces:   --bg, --bg-2, --bg-3, --line, --line-2
Status:     --ok / --warn / --stop (+ bg/ln variants)
Type:       Inter (--f-sans) · IBM Plex Mono (--f-mono)
Radius:     10px / 8px / 24px · max-width 1140px (marketing)
Wordmark:   lowercase "otto" · owl mark primary
Boundary:   ink pill — "The human ratifies. otto records the proof."
```

Repo summary (warm paper system — must stay aligned with guide):

```txt
Ground:     warm paper (#f8f7f2) · sidebar parchment (#efeee8)
Surface:    record panel (#fffefa) · hairline borders (1px, not shadows)
Type:       Inter (UI) · IBM Plex Mono (eyebrows, proof, file paths)
Action:     ink (#14161a) — not blue chrome
Status:     dots + pills only (ok / warn / stop / info)
Mark:       owl avatar — primary product mark
```

Tokens live in `apps/desktop/src/styles.css` (`:root`).

## Component library

Import from `apps/desktop/src/components/ui/`:

| Component | Use |
|-----------|-----|
| `EmptyState` | Web preview gate + full-page honest empty |
| `InlineEmpty` | Split-pane list with no rows |
| `SurfaceHeader` | eyebrow + title + lede + tag/actions |
| `SurfacePage` | Standard surface wrapper + enter animation |
| `SplitLayout` | 340px list + detail (canon surfaces) |
| `FilterBar` | Segmented filter tabs (Curation, Receipts) |
| `StatusPill` | Normalized status → pill tone |
| `Notice` | Inline warn/ok callout |
| `SurfaceProof` | Footer “The test:” from canon-briefs |
| `CommandStationStrip` | Chat-adjacent ops + culture cards (**059** / **127**) |
| `Modal` | Overlay shell — permission gate (**045**), memory writeback (**128**) |
| `PermissionCard` | In-stream approval (tool, allow once / session / deny) |
| `MessageActions` | Assistant row actions — **Correct this** (**123**) |
| `ThreadList` | Sidebar recent chats (**046**) |
| `ToastProvider` / `useToast` | Ratification + proposal moments |

Copy strings: `apps/desktop/src/copy/surfaces.ts` — **UX owns strings; builder owns data.**

## Interaction rules

- **Honest empty states** — never fabricate counts or “connected” before runtime says so.
- **Ratification copy** — “Behavior updated”, not “Saved” / “Applied”.
- **Receipts = proof** — authority + evidence, not logs.
- **Split panes** — list selects, detail explains; no modal stacks for canon browse.
- **Toasts** — consequential moments only (accept, propose, block); not every click.
- **Focus** — visible `:focus-visible` ring (ink); keyboard navigable filters/tabs.

## Shell IA

```txt
Sidebar groups:
  Chat
  Behavior:  Charters · Standards · Practices · Routines
  Governance: Curation · Receipts · Autonomy
  System:    Skills · Knowledge · Tickets · Channels
  Settings (footer)
```

Chat is full-bleed (no topbar). All other surfaces use workspace topbar + `SurfaceProof` footer.

## Motion

- Surface enter: `surfaceIn` 180ms ease (already on `.emptySurface`, `.surfacePage`, `.commandStation`)
- Toast enter: `toast-in` 180ms
- Sidebar width: 160ms ease
- No celebration/gamification animations

## Accessibility

- Toasts: `aria-live="polite"`, `role="status"`
- Filter bars: `role="tablist"` / `aria-selected`
- Command station cards: `<button>` with descriptive hint text
- Icon-only sidebar: `aria-label` + tooltip (`has-tip`)

## Claim boundary (**116**)

UI must not imply otto approves, verifies, guarantees, or makes actions safe. Copy is **record + ratify**, not **certify**.

## File map

```txt
apps/desktop/src/styles.css          tokens + layout + components
apps/desktop/src/components/ui/      shared UI primitives
apps/desktop/src/copy/surfaces.ts    all user-facing strings
apps/desktop/src/canon-briefs.ts     per-surface “The test”
docs/v1/ui-ux/SURFACES.md            per-surface layout + states
docs/v1/ui-ux/BUILDER-HANDOFF.md     builder integration contract
```

Per-surface detail: `SURFACES.md`. Builder contract: `BUILDER-HANDOFF.md`.
