# Surface map (Sidebar → ticket → SHIP_CHECK)

Updated: 2026-06-14 (post audit reopen)

Each row links a `SurfaceId` in `apps/desktop/src/components/Sidebar.tsx` to owning HQ ticket(s) and the ship-check doc under `docs/v1/SHIP_CHECKS/`.

| SurfaceId | Label | Owning ticket(s) | Folder | SHIP_CHECK |
|---|---|---|---|---|
| chat | Chat | 002, 003, 045, 046, 049 | root (045–049 partial) | `desktop.md` |
| charters | Charters | 006, 007 | `_Done/` | `charter.md` |
| standards | Standards | 008, 009, 050 | `_Done/` | `standards.md` |
| practices | Practices | 010, 011, 053 | `_Done/` (053); root 053 reopened | `practices.md` |
| routines | Routines | 012, 013, 052 | `_Done/`; root 052 reopened | `routines.md` |
| curation | Curation | 014, 015, 016, 048 | `_Done/` | `curation.md` |
| receipts | Receipts | 004, 005, 124 | `_Done/`; root 124 reopened | `runs-receipts.md` |
| checks | Checks | 131–135 | `_Done/` 131, 133; root 132 | (culture wedge — see `checks` IPC + `docs/v1/checks.md`) |
| autonomy | Autonomy | 017 | `_Done/` | `autonomy.md` |
| skills | Skills | 056, 066 | root 056, 066 | `skills.md` |
| knowledge | Knowledge | 055, 040–044, 068 | root 055; Cognee 041–044 | `knowledge.md` |
| tickets | Tickets | 035, 049, 051 | root 049, 051 | `tickets.md` |
| channels | Channels | 056, 020 (bot parked) | root 056 | `channels.md` |
| settings | Settings | 001, 078, 137 (Labs) | `_Done/` 001; root 137 | `desktop.md` |

**Worker orchestration** (no dedicated nav id): 060, 049 — `worker-orchestration.md`.

**Release gate** (cross-cutting): 063, 142 — `release-gate.md`.

**Namespace / packaging**: 076, 140 — `namespace.md`, `desktop.md`.

Audit source: `000-audit-status.md`. Folder location is truth over this table when they diverge.
