# Managed cloud runtimes — contract

**Status:** proposed (2026-06-14)  
**Issue:** [#330](https://github.com/otto-haus/otto/issues/330)  
**Related:** [`agent-control-plane-spec.md`](agent-control-plane-spec.md) (**092**), [`otto-web-spec.md`](otto-web-spec.md), [`runtime-transport.md`](../runtime-transport.md), [`autonomy-policy.yaml`](contracts/autonomy-policy.yaml)

---

## Outcome

Define how otto agents run in **managed cloud** environments without losing the trust guarantees that desktop otto enforces locally: explicit approvals, honest receipts, boolean-only secrets, and no silent mode escalation.

```txt
Desktop otto  = command station (default, local trust boundary)
Managed cloud = optional execution surface when the operator is away
Letta Cloud   = agent memory + remote env broker (external SoR)
Otto Cloud    = governance layer — queue, approvals, receipts, leases (future)
```

This contract is **spec-only** for #330. Implementation tickets: **077**, **086**, **092**–**099**.

---

## 1. Managed runtime shape

### Runtime classes

| Class | Where it runs | When | Ticket |
|-------|---------------|------|--------|
| **embeddedLocal** | Bundled Letta inside `otto.app` | Default desktop | **076** |
| **existingLetta** | Operator's local Letta.app / CLI | Advanced attach | — |
| **managedRemote** | VM/container running `letta server --env-name <name>` | Away / always-on tools | **086** |
| **cloudRemote** | Letta Cloud remote client (env list + WS) | Explicit opt-in | **077** |
| **selfHosted** | Operator BYOR URL | Advanced | **039** |

**Invariant:** `auto` and default connection paths never escalate to managed cloud. Mode selection is operator-visible and receipted on connect/disconnect.

### Sandbox boundary

Managed remote environments are **outbound-only** to Letta Cloud:

- No inbound ports, reverse proxy, or public domain on the VM.
- Filesystem and repo checkout live on a **persistent volume** scoped to one workspace.
- Tool execution stays inside the Letta remote env sandbox; otto does not expose raw shell over HTTP.
- One primary agent per workspace unless advanced isolation is explicitly configured (**093**).

### Tool execution policy

| Zone | Desktop today | Managed cloud |
|------|---------------|-----------------|
| **green** (reversible local) | Autonomous — tests, drafts, worktrees | Same classification via `autonomy-policy.yaml` |
| **yellow** (prompt once) | One-time confirm | Cloud approval record + optional Letta HITL |
| **red** (one-way doors) | Explicit approval modal | **Blocked until approval** — no auto-execute |

Tool calls route through the same semantic gate everywhere:

```txt
canUseTool / control_request → classify(action) → allow | prompt | block → receipt
```

Desktop implementation: `otto:permission` IPC (**045**, **298**). Cloud maps to the same decision record in the control-plane ledger (**084**).

---

## 2. Approval / permission model (desktop → cloud)

### Desktop source of truth

| Surface | Mechanism | Record |
|---------|-----------|--------|
| Chat tool gate | `otto:permission` → allow/deny/session/timeout | Turn trace + receipt |
| Autonomy policy | `evaluateAction()` against `autonomy-policy.yaml` | Curation / blocked receipt |
| Charter gates | `charter-gates` overlay on one-way doors | `approvals/<id>.yaml` |
| Curation ratification | `ProposalStore.decide()` | Decision receipt |

### Cloud mapping

| Desktop signal | Cloud equivalent | Owner |
|----------------|------------------|-------|
| `otto:permission` allow/deny | Approval record + queue resume | Otto CP (**084**) |
| `otto:permission` session scope | Scoped lease on runner + tool class | Otto CP (**095**) |
| Permission timeout / abort | Lease expiry + honest blocked state | Otto CP (**098**) |
| Letta `control_request` (remote) | Letta Cloud HITL transport | Letta (external) |
| Autonomy red-zone | Pre-queue block — command never reaches runner | Otto CP |
| Discord / email ping | Notification router | **020**, **087**, **099** |

**Rule:** One gate semantics everywhere — see [`adapter-seam.md`](contracts/adapter-seam.md). Adapters may propose; only otto ratifies.

### Permission round-trip contract

Every managed turn that hits a gated tool must produce:

1. `permission.requested` — tool name, input hash (not secret values), runner id, lease id
2. `permission.resolved` — decision, actor, timestamp
3. Turn continuation or `turn.blocked` with honest reason

Desktop proof: `permission-round-trip.test.ts` (**298**). Cloud proof: same event names in receipt ledger before **086** ships.

---

## 3. Secrets boundary

| Secret class | System of record | otto may | otto must never |
|--------------|------------------|----------|-----------------|
| Provider / model API keys | Letta Cloud / OS keychain | Mirror capability flags write-only (**078**) | Display, log, or export values |
| Letta auth (OAuth / API key) | Letta + platform secret store | Inject at runner start; `hasSecret()` checks only | Store in otto canon or receipts |
| Otto admin / sync tokens | Cloudflare Secrets | Bind to Workers at deploy | Commit to repo or echo in logs |
| Workspace repo tokens | Runner volume / CF Secrets | Scope per lease | Share across workspaces |
| Paperclip / adapter creds | Adapter vault | Connect door only (**021**) | Write to Letta memory |

**Invariants (from AGENTS.md + runtime-transport):**

- Boolean-only logging: `hasSecret('LETTA_API_KEY')` — never print secret values.
- Smoke tests use disposable `OTTO_HOME` and **never** `conversation=default`.
- Audit export includes approval metadata, not secret payloads (**096**).

---

## 4. Observability and receipts

### Required signals per managed run

| Signal | Purpose | Sink |
|--------|---------|------|
| Runner heartbeat | env name, agent id, listener up, lease holder, last turn | Otto CP (**097**) |
| Turn trace | stream deltas, tool calls, permission events | `traces/` + cloud index |
| Receipt | success / blocked / failed with proof path | Receipt ledger (**084**) |
| Queue position | command id, priority, cancel/retry state | Command queue (**094**) |
| Cost note | platform + estimated monthly (operator-facing) | Deploy receipt (**086**) |
| Stale runner alert | listener down > threshold | Notification policy (**099**) |

### Receipt minimum fields (managed runtime)

```yaml
kind: managed_runtime_turn
runner_id: <env-name>
agent_id: <letta-agent-id>
conversation_id: <disposable-or-workspace-id>  # never "default" in smoke
transport_mode: managedRemote | cloudRemote
permission_events: [<requested>, <resolved>]
outcome: success | blocked | failed
proof: <trace path or cloud blob id>
```

### Logs

- Structured JSONL on runner; indexed summaries in Otto Cloud — not raw Letta memory blocks.
- No provider payloads or secret values in log streams.
- Operator can export audit bundle: receipts, approvals, queue history — **not** memory or keys (**096**).

### Queueing, retries, sleep

| Concern | Policy |
|---------|--------|
| Command queue | Durable intent with idempotency key (**094**) |
| Retries | Exponential backoff; max attempts documented per command class |
| Lease TTL | Exclusive runner slice; expires → re-queue with honest state (**095**) |
| Sleep / background | Letta schedule fires only while `letta server` listener connected; missed fires surfaced honestly (**082**) |
| Replay | No silent duplicate execution after crash — idempotency + lease expiry (**098**) |

---

## 5. Cost controls

- Managed remote is **opt-in per workspace** — no silent provisioning.
- Deploy receipt records platform choice + estimated monthly cost (**086** done-when).
- Runner idle policy: document scale-to-zero vs always-on tradeoff in operator runbook.
- Otto Cloud coordination (Workers, D1, R2) stays separate from VM compute billing.

---

## 6. First prototype path

Minimal proof that preserves desktop trust guarantees:

### Phase A — spec acceptance (#330)

- [x] This contract drafted and cross-linked.
- [ ] Reviewer +1 on GitHub.

### Phase B — local parity proof (existing)

1. Desktop permission round-trip green: `bun scripts/permission-round-trip-smoke.ts` (**298**).
2. Runtime transport doc invariants enforced in code (`runtime-common.ts`, **079**).

### Phase C — first managed slice (recommended sequence)

| Step | Ticket | Deliverable | Proof |
|------|--------|-------------|-------|
| 1 | **085** | Letta env status visible in otto UI | Screenshot + receipt |
| 2 | **086** | One-command VM deploy (`letta server --env-name otto-cloud`) | Env connected < 15m; reboot survives |
| 3 | **077** | Explicit `cloudRemote` mode in Settings | Remote turn + receipt; embedded unaffected |
| 4 | **094** | Command queue schema (local stub → D1) | Enqueue/dequeue receipt |
| 5 | **095** | Execution lease on hosted runner | Lease + heartbeat coupled |
| 6 | **097** | Stale runner detection | Alert when listener down |

**Prototype done test:**

> Operator deploys **086** VM template, connects via explicit **077** mode, sends a gated tool call, approves via cloud + Letta HITL, receives a receipt with permission events and trace link. Embedded local on the same machine is unaffected. Export produces audit bundle without secrets.

---

## Acceptance checklist (#330)

- [x] Managed runtime contract drafted (this doc).
- [x] Approval/permission model mapped from desktop to cloud (§2).
- [x] Secrets boundary defined (§3).
- [x] Observability and receipt requirements defined (§4).
- [x] First prototype path proposed (§6).

---

## References

- [`docs/runtime-transport.md`](../runtime-transport.md) — local transport invariants
- [`docs/v1/agent-control-plane-spec.md`](agent-control-plane-spec.md) — control plane pillars
- [`docs/v1/otto-web-spec.md`](otto-web-spec.md) — Cloudflare + Letta topology
- [`docs/v1/contracts/autonomy-policy.yaml`](contracts/autonomy-policy.yaml) — green/yellow/red zones
- [`planning/hq-tickets/_Parked/077-letta-cloud-remote-mode.md`](../../planning/hq-tickets/_Parked/077-letta-cloud-remote-mode.md)
- [`planning/hq-tickets/_Parked/086-otto-cloud-remote-env-template.md`](../../planning/hq-tickets/_Parked/086-otto-cloud-remote-env-template.md)
- [Letta remote environments](https://docs.letta.com/letta-code/remote/)
