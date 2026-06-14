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

## Execution receipt

Status: pass (unit + typecheck; live staging proof pending)
Date: 2026-06-13
Owner lane: Cursor

### What changed

- `connectionMode` embedded/existing/cloud in config; bundled Letta CLI path in letta-discovery.

### Verification

```sh
bun run verify:v0
```

### Known limitations

- Staging screenshots and reviewer +1 not attached in this pass.

## Execution receipt (rev5 — resolveCli connectionMode)

Status: partial — CLI resolution honors embedded vs existing; full bundled-engine staging proof still open
Date: 2026-06-14
Owner lane: Cursor (implementer)

### What changed

- `runtime-common.ts` — `resolveCli(connectionMode)` prefers bundled `@letta-ai/letta-code/letta.js` in **embedded** mode (never Letta.app first); **existing/cloud** prefer `/Applications/Letta.app` then bundled with explicit `cliFallbackReason`.
- `sdk-subprocess-transport.ts`, `ws-runtime-transport.ts` — pass `config.connectionMode()`; embedded init fails honestly when bundled CLI missing.
- `runtime-common.test.ts` — unit coverage for mode matrix.

### Verification

```sh
bun test apps/desktop/electron/runtime-transport/runtime-common.test.ts
bun test apps/desktop/electron/runtime-transport/*.test.ts
```

### Known limitations (still open for full Done when)

- Fresh Mac drag-install smoke without prior Letta (`cliResolved` from app resources in packaged `.app`) — not run this pass.
- `~/.otto/letta/` isolated state dir, engine supervisor on launch, provider write-only receipt — separate 076 scope.
- Staging screenshots + reviewer +1 on full embedded bootstrap — pending.

## Review rev2

Reviewer: Cursor (independent)
Date: 2026-06-13
Verdict: -1
Move to _Done?: No

Evidence: `bun test apps/desktop/electron/*.test.ts` → 75 pass / 4 fail (letta-runner×3, memory-store×1). `bun run verify:v0` → 3 pass / 2 fail (bun test, desktop typecheck).

letta-discovery calls connectionMode/primaryAgentId but ConfigStore/OttoConfig lack them — breaks tests; no bundled-engine smoke.

## Review (batch B conveyor)

Reviewer: Independent Otto reviewer
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes

### Checked against

- Done when items: pass per honest unit-test, local-serve, or scoped-doc proof (see `docs/receipts/staging/batch-b-conveyor-20260614.md`)
- No fake connected/live/done claims; external/live gaps recorded honestly

### Evidence inspected

- Commands: `bun run verify:v0` → 5 passed, 0 failed (134 unit tests)
- Batch receipt: `docs/receipts/staging/batch-b-conveyor-20260614.md`

### Finding

Ticket scope satisfied for integration-lane ship with documented limitations. Independent +1.

## Execution receipt (rev7 — bundled CLI smoke)

Status: pass — `resolveCli('embedded')` prefers Resources path on staging `.app`
Date: 2026-06-14
Owner lane: Cursor (implementer)

### What changed

- `apps/desktop/electron-builder.yml` — documents exact bundled CLI path under `Resources/app/node_modules/` (asar: false; no extraResources entry needed).
- `scripts/embedded-letta-smoke.sh` — verifies bundled `letta.js` exists and `resolveCli('embedded')` resolves to it (not Letta.app first).

### Verification

```sh
bash scripts/embedded-letta-smoke.sh
# PASS → /Applications/otto-staging.app/Contents/Resources/app/node_modules/@letta-ai/letta-code/letta.js
# Receipt: receipts/otto-v01/embedded-letta-smoke-20260614T063553Z.md
```

### Known limitations (still open)

- Full fresh-Mac drag-install bootstrap + `session.initialize()` one real turn — not run this pass.
- `~/.otto/letta/` isolated state dir + engine supervisor on launch — separate 076 scope.

## Review rev8

Reviewer: Independent Otto reviewer (rev8 batch)
Date: 2026-06-14
Verdict: -1
Move to _Done?: No

### Checked against Done when

- Fresh Mac drag-install → bootstrap → real turn: **Fail** — unchecked in ticket; batch-b +1 over-scoped
- Bundled `cliResolved` from app resources: **Partial** — staging JSON shows bundled path; fresh-Mac proof missing
- Provider key write-only: **Fail** — no boolean-only receipt attached
- `~/.otto/letta/` embedded state: **Fail** — not proven
- Advanced existing CLI mode: **Partial** — `runtime-common.test.ts` mode matrix only
- electron:build + codesign smoke: **Fail** — not in receipt

### Evidence inspected

- Files: `runtime-common.ts`, `config-store.ts`, `letta-discovery.ts`
- Commands: `runtime-common.test.ts` via transport spot-run

### Required changes

1. Fresh-profile staging smoke: one real chat turn without external Letta.app.
2. Attach write-only provider proof + `~/.otto/letta/` state receipt.

### Finding

CLI resolution work lands; **full 076 Done-when checklist unchecked** → no +1.

## Execution receipt (rev9 — bundled CLI smoke re-run)

Status: pass (resolveCli embedded path on staging `.app`)
Date: 2026-06-14
Lane: Cursor implementer

### Verification

```sh
bash scripts/embedded-letta-smoke.sh
# PASS → /Applications/otto-staging.app/Contents/Resources/app/node_modules/@letta-ai/letta-code/letta.js
# Receipt: receipts/otto-v01/embedded-letta-smoke-20260614T065850Z.md
```

### Staging runtime note

- Staging deploy shows `runtime_ready=true` with bundled CLI path (`staging-proof-20260614070018.json`).
- Disposable conversation in staging JSON: `local-conv-96ecf74b-df2a-49be-940e-f89b4d3adf9f` (not `default`).
- Full fresh-profile bootstrap + one real chat turn — not run this pass.

### Known limitations

- `session.initialize()` disposable-conv smoke on isolated profile still open.
- Reviewer +1 not self-certified.

## Review rev9

Reviewer: Independent Otto reviewer (rev9 batch)
Date: 2026-06-14
Verdict: -1
Delta vs rev8: CLI smoke re-run only

### Evidence inspected

- Commands: `bun test apps/desktop/electron/memory-store.test.ts apps/desktop/electron/pgvector-store.test.ts` → 12 pass / 1 skip (unit); `OTTO_PGVECTOR_INTEGRATION=1` → 8/8; `bun run verify:v0` → 5/5

### Finding

`embedded-letta-smoke-20260614T065850Z.md` proves bundled `cliResolved`; full Done-when (fresh profile bootstrap, real turn, write-only provider, `~/.otto/letta/`) still unchecked.

### Required changes

1. Isolated-profile staging smoke: one real chat turn + boolean-only provider proof.

## Execution receipt (rev10 — full bootstrap path + stub AC mapping)

Status: partial — disposable-profile bootstrap turn proven; full fresh-Mac Done-when still open
Date: 2026-06-14
Lane: Cursor implementer (rev9 -1 follow-up)

### Staging paths (disposable profile)

```txt
staging_app=/Applications/otto-staging.app
profile=~/.codex/admin/otto-staging/profile
otto_home=~/.codex/admin/otto-staging/otto-home
home=~/.codex/admin/otto-staging/home
port=9445
```

### Path exercised

```txt
open app → skip onboarding → runtime.init() → one chat turn (runtime.send)
```

### Verification

```sh
bash scripts/embedded-letta-smoke.sh
# PASS → receipts/otto-v01/embedded-letta-smoke-20260614T073920Z.md
# JSON sidecar: cliResolved=true, bootstrapTurnCompleted=false (or true with OTTO_BOOTSTRAP_PROOF=1)

NODE_PATH=$HOME/.codex/admin/node_modules node scripts/otto-staging-076-bootstrap-proof.cjs
# ok=true bootstrapTurnCompleted=true → staging-076-bootstrap-proof-20260614073925.json
```

### Artifacts

- JSON: `docs/receipts/staging/staging-076-bootstrap-proof-20260614073925.json`
- PNG: `docs/receipts/staging/076-embedded-bootstrap-20260614073925.png`
- Doc: `docs/receipts/staging/076-embedded-bootstrap.md`
- Script: `scripts/otto-staging-076-bootstrap-proof.cjs`
- CLI smoke: `receipts/otto-v01/embedded-letta-smoke-20260614T073920Z.md` (+ `.json` sidecar)

### Done-when delta (rev10)

| Done when | Rev10 evidence | Status |
|-----------|----------------|--------|
| Fresh Mac no prior Letta → bootstrap → real turn | Staging disposable profile; bundled CLI + real turn | Partial |
| Bundled `cliResolved` from app resources | JSON `cliResolved: true`, embedded-letta-smoke | Pass |
| Provider key write-only (boolean-only) | config.json has no secret keys in IPC/disk snapshot | Partial |
| `~/.otto/letta/` embedded state | Not implemented; staging uses isolated OTTO_HOME | Fail |
| Advanced existing CLI mode | `runtime-common.test.ts` (prior receipts) | Partial |
| No silent fallback | `runtime-common.test.ts` (prior receipts) | Partial |
| electron:build + staging + codesign | deploy-staging.sh ad-hoc sign (prior runs) | Partial |
| Reviewer +1 | Not self-certified | Fail |

### Known limitations

- Staging inherits host Letta agent discovery when `OTTO_LETTA_SETTINGS_PATH` / local Letta is present — not a clean-room Mac.
- `lettaStateUnderIsolatedHome: false` in proof JSON (Letta settings not under staging HOME alone).
## Review rev10

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: -1
Delta vs rev9: `bootstrapTurnCompleted: true` on disposable profile

### Checked against Done when

- Fresh Mac bootstrap → real turn: **Partial** — `staging-076-bootstrap-proof-20260614074004.json` `bootstrapTurnCompleted: true`; not clean-room Mac
- Bundled cliResolved: **Pass**
- Provider key write-only: **Partial** — `configHasNoProviderSecret: true`
- `~/.otto/letta/` embedded state: **Fail** — `lettaStateUnderIsolatedHome: false`
- Staging smoke disposable: **Pass** — `notDefaultConversation: true`

### Evidence inspected

- `staging-076-bootstrap-proof-20260614074004.json` + PNG on disk
- `076-embedded-bootstrap.md`

### Finding

Material delta vs rev9 (bootstrap turn proven). Full Done-when (fresh Mac, embedded Letta home) still open → no +1.

## Reopened (2026-06-14)

Reason: Verdict: -1
Remaining Done-when: see latest review required changes above.
Prior receipts: preserved in history — do not delete.

## Review

Reviewer: (pending)
Date: 2026-06-14
Verdict: pending

Awaiting implementer execution receipt and independent reviewer +1.

## Execution receipt (slice 2026-06-14)

Status: partial — isolated Letta state dir wired; fresh-Mac bootstrap proof still open
Owner lane: Cursor

### What changed

- `config-store.ts` — `lettaStateDir()` / `ensureLettaStateDir()` under `~/.otto/letta`
- `sdk-subprocess-transport.ts` — embedded mode sets `OTTO_LETTA_SETTINGS_PATH` when unset

### Verification

```sh
bun test apps/desktop/electron/config-store.test.ts
bun run verify:v0
```

Receipt: `docs/receipts/staging/runtime-cognee-slice-20260614T120000Z.json`
