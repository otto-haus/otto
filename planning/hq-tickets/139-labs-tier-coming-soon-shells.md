# 139 — Labs Tier: Coming Soon + Blocked Shells

Owner: Claude
Implementer model: Composer 2.5 Fast
Priority: P1
Depends on: 137, 136
Release bucket: v0.1 functional ship — **Labs UX**

Label: Launch Polish

## Outcome

Every **Labs-tier** feature in `docs/v1/ship-tier-matrix.md` follows one UX contract:

| Labs state | User sees |
|------------|-----------|
| Master off | **Coming soon** shell — what it will do + “Enable in Settings → Labs” |
| Master on, feature off | Same Coming soon shell |
| Master on, feature on, deps missing | **Labs blocked** shell — clear next step (no env var names in primary copy) |
| Master on, feature on, deps ready | Real pane (existing implementation) |

No raw `OTTO_*` strings in default UI copy (dev details ok in Settings advanced / docs link).

## Why this matters

Labs is not a junk drawer. It is a labeled preview lane. Users opting in should know why something is blocked; users opting out should never land on broken half-panes.

## Scope

### Shared components

- `ComingSoonShell` — eyebrow “Coming soon”, title, body, CTA → Settings Labs
- `LabsBlockedShell` — reason line, optional “Open Settings” / “Start sidecar” action
- Use in `Panes.tsx` + `ChecksSurfaceShell` only where tier = labs

### Wire each Labs feature (per **136** matrix)

| Feature | Pane / entry | Blocked when |
|---------|--------------|--------------|
| `knowledge_cognee` | Knowledge | Cognee disabled or sidecar down |
| `pgvector_recall` | Knowledge subsection + Settings | pgvector off or Postgres down |
| `channels_outbound` | Channels | No live bot — honest “contract only” |
| `memory_observatory` | Settings or Memory section | Runtime not ready |
| `worker_autonomous_loop` | Tickets or Workers affordance | Runner not configured |
| `practice_mining` | Practices or Curation | Observe loop off |
| `culture_export` | Settings or Command Station | Export path unavailable |
| `remote_letta_cloud` | Settings connection mode | Cloud mode without credentials |
| `command_station_full` | Dedicated dashboard vs Chat strip | Split: strip may remain Ship |

### Copy

- Add `labsCopy` block in `apps/desktop/src/copy/surfaces.ts`
- `docs/v1/labs.md` — one section per LabFeatureId: purpose, deps, reset steps

### Visual

- Sidebar: labs nav items show subtle “labs” or “soon” badge when master off (coordinate with **137**)
- Topbar pill: `coming soon` vs `labs` vs `file-backed`

## Non-goals

- Making Labs features Ship-tier
- Discord bot implementation (**020** parked)
- Cloud deploy (**083+** cut)

## Done when

- [ ] Each Labs row in matrix has a screenshot: master off → Coming soon shell
- [ ] Each Labs row: master on + feature on → blocked OR ready state screenshot
- [ ] Grep: no `OTTO_COGNEE_ENABLED` / `OTTO_PGVECTOR` in user-facing primary copy (Settings body ok in monospace “Advanced” only)
- [ ] `docs/v1/labs.md` merged
- [ ] Staging walkthrough receipt in `docs/receipts/staging/139-labs-tier-shells.md`
- [ ] Reviewer +1: “Labs off user never hits a throw stack or empty confusing pane”

## Verification

```sh
cd /Users/seb/Code/otto
bun run --cwd apps/desktop typecheck

OTTO_STAGING_REFRESH=1 bash apps/desktop/scripts/deploy-staging.sh
# Manual matrix: Labs off → visit each Labs nav item → Coming soon
# Labs on → toggle each feature → blocked or ready
```

## Blocker log

Leave blank unless blocked.
