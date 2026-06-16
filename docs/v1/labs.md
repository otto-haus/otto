# Labs

Preview lane for features that are real in code but not required for the **Ship** tier loop.

## States

| State | User sees |
|-------|-----------|
| Surface disabled (Labs off) | **Coming soon** shell — what it will do + enable in Settings → Labs |
| Surface enabled, deps missing | **Labs blocked** shell — next step in plain language (no `OTTO_*` in primary copy) |
| Surface enabled, deps ready | Normal pane |

## Lexicon (canonical)

Use `apps/desktop/src/copy/surfaces.ts` → `labsCopy`, `checksCopy`.

| Term | Use |
|------|-----|
| **Labs** | Settings section name; mono eyebrow `labs` |
| **Coming soon** | Not enabled in this workspace yet — neutral, not warn |
| **Checks** | Culture CI — compiled regressions from Standards (not “tests dashboard”) |
| **Shipped** | Labs toggle badge for v0.1-default-on surfaces |

**Forbidden in product copy:** beta, experimental, unlock premium, early access, set it and forget it, autonomous, guaranteed.

## Settings

- **Master toggle** — Labs off by default (`labs.enabled === false` on fresh profile)
- **Per-feature toggles** — disabled when master off; ids match matrix `LabFeatureId`
- Persisted in `~/.otto/config.json`; IPC `otto:labs:get` / `otto:labs:set`

## Agent API

Agents and staging scripts use the same preload surface as Settings — no React-only toggles.

### Channels

| Preload | IPC | Returns |
|---------|-----|---------|
| `window.otto.labs.get()` | `otto:labs:get` | `LabsConfig` |
| `window.otto.labs.set(patch)` | `otto:labs:set` | updated `LabsConfig` |

### Shape (`LabsConfig`)

```typescript
{
  enabled?: boolean;  // master — default false on fresh profile
  features?: Partial<Record<LabFeatureId, boolean>>;
}
```

`LabFeatureId` values match **137** / `docs/v1/ship-tier-matrix.md` (`knowledge_cognee`, `channels_outbound`, `culture_export`, `voice_realtime`, `image_gen`, …).

Voice and image (`voice_realtime`, `image_gen`) default **off** on fresh profiles. Enable explicitly in **Settings → General → Voice & image (Labs)** — master Labs must be on first. Provider/API keys stay in Letta; otto stores only the boolean gate. Downstream capture (#510) and image tool (#511) slices must check `isFeatureEnabled` before wiring UI or IPC.

Interactive preview canvas (`preview_canvas`) defaults **off**. When enabled, HTML preview may dispatch otto-defined actions from sandboxed buttons — see `docs/v1/preview-mode.md` (#661). Host handlers for navigate/copy/receipt follow in later slices.

Settings persists the **full merged object** after each toggle. Partial patches are fine for agents — main process merges with `patchLabsConfig` before writing `~/.otto/config.json`.

### Examples (Electron renderer / CDP)

Read current state:

```javascript
await window.otto.labs.get();
// → { enabled: false, features: {} }
```

Enable Knowledge without opening Settings (same outcome as master on + `knowledge_cognee` toggle):

```javascript
await window.otto.labs.set({
  enabled: true,
  features: { knowledge_cognee: true },
});
```

Enable culture export feature flag (export still runs via `window.otto.culture.export()` when deps are ready):

```javascript
await window.otto.labs.set({
  enabled: true,
  features: { culture_export: true },
});
```

Enable Realtime voice (capture UI checks this gate — #510):

```javascript
await window.otto.labs.set({
  enabled: true,
  features: { voice_realtime: true },
});
```

Enable image generation tool path (#511):

```javascript
await window.otto.labs.set({
  enabled: true,
  features: { image_gen: true },
});
```

Staging: evaluate the snippets above in `/Applications/otto-staging.app` via CDP after `otto:init`.

### Cut tier — no IPC shortcuts

**Cut** items in `docs/v1/ship-tier-matrix.md` (Otto Cloud live stack, Cathedral control plane, Paperclip write integration, extension `/ticket` CLI) have **no** product sidebar row and **no** dedicated deploy IPC routes. Enabling a Labs feature flag (e.g. `remote_letta_cloud`) only stores intent in config — it does not bypass connection credentials or ship cloud infrastructure.

Do not add MCP servers or hidden handlers for Cut-tier work in v0.1 ship.


Labs-tier sidebar items (Knowledge, Channels) stay visible with a faint `coming soon` badge when master off or feature off (`surface-tiers.ts` + `Sidebar.tsx`).

## Matrix

Feature ↔ tier mapping: `docs/v1/ship-tier-matrix.md`.
