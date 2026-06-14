# Settings — design spec (otto content, Veto voice)

Product-facing Settings surface in the desktop app. **Style reference only** from Veto Office Settings sandbox (2026-06): tab shell, section rhythm, field rows, warning banners. **Not** Veto domain copy (escrow, wire, office roles).

## Style reference (voice, not content)

Borrow from Veto Settings inspo:

- Horizontal underline tabs (not left sidebar nav)
- Section = title + one-line lede + content block
- Flat field rows (label left, control right) on a calm page background
- Readiness as status banner + optional collapsible detail (not hero ink + stat cards)
- Labs = explicit warning banner + toggle rows (Ship vs Labs tier)

Keep otto semantics: Letta connection, optional recall, culture defaults, Labs gates.

## Tabs (Ship)

| Tab | Purpose |
|-----|---------|
| General | Connection, optional recall, onboarding reset, readiness |
| Model providers | Provider mirror / capability display |
| Memory | Memory writeback and recall surfaces entry |
| Culture | Constitution / export entry points |
| Labs | Experimental toggles (off by default) |

## General tab sections (top → bottom)

1. **Connection** — Letta endpoint, agent, API key path; Save without dock overlap during onboarding run step.
2. **Optional recall** — Cognee / pgvector when wired; honest empty when not.
3. **Onboarding** — Reset first-run (destructive, labeled).
4. **Readiness** — Live status pill + short message; `<details>` for row-level blockers.

## Copy

Source of truth: `apps/desktop/src/copy/surfaces.ts` (`settingsCopy`).

## Related

- `docs/design/onboarding.md` — same style-vs-content rule for first-run
- `docs/design/brand-style-guide.html` — tokens, §10 Preview / Labs
- Ticket **150** — craft implementation + staging proof
