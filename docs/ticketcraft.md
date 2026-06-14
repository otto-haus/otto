# Ticketcraft (`/ticket`)

Ticketcraft is the **ticket compiler**. It does for work what Charter's compiler does
for goals.

```txt
Goalcraft:    messy intent → sharp /goal
Ticketcraft:  messy work   → sharp ticket packet
```

Internal/package name: Ticketcraft. User-facing command: `/ticket`.

It is part of [Autonomy](autonomy.md): compiling sharp, bounded tickets is what lets
Main Otto own orchestration while workers execute.

## Why it matters

```txt
Sebastian gives intent.
Otto compiles tickets.
Workers execute.
Workers launch unbiased review subagents.
Otto integrates only after review proof.
Sebastian sees only doors.
```

The compiler uses Otto's superior local context — repo state, owned vs shared paths,
prior decisions, blockers, tool/runtime constraints — to turn vague work into a
worker-ready packet a temporary executor can run without redefining scope.

## What it produces

A worker-ready ticket:

```txt
Objective
Why
Owned paths
Shared contracts
Non-goals
Acceptance criteria
Checks
Stop conditions
Approval gates
Worktree / branch
Receipt requirements
Integration notes
```

Two faces, like Charter:

- `ticket.yaml` — machine source of truth (status, owner, model, owned/shared paths,
  approval gates, checks, receipt path). Schema: [`../templates/ticket.yaml`](../templates/ticket.yaml).
- worker packet (`.md`) — the human/worker render handed to a temporary executor.
  Template: [`../templates/worker-packet.md`](../templates/worker-packet.md).

## Relationship to Charter

```txt
Charter = operating contract for the whole bet
Ticket  = bounded execution slice for a worker
```

A Charter decomposes into tickets. Each ticket compiles to one worktree + one worker +
one receipt. Charter owns legitimacy of the bet; Autonomy owns operations of the slices.

## Core line

```txt
Charters define the bet.
Tickets define the slice.
Workers execute the slice.
Receipts prove the slice.
```

## Command surface (proposed)

```txt
/ticket compile   messy work → ticket.yaml + worker packet
/ticket assign    create worker conversation + worktree, hand over packet
/ticket status    show ticket state / checks / receipt
/ticket review    audit receipt AC-by-AC before integration
/ticket close     mark merged|cancelled, clean stale worktree
```

`compile`, `assign`, `status`, and review-request creation are autonomous; integration
that crosses a gate (protected-main merge, external side effect) escalates to Approvals.

## Current review topology

The v1 workflow uses two standing implementation lanes: one Claude lane and one Codex
lane. They are peers with different strengths; do not force a standing Claude -> Codex
or Codex -> Claude review hop.

Instead, whichever lane implements a ticket must manually launch a fresh, unbiased
reviewer subagent and give it:

- the ticket packet
- the diff / changed files
- the Done-when acceptance criteria
- the claimed receipts/checks
- explicit instruction to grade AC-by-AC and withhold `+1` when proof is missing

The implementer cannot self-certify. A ticket only advances when the unbiased review maps
proof to each acceptance criterion. If a proof artifact is missing, the result is `needs
work`, not “probably done.”
