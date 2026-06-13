# Autonomy

Autonomy is the operating layer that defines what Vinny may own **without Sebastian
in the loop**. It lets Vinny orchestrate tickets, workers, worktrees, retries, checks,
and integration steps — escalating only consequential doors to Approvals.

## Doctrine

```txt
Vinny owns orchestration.
Workers own bounded execution.
Sebastian owns consequences.

Autonomy owns steps.
Approvals own doors.
```

Core principles:

```txt
Own reversible work. Gate consequential work.
Approve doors, not steps.
Move fast on good judgment.
```

## Product model

```txt
Main Vinny   = orchestrator / judgment / memory / Standards
Ticket worker = temporary executor
Worktree     = isolated build surface
Files        = source of truth
Receipts     = proof
Approvals    = one-way-door ratification
```

One Vinny identity. Many temporary worker conversations. One worktree per ticket.
Workers are **not** persistent identities and never redefine shared meaning.

## Desired workflow

Sebastian → Main Vinny: *"Build Vinny OS."*

Vinny then:

```txt
1. create/update Charter
2. decompose into tickets   (see ticketcraft.md)
3. create worker conversations
4. create worktrees
5. assign bounded packets
6. monitor progress
7. retry / rebase / test when safe
8. review receipts
9. integrate safe branches
10. surface only consequential gates
```

Sebastian sees: dashboard, blockers needing judgment, approval requests, final proof —
**not** every operational step.

## What Autonomy may do without asking

Allowed when reversible / internal and covered by policy:

```txt
create worktrees · create worker conversations · assign tickets
draft specs · write Skills · update docs
run tests · retry failed checks · rebase worker branch
clean stale worktrees after merge · open PRs (if policy allows)
update receipts · choose next operational step
choose between obvious safe next actions
run one-off Routine trials · propose Practices/Routines/Standards changes
```

## What must escalate to Approvals

Always ask before:

```txt
send / post / publish · spend · deploy
merge protected main (unless explicitly marked safe-auto-merge)
destructive delete · credential / security change
customer / live-data access · company commitment
Standards / Core Principles change · recurring Routine activation
permission expansion · public / reputation-bearing action
ambiguous consequence
```

Gates are enforced by the same `charter-gates` overlay used everywhere (see
[`gates.md`](gates.md)): high-stakes/external/irreversible actions force an approval
prompt even in unrestricted mode, and each approval is persisted as a scoped,
time-bound record under `approvals/<id>.yaml`. Approval gates outrank operational
logic — even mid-run, even if "the ticket says so."

## Worker model

A worker is a temporary executor given a bounded packet. It is not Vinny.

Worker packet shape (template: [`../templates/worker-packet.md`](../templates/worker-packet.md)):

```md
# Worker Packet
You are a temporary worker for Vinny OS. You are not Vinny.

## Ticket / Objective / Owned paths / Shared contracts
## Constraints / Checks / Stop conditions / Receipt required
```

## Model routing

Default thesis (configurable, not religious):

```txt
Main Vinny:    strongest reasoning model   (e.g. GPT-5.5 extra-high)
Worker agents: strongest coding/writing model (e.g. Claude Opus 4.8 Max)
```

Routing policy considers: reasoning intensity, coding/writing intensity, cost,
latency, provider ToS, data sensitivity, tool access.

## Merge policy

Start conservative:

```txt
Opening PR:  autonomous
Merging PR:  approval required — unless branch is explicitly marked safe-auto-merge
```

Future `safe-auto-merge` criteria (all must hold):

```txt
risk_class: low
owned_paths_only: true
tests_pass: true
no_secret_scan_findings: true
no Standards/approval changes
receipt_present: true
main protected policy respected
```

## Worktree policy

```txt
Every feature/ticket uses a worktree.
```

Layout (Letta-managed convention used by this repo):

```txt
/Users/seb/Code/vinny-os                         main checkout
/Users/seb/Code/vinny-os/.letta/worktrees/<ticket>   per-ticket build surface
```

Rules: never dirty main checkout for worker tasks · one worktree per ticket ·
owned paths only · shared-contract changes require coordination · receipts before
integration.

## Ticket state

Source of truth per ticket (template: [`../templates/ticket.yaml`](../templates/ticket.yaml)):

```yaml
ticket_id: ticket_practices_core
status: active        # proposed | active | blocked | review | merged | cancelled
owner: worker_001
model: claude-opus-4.8-max
worktree: .letta/worktrees/practices-core
branch: feat/practices-core
objective: ...
owned_paths: [packages/practices/**, docs/practices/**]
shared_paths: [packages/core/**]
requires_approval_for: [shared_contract_change, protected_main_merge]
checks: [bun test, bun run typecheck]
receipt_path: receipts/...
```

## Autonomy settings

Exposed in Vinny OS Desktop:

```yaml
autonomy:
  worker_creation: allowed
  worktree_creation: allowed
  pr_creation: allowed
  safe_auto_merge: disabled
  retry_failed_checks: allowed
  rebase_worker_branches: allowed
  cleanup_merged_worktrees: allowed
  model_routing: automatic
  max_parallel_workers: 3
  require_receipts: true
```

## Dashboard

Autonomy needs a dashboard surfacing:

```txt
Active tickets · Workers · Worktrees · Branches · PRs · Checks
Receipts · Blockers · Pending approvals · Next autonomous action
```

It answers: *What is Vinny managing for me? What needs me? What is safe and already
moving?*

## Receipts

Every autonomous ticket run writes a receipt (template:
[`../templates/autonomy-receipt.md`](../templates/autonomy-receipt.md)) covering ticket,
worker, model, worktree, branch, time, objective, actions taken, checks, files
changed, approvals needed, result, next action. No receipt → no progress.

## Failure patterns

If Sebastian is asked to make a **reversible operational** decision, that is a bug.
Log it and fix the policy, not just the instance:

```yaml
autonomy_failure:
  type: unnecessary_escalation
  question_asked: "Retry PR merge or clean worktrees?"
  why_vinny_should_have_owned_it: "Operational, reversible, no consequence."
  fix: [update autonomy policy, add playbook, improve worker prompt]
```

These fixes flow into Curation as proposals (promote a worker pattern into a Practice,
update routing policy, change worktree default, add safe-auto-merge criteria).

## Channels integration

Channels (Discord v0) may surface blockers, approval requests, longrun status,
"next autonomous action taken", and receipts — but operational choices must not need
Sebastian unless consequential.

## Practice gates (carried over)

A Practice cannot be a loophole. Every `practice.yaml` declares `approval_required_for`,
always including at minimum:

```yaml
approval_required_for:
  - enabling globally
  - external side effects
  - permission expansion
```

By default Practices are **proposed for approval, not silently activated**. Draft-only,
review-only, or planning-only output is always available without enabling anything.

## Non-goals

```txt
no separate persistent Vinny identities
workers never redefine shared meaning
never bypass provider ToS
agents never approve one-way doors
Sebastian never coordinates routine operational steps
never over-ask from low confidence
never hide autonomous actions without receipts
```

## Final principle

```txt
Vinny owns orchestration.
Sebastian owns consequences.
```
