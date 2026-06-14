---
name: cognee
description: Local Cognee graph recall — read-first sidecar; capture and delete require approval.
---

# Cognee skill (local recall)

## Triggers

- cognee, graph recall, relationship context, cross-artifact recall, MCP cognee-local

## When to use

- Relationship recall across indexed Otto files (receipts, precedents, tickets)
- Cited context packs before proposing Curation updates

## When not to use

- Canon edits (Standards, Practices, charters) — files + Curation only
- Letta memory writes — Letta owns runtime memory
- Autonomy policy changes — Otto-owned YAML

## Local setup

```sh
pip install cognee
# venv recommended: ~/.otto/cognee/venv (binary is cognee-cli on 1.1.x)
export OTTO_COGNEE_ENABLED=1
./scripts/cognee-home.sh start
./scripts/cognee-home.sh health
```

MCP template: `config/cognee-mcp.template.json` (HTTP :8001 preferred on cognee 1.1.x; register only when health is ready).

## Autonomy

- `cognee.recall`: green (read-only search/recall)
- `cognee.capture`: yellow (index ingest — receipt required)
- `cognee.delete`: red (explicit approval)

Run `autonomy.evaluateAction` before capture or any mutating MCP tool.
