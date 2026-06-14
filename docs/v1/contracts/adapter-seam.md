# Otto v1 — Adapter seam

External systems (Intake, Discord, Paperclip, etc.) connect **below** Otto's authority model. They may supply inputs; only Otto ratifies future behavior.

## What adapters may return

```txt
context        — read-only background (notes, exports, task state, channel messages)
work_state     — external task/run status snapshots (non-authoritative)
artifacts      — files, links, screenshots, structured payloads
proposals      — candidate Curation proposals (never applied directly)
```

Adapters must not write Standards, Practices, Routines, or Letta memory directly.

## What Otto alone decides

```txt
what becomes future behavior
```

Ratification path:

```txt
adapter/user/otto → CurationProposal (status: proposed)
                 → classify (reversibility, scope, required_gate)
                 → decide (accept | reject | defer) + decision receipt
                 → accept → canon apply (otto_ratified guardrail)
```

Implementation anchors:

- `CurationProposal.created_by`: `user | otto | adapter`
- `ProposalStore.decide()` — sole canon mutation path for proposals
- `AutonomyPolicy` + `evaluateAction()` — consequential doors require approval
- Receipt writer — success, blocked, and failed runs are durable

## Connector rules (v1)

- No adapter required for first launch.
- Missing adapter state is graceful (no fake connected).
- Read-only import first; scoped writes require config + receipts.
- Parked HQ tickets (`019`–`022`, `074`–`075`) implement connectors; they do not change this seam.
- **Paperclip:** work plane only. Read-only import first (`021`); UI slice (`074`); task create (`022`) and status feedback (`075`) require approval doors. Paperclip status is never otto Done.

## Exemplar: Cognee (recall adapter)

**Cognee** (**040**) is the reference implementation for a **derived recall** adapter under Knowledge — not a parallel memory system.

| Return type | Cognee usage |
|-------------|--------------|
| `context` | Entity/relationship recall + cited passages |
| `artifacts` | Graph snapshots (non-authoritative exports) |
| `proposals` | Graph-derived Curation candidates only |

**Cognee MUST NOT:** mutate Standards/Practices/Routines/charters/tickets, write Letta memory, replace `knowledge/ai-frontier/` canon, or auto-enable cloud without config + receipt.

Full contract: [`docs/cognee.md`](../../cognee.md).

---

## Done test for new adapters

> Can this system import context and emit proposals without bypassing curation, autonomy, or receipts?

If yes, the adapter fits the seam.
