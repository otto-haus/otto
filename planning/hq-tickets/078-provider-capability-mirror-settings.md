# 078 — Settings: Provider Capability Mirror (Write-Only BYOK)

Owner: Claude
Priority: P1
Depends on: 076
Release bucket: v0.1 workspace

Label: Launch Polish

## Outcome

Settings exposes a **Provider Capability Mirror** — otto-native layout for provider auth that **never** makes otto the secret system of record.

```txt
Provider auth is managed by the bundled Letta engine.
```

## Why this matters

Chat agreed: port Letta BYOK **pattern**, not authority. Users need one place to connect providers; otto must not store, read back, or log API keys. `AGENTS.md` invariant preserved while product UX stays in-app.

## Scope

### UI (Settings → Connect / Providers)

- Provider rows: name, status (connected / missing / error), last verified
- **Add / update key** form — submit only; no pre-fill, no “show key”
- **Open Letta** / advanced link for power users (external)
- Copy explains write-only handoff to Letta/keychain

### Backend

- Submit → main process → Letta/keychain write path (same as 076 bootstrap)
- otto config stores booleans only: `hasOpenAIKey`, etc. — never key material
- IPC payloads audited: no secret fields cross renderer boundary
- Logs: boolean-only presence checks

### Honest states

- Embedded mode (076): form works against bundled engine
- Advanced external Letta: mirror shows status read from readiness probe, not key contents
- Disconnected / engine down: blocker + Settings action

## Non-goals

- otto holding provider keys in `config.json` or `secrets.env` as SoR (legacy dev path may remain for advanced mode only — document)
- Full Letta Desktop settings clone
- Model picker logic (Chat owns model selection UI)

## Done when

- [ ] User can add provider key via otto UI; key not readable back in UI or config dump
- [ ] Status rows update after successful write + readiness refresh
- [ ] Staging grep/log audit: no key substrings in renderer logs or IPC traces
- [ ] Reviewer +1

## Verification

```sh
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
# manual: add key → connected → inspect ~/.otto/config.json (no secret fields)
```

## Related

- **076** — embedded engine + write-only bootstrap (prerequisite)
- **047** — memory read is separate surface

## Blocker log

Leave blank unless blocked.
