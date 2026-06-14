# 042 — Cognee MCP Recall Bridge

Owner: Cursor
Priority: P1
Depends on: 041
Release bucket: vNext knowledge

## Outcome

Agents working in Otto (Letta Code / desktop runtime) can **recall** from local Cognee through a documented MCP bridge — **read-first**, approval-gated for writes — without custom glue in every session.

When done:

```txt
Cognee MCP server  → configured for Otto dev/staging
Letta/agent config → can list/read Cognee tools when OTTO_COGNEE_ENABLED=1
Otto               → records recall receipts for material queries (optional v1: log-only)
Default posture    → recall allowed; mutate/index tools require explicit enable + gate
```

Aligns with Cognee marketing integration path: Claude Code · Codex · Cursor · MCP.

## Why this matters

Recall is the product promise: "memory your agents can recall across sessions." Otto already has Letta memory for earned lessons and files for truth. Cognee fills **relational recall** (who connected to what, which receipt cites which charter) without merging into Letta.

MCP is the lowest-coupling integration surface for v1.

## Source anchors

- Local home: 041, `scripts/cognee-home.sh`, `docs/cognee.md`
- Runtime / MCP patterns: Letta Code MCP docs (verify at implementation)
- Autonomy gates: `autonomy/policy.yaml`, `AutonomyStore.evaluateAction()`
- Permission modal gap: Chat must not deadlock on tool gates (coordinate with craft punchlist; WS 039 may improve control path)

## Architecture target

### 1. MCP configuration artifact

Add repo-tracked config template (not secrets), e.g.:

```txt
config/cognee-mcp.template.json
docs/cognee.md § MCP setup
```

Document:

- how to register Cognee MCP in Letta Code for Otto staging
- required env vars (`OTTO_COGNEE_BASE_URL`, etc.)
- read vs write tool allowlist

### 2. Tool posture (v1)

**Allow by default (when Cognee ready)**

- search / recall / read graph context tools (exact names from Cognee MCP — verify upstream)

**Gate or deny by default**

- ingest / remember / delete / admin tools
- any tool that mutates graph without an Otto capture receipt (043)

Autonomy mapping example:

```txt
cognee.recall     → safe zone (internal read)
cognee.capture    → door (requires approval or 043 batch job)
cognee.delete     → denied in v1
```

### 3. Otto recall receipt (thin)

When main process observes a recall (optional hook via logging wrapper or manual smoke only in v1):

```json
{
  "kind": "cognee_recall",
  "query": "...",
  "resultCount": 3,
  "citations": ["receipts/...", "charters/..."],
  "at": "ISO8601"
}
```

Store under `receipts/cognee/recall/`. Full automation can follow in 043/044.

### 4. Smoke path

Disposable Letta conversation (never `default`):

```txt
enable Cognee → MCP connected → agent asks one recall question → cited context returned → receipt/log
```

## Scope

- Documented MCP setup for local Cognee + Otto staging
- Config template + skill update (`skill/cognee/SKILL.md`)
- Autonomy policy entries for Cognee tool classes
- Smoke script or documented manual smoke with receipt template
- Tests for policy classification of cognee.* actions (unit level)

## Out of scope

- Bulk capture pipeline (043)
- Desktop graph UI (044)
- Embedding Cognee MCP inside Electron binary
- Cognee Cloud remote MCP
- Auto-indexing entire repo on every boot

## Done when

- With Cognee **disabled**: MCP docs state clearly "do not register" or tools fail closed.
- With Cognee **ready**: staging smoke shows at least one successful recall via MCP in a disposable conversation.
- Write/mutate Cognee tools are not silently allowed — policy or config denies by default.
- `docs/cognee.md` includes copy-paste MCP setup for Letta Code / Cursor-compatible clients.
- Recall smoke receipt exists mapping query → citations.
- Autonomy unit tests cover new action types.
- No smoke uses live `conversation=default`.

## Verification

```sh
cd /Users/seb/Code/otto
bun run --cwd apps/desktop typecheck
bun test ./apps/desktop/electron/*.test.ts
bun test ./apps/desktop/electron/autonomy-store.test.ts

# Manual / smoke (disposable conv)
OTTO_COGNEE_ENABLED=1 OTTO_SMOKE=1 task smoke:cli
# + documented MCP recall steps in execution receipt
```

## Blocker log

Leave blank unless blocked.
