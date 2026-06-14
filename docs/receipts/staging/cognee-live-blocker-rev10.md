# Cognee live proof — operator runbook (rev10)

**Date:** 2026-06-14  
**Git:** `fff0152`  
**Tickets:** 041, 042, 043, 044  
**Bundle:** [`cognee-rev10-consolidated-20260614T074025Z.json`](./cognee-rev10-consolidated-20260614T074025Z.json)

## Verdict

**Partial.** Disabled/stopped paths and dry-run capture are honest. Loopback `ready` is reachable only via manual uvicorn (~15s startup). Full Done-when (Otto `start`, MCP recall smoke, graph ingest, staging screenshot, `receipts/cognee/otto-041-local-home-smoke-*.json`) remains blocked.

## What rev10 proved (this run)

| Check | Result | Evidence |
|-------|--------|----------|
| `pip install cognee` in documented venv | skip (already installed) | `~/.otto/cognee/venv`, cognee 1.1.2, binary `cognee-cli` |
| `which cognee` | fail | not on PATH; no `cognee` shim unless operator adds one |
| `scripts/cognee-home.sh health` disabled | pass | `status:disabled` |
| `scripts/cognee-home.sh health` enabled, no daemon | pass | `status:stopped` |
| `scripts/cognee-home.sh health` enabled + uvicorn | pass | `status:ready` at `http://127.0.0.1:8000` |
| `scripts/cognee-home.sh start` | fail | `cognee CLI not installed` |
| `scripts/cognee-capture.sh --dry-run` | pass | COUNT 111 |
| `scripts/cognee-capture.sh --apply` | partial | `receipts/cognee/capture/capture-20260614T073953Z.json` (stub ingest) |
| MCP stdio smoke | fail | No `cognee mcp`; upstream HTTP MCP :8001 |
| Recall with citations | fail | No LLM API key; empty graph |
| Unit tests | pass | cognee-store 6/6; autonomy cognee 11/11 |

## Blockers (exact)

1. **CLI name drift** — Otto scripts call `cognee`; pip 1.1.2 installs `cognee-cli` only.
2. **LLM API key** — `cognee-cli remember` / `recall` require a provider key (e.g. `OPENAI_API_KEY`).
3. **MCP transport** — `config/cognee-mcp.template.json` expects stdio `cognee mcp`. Cognee 1.1.x exposes HTTP MCP on **8001** via `cognee-cli -ui`.
4. **Staging screenshot** — Settings → Cognee `ready` PNG not captured this pass.

## Sebastian — steps to unblock live +1

### 1. Venv (already present)

```sh
mkdir -p ~/.otto/cognee
python3 -m venv ~/.otto/cognee/venv
~/.otto/cognee/venv/bin/pip install --upgrade pip cognee
export PATH="$HOME/.otto/cognee/venv/bin:$PATH"
```

### 2. Symlink legacy CLI name (until scripts updated)

```sh
ln -sf ~/.otto/cognee/venv/bin/cognee-cli ~/.otto/cognee/venv/bin/cognee
```

**Scope proposal (not AC rewrite):** Long-term fix is updating `scripts/cognee-home.sh` and `config/cognee-mcp.template.json` for cognee 1.1.x (`cognee-cli`, uvicorn, HTTP MCP).

### 3. Set LLM key for cognify/recall

```sh
export OPENAI_API_KEY="<your-key>"
export ENABLE_BACKEND_ACCESS_CONTROL=false
```

### 4. Start local API (pick one)

**Option A — uvicorn (rev10 verified):**

```sh
mkdir -p ~/.otto/cognee/databases
nohup ~/.otto/cognee/venv/bin/python -m uvicorn cognee.api.client:app \
  --host 127.0.0.1 --port 8000 >> ~/.otto/cognee/cognee-api.log 2>&1 &
sleep 15
export OTTO_COGNEE_ENABLED=1
cd /Users/seb/Code/otto
bash scripts/cognee-home.sh health
```

**Option B — full UI + HTTP MCP:**

```sh
cognee-cli -ui
# API :8000, MCP :8001, UI :3000
```

### 5. Capture + recall smoke

```sh
cd /Users/seb/Code/otto
export OTTO_COGNEE_ENABLED=1
bash scripts/cognee-capture.sh --kinds receipt,precedent --apply
cognee-cli remember standards/precedents/2026-06-13-candor-vs-kindness.md
cognee-cli recall "candor kindness"
```

Expect repo-path citations. Write `receipts/cognee/recall/<id>.json` with query + citations.

### 6. MCP registration (042)

When health is `ready`, register MCP per upstream 1.1.x (HTTP on :8001) or update template after scope proposal. Disposable Letta conversation only — never `conversation=default`.

### 7. Staging smoke receipt (041)

```sh
apps/desktop/scripts/deploy-staging.sh
# open /Applications/otto-staging.app → Settings → General → Cognee → Save & check health
```

Write:

```txt
receipts/cognee/otto-041-local-home-smoke-<timestamp>.json
```

Include `status:ready`, `baseUrl`, screenshot path.

### 8. Reviewer verification

```sh
cd /Users/seb/Code/otto
bun test apps/desktop/electron/cognee-store.test.ts
bun test apps/desktop/electron/autonomy-store.test.ts
OTTO_COGNEE_ENABLED=1 bash scripts/cognee-home.sh health
```

## Rev10 scope note (Execution)

Live `ready` demonstrated with manual uvicorn in this run; Otto `start` and MCP path remain misaligned with cognee 1.1.2. Reviewer -1 on 041–044 stands until steps 2–7 complete with artifacts under `receipts/cognee/`.
