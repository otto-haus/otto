# 041 — Cognee Local Home (Self-Host)

Owner: Cursor
Priority: P1
Depends on: 040
Release bucket: vNext knowledge

## Outcome

Otto can run **Cognee locally** as an optional sidecar — the "Cognee home" on Sebastian's machine — without cloud signup, without touching live Otto, and without pretending Cognee is connected when it is not.

When done:

```txt
Settings → Cognee: disabled | stopped | starting | ready | error
Scripts  → start/stop/health for local Cognee (loopback)
Skill    → skill/cognee/SKILL.md for agents (install, guardrails, recall-only default)
Receipt  → boot/health proof artifact
```

Target reference stack (verify versions during implementation):

```sh
pip install cognee
# local API default ~ localhost:8000 (confirm against current Cognee docs)
```

## Why this matters

Cognee's fastest path ("5 minutes · local · self-host for coding agents") matches Otto v1: local-only, Letta holds runtime keys, Otto holds behavior. This ticket makes Cognee **reachable** before we wire recall (042) or capture (043).

Honest empty state beats fake "graph connected."

## Source anchors

- Contract: `docs/cognee.md` (040)
- Settings patterns: `apps/desktop/src/surfaces/Panes.tsx` (Letta readiness rows)
- Skill pattern: `skill/SKILL.md`, `skill/routine/SKILL.md`
- Staging proof: `apps/desktop/scripts/deploy-staging.sh`, `~/.codex/admin/otto-staging/`
- Cognee quickstart: https://docs.cognee.ai (verify install/run commands at implementation time)

## Architecture target

### 1. Config surface

Environment (document all in `docs/cognee.md`):

```txt
OTTO_COGNEE_ENABLED=0|1          default 0
OTTO_COGNEE_BASE_URL             default http://127.0.0.1:8000
OTTO_COGNEE_AUTO_START=0|1       default 0 (explicit start preferred in v1)
OTTO_COGNEE_PYTHON               optional path to venv python
```

Settings pane (Knowledge or System section):

- toggle enable (does not imply auto-start unless configured)
- base URL (loopback only in v1 — reject non-localhost in UI)
- **Check health** button → `CogneeHealth` result
- last error + last checked timestamp
- link to `docs/cognee.md`

No cloud API key fields in v1.

### 2. Process supervision (minimal)

Electron main or repo script — pick one clear owner:

```txt
scripts/cognee-home.sh start|stop|status|health
```

Requirements:

- idempotent start/stop
- health returns JSON `{ ok, status, baseUrl, error? }`
- never blocks Electron boot if Cognee missing
- logs to `receipts/cognee/` or `~/.otto/cognee/` (document path)

Optional: small Python venv under `~/.otto/cognee/venv` documented in skill; do not commit venv.

### 3. Skill package

Add `skill/cognee/SKILL.md`:

- when to use (relationship recall, cross-session context)
- when not to use (canon edits, routing policy, Letta memory writes)
- local setup steps
- MCP pointer (042)
- approval gates for any write/capture operations

### 4. IPC (read-only v1)

```txt
otto:cognee:health  → CogneeHealth
otto:cognee:start   → optional; gated by OTTO_COGNEE_AUTO_START or explicit user action
otto:cognee:stop
```

Renderer never calls Cognee HTTP directly; main process or script wrapper only.

## Scope

- `scripts/cognee-home.sh` (or equivalent) + README section in `docs/cognee.md`
- Settings UI for Cognee health (honest states)
- IPC handlers + preload exposure mirroring Letta readiness patterns
- `skill/cognee/SKILL.md`
- Unit tests for health URL validation (localhost-only), disabled-by-default, error propagation
- Staging smoke: enable → health check → receipt JSON

## Out of scope

- MCP server registration (042)
- Indexing Otto files (043)
- Knowledge graph pane (044)
- Cognee Cloud / paid tier
- Bundling Cognee inside Electron app binary
- Auto-start on every app launch (unless explicitly configured and receipted)

## Done when

- With Cognee not installed: Settings shows **disabled** or **error** with actionable message — never "ready."
- With Cognee installed and started locally: health returns **ready** against loopback URL.
- Non-localhost base URL is rejected in Settings or IPC with clear error.
- `scripts/cognee-home.sh status` exits 0/1 predictably; documented in ticket receipt.
- Skill file exists and references guardrails from 040.
- Staging smoke receipt: `receipts/cognee/otto-041-local-home-smoke-<timestamp>.json`
- Unit tests pass; desktop typecheck pass.
- No proof touches `/Applications/otto.app`.

## Verification

```sh
cd /Users/seb/Code/otto
git status --short --branch
bun run --cwd apps/desktop typecheck
bun run --cwd apps/desktop electron:typecheck
bun test ./apps/desktop/electron/*.test.ts

# Local Cognee (when installed)
./scripts/cognee-home.sh status
./scripts/cognee-home.sh health

# Staging UI proof
apps/desktop/scripts/deploy-staging.sh
# open /Applications/otto-staging.app → Settings → Cognee health
```

## Blocker log

Leave blank unless blocked.
