# Ticketcraft (`/ticket`)

Ticketcraft is the **ticket compiler**. It does for work what Charter's compiler does
for goals.

```txt
Goalcraft:    messy intent → sharp /goal
Ticketcraft:  messy work   → sharp ticket packet
```

Internal/package name: Ticketcraft. User-facing command: `/ticket`.

It is part of [Autonomy](autonomy.md): compiling sharp, bounded tickets is what lets
Main Vinny own orchestration while workers execute.

## Why it matters

```txt
Sebastian gives intent.
Vinny compiles tickets.
Workers execute.
Vinny reviews / integrates.
Sebastian sees only doors.
```

The compiler uses Vinny's superior local context — repo state, owned vs shared paths,
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

`compile`, `assign`, `status`, and `review` are autonomous; integration that crosses a
gate (protected-main merge, external side effect) escalates to Approvals.
