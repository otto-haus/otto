# Ship Check — Worker Orchestration

## Spec promise

Main Otto orchestrates ticket workers in worktrees. Workers own bounded execution; Otto owns routing, tracking, review, integration, and escalation.

## Required file contract

- [x] Worker packet template exists.
  - Evidence: `templates/worker-packet.md` — complete template with ticket, objective, owned/shared contracts, constraints, checks, stop conditions, approval gates, receipt requirement.

- [x] Ticket template exists.
  - Evidence: `templates/ticket.yaml` — machine source of truth with status, owner, model, worktree, branch, objective, owned/shared paths, acceptance criteria, checks, stop conditions, approval gates, receipt path, integration notes.

- [x] Worktree policy exists.
  - Evidence: `docs/autonomy.md` §"Worktree policy" (lines 143–158) — every feature/ticket uses a worktree, layout convention, rules for isolation, one-per-ticket, owned-paths-only, shared-contract coordination, receipts before integration.

- [x] Integration/merge policy exists.
  - Evidence: `docs/autonomy.md` §"Merge policy" (lines 122–141) — conservative start (autonomous PR opening, approval-required merge), future safe-auto-merge criteria documented (risk_class, owned_paths_only, tests_pass, no_secret_scan, no Standards changes, receipt_present, main protected policy).

- [x] Receipt requirement exists.
  - Evidence: `docs/autonomy.md` §"Receipts" (lines 209–214), `templates/autonomy-receipt.md`, and `templates/worker-packet.md` §"Receipt required" — every autonomous ticket run must write a receipt (ticket, worker, model, worktree, branch, time, objective, actions, checks, files changed, approvals needed, result, next action). "No receipt → no progress."

## Required runtime behavior

- [~] Can create or document worker-ready tickets.
  - Partial + Gap: Ticketcraft (`/ticket compile`) is spec + documented workflow (lines 75–86 in `docs/ticketcraft.md`), but NOT implemented as a runtime command. Ticketcraft spec says it should turn "messy work → ticket.yaml + worker packet", but it remains manual or propose-only. Evidence: `docs/ticketcraft.md` proposes surface (`/ticket compile`, `/ticket assign`, `/ticket status`, `/ticket review`, `/ticket close`), but only templates + docs exist. The autonomy.md lines 44–57 describe the desired workflow, but step 3 ("create worker conversations") through step 10 ("surface only consequential gates") have no orchestrator code. **Gap:** No implementation; orchestration is manual via Claude in worktrees, not automated via `/ticket` command.

- [~] Can track worker status.
  - Partial + Gap: Ticket state template (`templates/ticket.yaml`) defines a status field (proposed | active | blocked | review | merged | cancelled), and `docs/autonomy.md` §"Dashboard" (lines 199–207) specifies what should be shown (active tickets, workers, worktrees, branches, PRs, checks, receipts, blockers, pending approvals, next autonomous action). **Gap:** No dashboard UI or state-tracking runtime. Worker status is visible only by reading `ticket.yaml` files on disk and inspecting worktree state manually. The autonomy settings spec (lines 180–195) defines what *could* be exposed (worker_creation, worktree_creation, pr_creation, safe_auto_merge, retry_failed_checks, rebase_worker_branches, cleanup_merged_worktrees, model_routing, max_parallel_workers, require_receipts) but this is not implemented as Otto behavior — it is a configuration shape.

- [~] Can integrate/review worker results.
  - Partial + Gap: Ticket template includes `integration_notes` field (line 44 in `templates/ticket.yaml`) and `docs/ticketcraft.md` proposes a `/ticket review` command ("audit receipt AC-by-AC before integration"). Receipt template exists (`templates/autonomy-receipt.md`). **Gap:** No `/ticket review` command or merge orchestrator. Integration is manual: worker writes a receipt file, human reads it, decides on merge. The merge policy (autonomy.md §"Merge policy") describes a conservative start (approval required for protected-main merge) but no orchestrator enforces or automates this. Worktree cleanup after merge is listed as an allowed autonomous action (autonomy.md line 90) but is not implemented.

- [~] Escalates consequential doors.
  - Partial + Gap: Autonomy.md §"What must escalate to Approvals" (lines 76–87) enumerates doors (send/post/publish, spend, deploy, merge protected main, delete, credential/security, customer/live-data, company commitment, Standards/Core Principles change, recurring Routine activation, permission expansion, ambiguous consequence). Approval types are defined in `packages/core/src/types.ts` (ApprovalRequirement enum, APPROVAL_FLOOR). The worker-packet.md §"Approval gates" (lines 40–43) lists gates the worker must not self-approve. **Gap:** Escalation is manual. No live ticketcraft runtime means no automated gate detection. A worker writing a receipt cannot trigger an approval request via `/ticket` — it must be done manually. Charter's gates layer (extension/charter.ts) is a reference implementation of gate enforcement, but there is no corresponding Ticketcraft gate enforcement because there is no Ticketcraft command.

## v0.1 status guidance

If orchestration is manual via Claude/worktrees, mark Manual/Partial, not fully runtime-shipped. ✓ Assessment: orchestration IS manual. Templates + docs exist; no `Main Otto` command to orchestrate. Ticketcraft is "spec + templates in v0.1" per autonomy.md receipt.

## Status legend

- `[x]` Done — evidence path required
- `[~]` Partial / prototype / proposed — evidence + gap required
- `[ ]` Not done — missing work required

## Ship decision

**Defer**

### Rationale

Worker orchestration in v0.1 is a **documented model + template layer, not a shipping runtime**. All five file-contract requirements are met (worker-packet, ticket, worktree policy, merge policy, receipt requirement). The demo shows the concept and the autonomy.md document is comprehensive. However, none of the four runtime behaviors are automated:

1. **Create tickets:** Manual (no `/ticket compile` command).
2. **Track worker status:** Manual (no dashboard, no state monitoring beyond reading files).
3. **Integrate/review results:** Manual (no `/ticket review` or merge orchestrator; Charter has gates; Ticketcraft does not).
4. **Escalate doors:** Manual (approval gates are not wired to ticket commands because ticket commands do not exist).

**In v0.1, the orchestrator is Claude (human-in-the-loop in Letta conversations), not Main Otto (a persistent system). The spec is proven and the template layer is complete; the runtime is not.**

### Path to Ship

To ship worker orchestration as a core feature, implement:
1. `/ticket` command with `compile`, `assign`, `status`, `review`, `close` subcommands (Letta Code extension).
2. Autonomy dashboard or agent-visible state interface for tracking active tickets, workers, worktrees, and pending approvals.
3. Worktree merge orchestrator (automated safe-merge detection, cleanup).
4. Approval gate enforcement in Ticketcraft (same overlay as Charter).

These would move the status from Partial (spec + template) to Done (runtime + automation). For v0.2 or later.

---

**Truth rule:** Worker orchestration cannot be run, inspected, or proven as a live system in v0.1. It is a designed, templated, documented model with a manual implementation layer (Claude agents in bounded worktrees). Deferring to v0.2 when the `/ticket` command can be tried and approved by Sebastian.
