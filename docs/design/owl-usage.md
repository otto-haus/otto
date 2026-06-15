# Owl mark usage (otto portrait canon)

The shipped product mark is the **portrait owl** (`apps/desktop/src/assets/otto-avatar.png`), rendered via `OttoMark`. Do not reintroduce the legacy line-drawn owl as product chrome.

## Component

Use `OttoMark` for every in-app owl avatar. Pass an explicit pixel `size`; never rely on intrinsic image dimensions or full-bleed layout.

| Surface | Size | Notes |
|---------|------|-------|
| Page `EmptyState` | 48px | Centered above eyebrow; one mark per view |
| Chat header avatar | 30px | `dimmed={!ready}` when runtime session not ready |
| Chat message rows | 26–32px | Assistant rows only; no mark on user bubbles |
| Sidebar profile | 32px | `dimmed={!connected}` when runtime not ready |

## Empty states

- **`EmptyState`** (page-level): shows the 48px mark.
- **`InlineEmpty`** (list/section placeholders): **never** shows a mark — text only.
- **`EmptyState variant="chat"`**: no mark (chat pane uses its own header avatar).

## Runtime-not-ready opacity

When the Letta runtime session is not ready, chrome avatars (chat header, sidebar profile) use `dimmed` on `OttoMark` (60% opacity via `.ottoMark--dimmed`). Status is also carried by the connection dot and status pill — the mark dims; it does not disappear.

## Rules

1. At most **one** owl mark visible per view (header **or** empty-state hero, not both competing).
2. Never squeeze or stretch — always set explicit `width`/`height` on `OttoMark`.
3. Reference icons under `docs/design/icons/` are line art for docs only; do not ship them as product logo.

## Related

- `docs/design/brand-style-guide.html` — tokens and voice
- `apps/desktop/src/components/OttoMark.tsx` — implementation
- Issue #572 — acceptance tracking
