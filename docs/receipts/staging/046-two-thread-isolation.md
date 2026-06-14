# 046 — Two-thread isolation (staging rev7)

Date: 2026-06-14  
App: `/Applications/otto-staging.app`  
Proof JSON: `staging-rev7-proof-20260614064649.json`, `046-two-thread-isolation.json`

## Runtime

```txt
runtime_ready=true
session_mode=smoke
conversation_id=local-conv-0f1fc871-593c-4704-bc97-9782c660c555  # not default
letta_base_url=http://127.0.0.1:51398
```

## Procedure (automated CDP)

1. `runtime.init()` on disposable smoke conversation.
2. Create threads **046-alpha-thread** and **046-beta-thread** via `otto.threads.create`.
3. Inject distinct messages into per-thread localStorage keys (`otto.chat.messages.<threadId>.v1`).
4. Switch active thread; verify visible transcript matches injected text only.

## Results

| Check | Result |
|-------|--------|
| Two threads in index | Pass — alpha + beta IDs in sidebar |
| Distinct message bodies | Pass — `046-alpha: isolated message A` / `046-beta: isolated message B` |
| Switch isolation | Pass — `isolationOk: true` |
| Screenshot | `046-sidebar-thread-list.png` |

## Honest limits

- Messages injected via localStorage for deterministic isolation proof; not full Letta send/receive per thread on SDK path.
- Per-thread `conversationId` isolation strongest on WS transport (documented in ticket).

## Commands

```sh
bash apps/desktop/scripts/deploy-staging.sh
NODE_PATH=$HOME/.codex/admin/node_modules \
  OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
  OTTO_GIT_HEAD=$(git rev-parse --short HEAD) \
  node scripts/otto-staging-rev7-proof.cjs
```
