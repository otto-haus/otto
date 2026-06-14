# Otto planning

> Current intake: use GitHub Issues for new nits, bugs, polish requests, and follow-up work.
> Every issue needs exactly one priority label (`p0`, `p1`, `p2`, or `p3`) at creation time;
> agents work `p0` first.
> The local ticket folders below are historical planning context, not the default place
> to create new work items.

**Canonical location:** this repo. GitHub Issues/PRs are current work truth; historical ticket files remain repo context.

| Path | Role |
|---|---|
| `planning/hq-tickets/` | **Primary queue** — folder status is truth (`root`, `_InReview`, `_Done`, `_Backlog`, `_Parked`) |
| `planning/lane-tickets/` | **Historical lane view** — wave-001–016 numbering; maps to HQ via `000-hq-sync.md` |
| `docs/design/` | **Public design canon** — brand guide, onboarding, motion, reference SVGs |

Folder location is historical ticket status for HQ queue (`root`, `_Done`, `_Parked`, `_InReview`). Lane tickets use inline `Status:` in each file.

Do not treat chat as state. For new work, proof should live in the linked GitHub Issue/PR. Historical proof may still live in ticket files.

## Dropbox (mirror only)

`~/Library/CloudStorage/Dropbox/This Cycle/otto/` may still hold copies of design files and ticket redirect stubs.

**Do not edit tickets or design canon in Dropbox.** Git `planning/hq-tickets/` and `docs/design/` are source context.
