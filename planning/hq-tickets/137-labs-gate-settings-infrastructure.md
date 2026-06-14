# 137 — Labs Gate: Settings + Config + Surface Tiers

Owner: Cursor
Implementer model: Composer 2.5 Fast
Priority: P0
Depends on: 136
Release bucket: v0.1 functional ship — **Labs infrastructure**

## Outcome

Otto has a **Labs** product gate in Settings:

```txt
Default (Labs off): only Ship-tier surfaces behave as product; Labs-tier shows Coming soon
Labs on: user can enable individual lab features and reach real (possibly blocked) UI
```

Persisted in `~/.otto/config.json`; exposed via IPC; agents can read/write the same toggles.

## Why this matters

Users should never see env-var instructions or half-built panes in the default product. Labs is the honest escape hatch for experimental work without polluting Ship claims.

## Scope

### Config + types

Extend `OttoConfig` in `apps/desktop/electron/shared/types.ts`:

```typescript
labs?: {
  enabled?: boolean;  // master — default false on fresh profile
  features?: Partial<Record<LabFeatureId, boolean>>;
};
```

**LabFeatureId** (minimum v1 set — must match **136** matrix):

```txt
knowledge_cognee
pgvector_recall
channels_outbound
memory_observatory
worker_autonomous_loop
practice_mining
culture_export
remote_letta_cloud
command_station_full
```

### IPC

- `otto:labs:get` → `{ enabled, features }`
- `otto:labs:set` → patch master + per-feature booleans
- Wire through `preload.ts` + renderer `runtime.ts`

### Tier registry (single source)

- `apps/desktop/src/surface-tiers.ts` (or `packages/core`) — maps `SurfaceId` + lab features → `ship | labs | cut`
- Replace ad-hoc `DATA_SOURCE` in `App.tsx` with tier helpers
- **Cut** surfaces: never in sidebar (Cloud, etc.)

### Settings UI

- New **Labs** section in `Panes.tsx` Settings:
  - Master toggle with warning copy (“experimental; may break”)
  - Per-feature toggles (disabled when master off)
  - Link to `docs/v1/labs.md` (stub ok in this ticket — **139** expands)

### Sidebar + topbar pills

- Ship surfaces: unchanged
- Labs surfaces when master off: **Coming soon** badge on nav item; topbar pill `coming soon`
- Labs surfaces when master on + feature on: normal nav; pill reflects file/live as today
- Labs surfaces when master on + feature off: same as master off

### Tests

- `config-store.test.ts`: labs round-trip, defaults false
- Unit test: tier helper returns correct tier for chat vs knowledge

## Non-goals

- Full Coming soon shell content (**139**)
- Ship-tier hardening (**138**)
- Marketing/README tier tables (**140**)

## Done when

- [x] Fresh profile: `labs.enabled === false`; no lab feature enabled
- [x] Settings persists master + per-feature toggles across restart
- [x] Sidebar shows Coming soon badge on Labs nav items when Labs off
- [x] Enabling master + `knowledge_cognee` allows navigation to Knowledge (real pane — may still show blocked state inside)
- [x] IPC/preload exposes labs to renderer; no secrets in config
- [x] Unit tests pass; `bun run --cwd apps/desktop typecheck` green
- [ ] Reviewer +1 on agent-native parity (**141** can be same review if combined)

## Verification

```sh
cd /Users/seb/Code/otto
bun test ./apps/desktop/electron/config-store.test.ts
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck

OTTO_STAGING_REFRESH=1 bash apps/desktop/scripts/deploy-staging.sh
# Manual: Settings → Labs off → Knowledge nav shows coming soon
# Manual: Labs on + knowledge → Knowledge pane opens
```

## Blocker log

Leave blank unless blocked.
