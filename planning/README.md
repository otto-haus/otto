# Otto planning

**Canonical location:** this repo. Ticket state lives in git — not Dropbox.

| Path | Role |
|---|---|
| `planning/hq-tickets/` | **Primary queue** — folder status is truth (`root`, `_InReview`, `_Done`, `_Backlog`, `_Parked`) |
| `planning/lane-tickets/` | **Historical lane view** — wave-001–016 numbering; maps to HQ via `000-hq-sync.md` |
| `docs/design/` | **Public design canon** — brand guide, onboarding, motion, reference SVGs |

Start HQ work at `planning/hq-tickets/AGENTS.md` → `000-index.md` → `000-parallel-map.md`.

Lane tickets use inline `Status:` in each file. HQ tickets use **folder location** as canonical status.

Do not treat chat as state. Proof lives inside ticket files; `receipts/` holds raw logs referenced by tickets only.

## Dropbox (mirror only)

`~/Library/CloudStorage/Dropbox/This Cycle/otto/` may still hold copies of design files and ticket redirect stubs.

**Do not edit tickets or design canon in Dropbox.** Git `planning/hq-tickets/` and `docs/design/` are source of truth.
