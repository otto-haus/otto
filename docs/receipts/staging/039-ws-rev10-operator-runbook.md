# 039 — WS runtime operator runbook (rev10)

**Date:** 2026-06-14  
**Git:** `fff0152`  
**Default transport:** `sdk` (unchanged)  
**Ticket:** `planning/hq-tickets/_Done/039-cathedral-ws-runtime-transport.md`

## Verdict

**Blocked on `LETTA_API_KEY`.** Unit and scorecard static checks pass. Live BYOR disposable smoke cannot run in this environment.

## Rev10 verification (ran)

```sh
cd /Users/seb/Code/otto
bash scripts/ws-promotion-scorecard.sh
bun test ./apps/desktop/electron/runtime-transport/*.test.ts
```

| Check | Result | Evidence |
|-------|--------|----------|
| typecheck | pass | `/tmp/otto-scorecard-typecheck.log` |
| electron:typecheck | pass | `/tmp/otto-scorecard-electron_typecheck.log` |
| transport unit | pass (21/21) | `/tmp/otto-scorecard-transport_unit.log` |
| verify:v0 | pass | `/tmp/otto-scorecard-verify_v0.log` |
| smoke_cli_sdk/ws/auto | skip | `LETTA_AGENT_ID` not set |
| staging_capture | skip | `OTTO_RUN_STAGING_CAPTURE` not set |
| Promotion dimensions | pending | `docs/receipts/staging/039-scorecard-template.json` |

Machine-readable: [`039-scorecard-template.json`](./039-scorecard-template.json) (`runId: 20260614T073922Z`)

## Blocker

`LETTA_API_KEY` is **not** present in the task environment. Prior smoke failed with `LETTA_API_KEY not found` when spawning `letta remote --backend local` (`039-ws-disposable-smoke-20260614064452.json`).

## Sebastian — when `LETTA_API_KEY` is set

### Prerequisites

```sh
test -n "$LETTA_API_KEY" && echo "LETTA_API_KEY present"
export LETTA_AGENT_ID="<your-local-agent-id>"
export OTTO_SMOKE=1
```

Staging only. Never touch `/Applications/otto.app`. Never use `conversation=default`.

### 1. Unit + scorecard (safe anytime)

```sh
cd /Users/seb/Code/otto
bash scripts/ws-promotion-scorecard.sh
bun test ./apps/desktop/electron/runtime-transport/*.test.ts
```

### 2. Headless Otto WS disposable smoke

```sh
cd /Users/seb/Code/otto
export OTTO_SMOKE=1
export OTTO_RUNTIME_TRANSPORT=ws
export LETTA_API_KEY="<set-in-shell-not-in-receipt>"
export OTTO_AGENT_ID="$LETTA_AGENT_ID"
bun scripts/ws-disposable-smoke.ts
```

**Expect on success:** receipt under `docs/receipts/staging/039-ws-disposable-smoke-<timestamp>.json`, trace JSONL under `$OTTO_HOME/runs/`, `initStatus.ready=true`.

**Expect on failure:** honest `ok:false` JSON with `code` and redacted error (no secret values in artifact).

### 3. SDK / auto comparison smokes

```sh
OTTO_RUNTIME_TRANSPORT=sdk OTTO_SMOKE=1 task smoke:cli
OTTO_RUNTIME_TRANSPORT=ws OTTO_SMOKE=1 task smoke:cli
OTTO_RUNTIME_TRANSPORT=auto OTTO_SMOKE=1 task smoke:cli
```

### 4. Staging UI proof (optional)

```sh
bash apps/desktop/scripts/deploy-staging.sh
export OTTO_RUN_STAGING_CAPTURE=1
node scripts/otto-staging-proof-capture.cjs
```

### 5. Fill promotion scorecard

After live WS smoke succeeds, update `docs/receipts/staging/039-ws-promotion-scorecard.md` and `039-scorecard-template.json` dimensions with trace/receipt paths and latency.

Default transport stays **`sdk`** until reviewer +1 on filled scorecard.

### 6. Reviewer gate

Reviewer must reject if:

- `connected` inferred without runtime events
- smoke touches `conversation=default`
- scorecard rows lack trace/receipt paths
- default flips to `auto`/WS before scorecard passes

## Rev10 blocker artifact

Live smoke skipped — `LETTA_API_KEY` absent. See [`039-ws-disposable-smoke-rev9-blocker.json`](./039-ws-disposable-smoke-rev9-blocker.json).
