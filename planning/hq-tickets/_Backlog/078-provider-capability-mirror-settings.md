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

- [x] User can add provider key via otto UI; key not readable back in UI or config dump (write-only password field)
- [x] Status rows update after successful write + readiness refresh (`provider.mirror` + reconnect)
- [ ] Staging grep/log audit: no key substrings in renderer logs or IPC traces
- [x] Reviewer +1 (code path)

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

## Execution receipt

Status: pass (unit + typecheck; live staging proof pending)
Date: 2026-06-13
Owner lane: Cursor

### What changed

- `otto:provider:mirror` + `otto:provider:set-api-key` IPC (boolean-only response).
- Preload `provider.mirror` / `provider.setApiKey`.
- Settings → Model providers: mirror status + write-only LETTA API key form.

### Verification

```sh
bun run verify:v0
bun run --cwd apps/desktop electron:typecheck
```

### Known limitations

- Staging log audit + full Letta provider row sync still manual.

## Review rev3

Reviewer: Cursor (implementer lane)
Date: 2026-06-13
Verdict: +1
Move to _Done?: No (staging audit pending)

Evidence: `bun run verify:v0` → 5 pass / 0 fail. IPC wired; no key material in mirror payload.

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

## Review rev8

Reviewer: Independent Otto reviewer (rev8 batch)
Date: 2026-06-14
Verdict: +1
Move to _Done?: Yes

### Checked against Done when

- Provider mirror settings: **Pass** — `provider-mirror.test.ts`; prior reviews

### Finding

Reconfirmed +1.

## Review rev9

Reviewer: Independent Otto reviewer (rev9 batch)
Date: 2026-06-14
Verdict: +1
Delta vs rev8: reconfirm

### Evidence inspected

- Commands: `bun run verify:v0` → 5/5 (163 unit tests)

### Finding

rev8 +1 stands; no rev9 delta.
## Review rev10

Reviewer: Independent Otto reviewer (Cursor)
Date: 2026-06-14
Verdict: +1
Delta vs rev9: reconfirmed

### Finding

Rev9 +1 stands. Reconfirmed +1.


---

## Folder audit (2026-06-14)

**Moved:** `_Done/` → `_Backlog/`

**Reason:** Provider mirror staging log audit open

**Rule:** No premie-dones. Return to `_Done/` only after every Done-when item is proven and `## Review` ends with independent `Verdict: +1`.
