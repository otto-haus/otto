# 076 — Embedded Letta Runtime (One-App Distribution)

Owner: Codex
Priority: P0
Depends on: 033, 034, 035, 036, 037, 038
Release bucket: v0.1 product substrate

**Blocks:** Provider Capability UI (BYOK mirror), 047 Memory Observatory, Letta Cloud remote mode (077), onboarding “zero setup” path.

## Outcome

```txt
Download otto. Open otto. It is powered by Letta.
```

No separate Letta Desktop install, no global `letta` CLI, no Docker, no `/reload` wiring for normal users. Otto ships a **pinned Letta Code engine** inside `otto.app`, starts it on launch, and owns first-run agent creation — with **Existing Letta / Cloud / self-hosted** as explicit advanced modes only.

## Why this matters

Today’s path is dev-shaped: prefer `/Applications/Letta.app` CLI, shell env, manual agent IDs, stale bundled fallback (`letta-runner.ts`). That contradicts product UX and AGENTS.md’s intent (“provider keys in Letta”) while still forcing users to **know** Letta exists.

The real invariant is not “otto has no provider form.” It is:

```txt
otto is NOT the system of record for runtime memory or provider secrets.
Letta is.
```

Otto may collect provider auth in UI **only as write-only into Letta/keychain** — never stored in otto config, never logged, never read back.

## Architecture

### 1. Bundle pinned engine

- Ship `@letta-ai/letta-code` (and required SDK deps) under app resources via `electron-builder` `extraResources` / production deps.
- Pin version in lockfile; document upgrade policy (receipt + smoke on bump).
- Keep `asar: false` (or equivalent) so subprocess spawn of `letta.js` stays reliable.
- No runtime dependency on globally installed Letta.

### 2. Otto supervises Letta on launch

On app start (main process):

```txt
~/.otto/config.json     — otto config (no provider secrets)
~/.otto/letta/          — Letta state dir (isolated from dev ~/.letta unless advanced mode)
keychain / secrets.env  — LETTA_API_KEY write-only from Settings
```

- Set `LETTA_CLI_PATH`, `LETTA_*` env from bundled resource path — not user shell.
- Start or attach to bundled engine; health check before renderer marks ready.
- Clean shutdown / restart policy documented (no orphan listeners — reuse 039 observability where landed).

### 3. First-run bootstrap

Until bootstrap completes, Chat stays gated (honest empty/blocked — no mock connected):

1. Ensure Letta engine up
2. Provider auth if required — **write-only** into Letta/keychain via otto Settings form
3. Create or resume default **otto** Letta agent (id persisted in `~/.otto/config.json`)
4. Install otto skills / permission profile / extension hooks as defined in repo
5. `session.initialize()` succeeds → unlock Chat + Sidebar connected truth

Receipt first successful bootstrap (agent id, engine version, mode=embedded — no secrets).

### 4. Provider setup (product wording)

Settings **Connect** / BYOK UI allowed with strict rules:

- Write-only: submit key → Letta/keychain; otto config stores **boolean** `hasProviderKey` only
- Never read key back into renderer; never log key material
- Copy: “Provider auth is managed by the bundled Letta engine.”
- Invalid/missing key → exact blocker string from runner classify path

### 5. Connection modes (Settings)

| Mode | Default | Notes |
|------|---------|-------|
| **Embedded local** | yes | Bundled engine + `~/.otto/letta/` |
| Existing Letta Desktop / CLI | no | Current dev path; explicit opt-in |
| Letta Cloud / remote environment | no | Depends on 077; no silent fallback |
| Self-hosted URL | no | BYOR URL + health check |

Mode switch requires restart or controlled reconnect; receipt mode + base URL (no secrets).

**No silent fallback** from embedded → external or local → cloud.

## Scope

- `electron-builder.yml` — bundle layout, resources, codesign notes
- `letta-runner.ts` — embedded-first CLI resolution; remove Letta.app preference as default
- `config-store.ts` — `connectionMode`, `lettaStateDir`, agent bootstrap ids
- `secret-store.ts` — write-only provider key path
- `main.ts` / lifecycle — start engine, first-run gate
- Settings UI — mode picker + honest readiness (extends 001)
- Onboarding alignment — no “install Letta separately” copy (coordinate 069–073)
- Docs: README product line + AGENTS.md boundary (otto ≠ memory/secret SoR)
- Smoke: Finder launch, minimal `PATH`, disposable agent/conversation

## Out of scope

- Full Cathedral WS transport as default (039 — may follow or parallel; embedded subprocess/WS must share runtime interface)
- Letta Cloud API details (077)
- Memory graph UI (047)
- Paperclip / Discord adapters
- Linux/Windows packaging (mac first; document gap)

## Done when

- [ ] Fresh Mac: drag `otto.app` to Applications → launch → **no prior Letta install** → bootstrap → Chat sends one real turn
- [ ] Bundled engine path used (`cliResolved` true from app resources); no `/Applications/Letta.app` required
- [ ] Provider key saved via Settings never appears in config JSON, logs, or IPC payloads (boolean-only proofs)
- [ ] `~/.otto/letta/` used for embedded mode state
- [ ] Advanced mode: Existing Letta CLI still works when explicitly selected
- [ ] Mode switch does not silently fall back
- [ ] `electron:build` + staging deploy + codesign smoke receipt
- [ ] Reviewer +1

## Verification

```sh
cd /Users/seb/Code/otto
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
bun run --cwd apps/desktop electron:build
bash apps/desktop/scripts/deploy-staging.sh
# manual: clean profile OTTO_HOME=~/.otto-smoke-076 …
# codesign -dv --verbose=4 /Applications/otto-staging.app
```

## Coordination

| Ticket | Relationship |
|--------|----------------|
| 001 | Supersedes dev-shaped external CLI preference as **default**; keeps readiness contract |
| 002 | Real adapter path becomes embedded-first |
| 039 | Transport upgrade must not break embedded lifecycle; share `RuntimeStatus` seam |
| 047 | Block until 076 — memory read assumes stable embedded agent |
| 077 | Cloud remote mode — advanced only, after 076 + 039 |
| 069–073 | Onboarding copy/steps assume one-app flow |

## Blocker log

Leave blank unless blocked.
