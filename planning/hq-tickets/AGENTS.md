# AGENTS.md — Otto Ticket Conveyor

This folder is the operating system for building Otto.

Start here:

```txt
000-canonical.md
000-index.md
000-workflow.md
```


## What this is

This is a lightweight ticket conveyor for shipping Otto.

It replaces version-driven planning with a file-native build loop:

```txt
one ordered queue
one ticket per capability
one implementer
one independent reviewer
folder location is status truth
proof lives inside the ticket
```

Versions are labels generated later from completed tickets. Tickets are how Otto gets built.

## Why this works

Cursor/Claude can move fast without certifying its own work.
The reviewer can audit against specs without redesigning the product.
Sebastian only arbitrates exceptions.

The conveyor mirrors Otto's own product philosophy:

```txt
work → proof → review → ratification → canon
```

And the product proof loop:

```txt
real action → receipt/proof → review → accepted change → next action
```

## Prime directive

```txt
Maximize accepted Otto tickets per unit time.
No fake done.
No proof, no reviewer +1, no _Done.
```

## Review gate (051)

Ticket and charter **merged/done** transitions are enforced in Electron stores — not honor-system prose:

```txt
active|blocked → review → merged
merged requires reviewer_verdict: +1 and evidence refs (ticket-store)
charter complete still blocked without AC proof (charter-store, 034)
```

Implementers cannot self-certify: `ticket-store.updateStatus` throws without reviewer +1 + evidence. UI surfaces blocked reason via Tickets lifecycle buttons.


## Staging runtime (mandatory)

**Never disrupt the live app.** Sebastian's running Otto stays open.

```txt
FORBIDDEN during ticket work / proof:
  - pkill, quit, replace, or rsync over /Applications/otto.app
  - verification that reuses ~/Library/Application Support/@otto-haus/desktop
  - any smoke that closes or relaunches the live app

STAGING ONLY for build deploy + runtime proof:
  - Isolated smoke app:  /Users/seb/.codex/admin/otto-staging/otto-staging.app
  - Smoke launcher:      /Users/seb/.codex/admin/otto-staging/launch-otto-staging-smoke.sh
  - Deploy target:       /Applications/otto-staging.app
  - Deploy script:       apps/desktop/scripts/deploy-staging.sh (from integration worktree)
```

Staging uses its own `HOME`, `OTTO_HOME`, profile, and debug port. Live `/Applications/otto.app` must remain untouched and running.

Record staging paths in every execution receipt that includes runtime or UI proof.

## Non-negotiable invariants

```txt
Move last: proof first, then _InReview.
Folder state beats prose.
Lowest-numbered dependency-safe ticket per lane/wave.
Code proof required.
No proof mapped to Done when = no +1.
Parallelize only when dependencies, files, and authority boundaries are safe.
Staging only for runtime proof — never close live Otto.
```

See `000-workflow.md` for the full invariant list.

## Folder state is truth

```txt
root       = active queue; implementer may build
_InReview  = built; waiting for independent review
_Done      = finished, proven, reviewer +1
_Backlog   = was wrongly _Done or deferred; not active sprint; not done
_Parked    = valid future work; do not touch unless explicitly unparked
```

Status text inside ticket files is secondary. File location is canonical.

## Roles

### Implementer agent, routed by `Owner:`

Your job:

```txt
root ticket → implementation → in-ticket proof → _InReview
```

Rules:

- Work the lowest-numbered active ticket in your assigned lane/wave whose dependencies are satisfied.
- Implement exactly one ticket.
- Do not expand scope.
- Do not touch `_Parked` unless Sebastian explicitly says to.
- Do not move your own work to `_Done`.
- Do not fake readiness, product receipts, memory, adapter state, connected state, tests, or proof.
- Do not push, tag, publish, rename remotes, or commit unless explicitly approved.
- Preserve user changes.

Use:

```txt
_workflow-run-ticket.md
```

After implementation:

1. Append `## Execution receipt` to the ticket.
2. Move ticket to `_InReview`.
3. Stop.

### Reviewer agent, usually GPT/Codex/Letta reviewer

Your job:

```txt
_InReview ticket → audit against spec/code/proof → +1 or reject
```

Rules:

- Poll `_InReview`.
- Review only; do not implement fixes unless explicitly asked.
- Read `000-canonical.md`, `000-index.md`, ticket, its execution receipt, and relevant repo files.
- Verify every `Done when` item.
- Reject fake connected/live/done claims.
- Append verdict to the ticket under `## Review`.

Use:

```txt
_workflow-review-ticket.md
```

Verdicts:

```txt
+1        move ticket to _Done
-1        move ticket back to root with exact required fixes
blocked   move ticket back to root with exact blocker
fake-done move ticket back to root; record fake-done in ticket review
```

### Sebastian

Sebastian arbitrates disagreements and may explicitly:

- unpark tickets
- reorder tickets
- accept risk
- approve commits/pushes/releases
- override a reviewer gate

## Product proof loop

Otto is real when this works:

```txt
A correction becomes a ratified rule.
The rule changes the next run.
The system can prove it.
```

Operational loop:

```txt
real action → receipt → proposal/learning → curation → changed future behavior
```

## Authority model

```txt
Letta remembers.
Otto improves.
Files are canon.
Databases are indexes.
Adapters are replaceable.
Curation is not replaceable.
```

External systems may return:

```txt
context
work state
artifacts
proposals
```

Only Otto decides:

```txt
what becomes future behavior
```


## Owner routing

Ticket `Owner:` is the dispatch rule:

```txt
Codex  = real reasoning: contracts, schemas, gates, invariants, proof logic, authority decisions
Claude = writing/UI/UX/craft: copy, docs, motion, visual polish, language-heavy surfaces
Cursor = default executor: straightforward implementation, plumbing, integrations, mechanical edits, test/build fixes
```

Default to Cursor unless the ticket's hardest irreducible part is Codex-grade reasoning or Claude-grade craft. If mixed: correctness-critical authority/proof work routes to Codex; writing/UI/UX/craft routes to Claude; ordinary implementation/plumbing routes to Cursor.

## Throughput scheduler

Otto optimizes for accepted decisions/tickets per hour, not raw agent activity.

Before launching work, maintain a dependency-aware map in:

```txt
000-parallel-map.md
```

The map should show:

```txt
- Mermaid dependency DAG
- ready tickets
- blocked tickets
- parallel waves
- likely file/domain conflicts
- owner lane per ticket: Cursor / Codex / Claude / Reviewer
```

Parallelize aggressively only when all are true:

```txt
- dependencies are satisfied
- tickets do not touch the same files/domains
- tickets do not share an authority boundary
- each implementer uses its own isolated worktree/session
- each ticket still gets an independent reviewer
```

Do not parallelize:

```txt
- same schema/model/canon files
- same app routing/nav surface without an explicit merge order
- ticket depends on another active ticket
- curation proposal and curation decision logic
- anything that could create fake readiness/proof
- implementer self-review
```

Recompute the map after every `_Done`, `-1`, `blocked`, or unpark event.

## First active ticket

Unless Sebastian says otherwise, choose from the lowest-numbered dependency-safe wave.

Do not continue opportunistically. One ticket, one in-ticket proof section, one review.
