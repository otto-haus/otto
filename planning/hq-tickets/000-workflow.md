# Otto Build Workflow

Canonical source: `000-canonical.md`.

Goal:

```txt
A correction becomes a ratified rule,
the rule changes the next run,
and the system can prove it.
```

## Operating model

Use the ticket `Owner:` as the build executor. Default to Cursor for ordinary implementation.
Use this folder as the source of build truth.
Use tickets as the only unit of work.

```txt
One ticket in → one implemented capability out.
Independent chains in parallel → reviewed capabilities out faster.
```



## Invariants

1. Move last.
   The implementer must append `## Execution receipt` before moving a ticket to `_InReview`.

2. Folder state beats prose.
   A ticket in root is active, even if internal text says otherwise.
   A ticket in `_Done` is done only if `## Review` contains `Verdict: +1`.

3. Active-ticket selector.
   The implementer only works the lowest-numbered dependency-safe ticket in its assigned lane/wave matching:

   ```txt
   /^[0-9]{3}-.+\.md$/
   ```

   Ignore `000-*` docs and underscored folders/files.

4. Code proof required.
   `## Execution receipt` must include:

   ```txt
   - repo path
   - branch name
   - git status summary
   - files changed
   - commands run
   - test/build output
   - screenshots or artifact paths when UI changed
   - known gaps
   ```

5. No proof mapped to `Done when` = no reviewer `+1`.

6. Throughput map first.
   Before parallel execution, update `000-parallel-map.md` with the current DAG, ready tickets, blocked tickets, waves, and file/domain conflicts.

## Folder-state rule

```txt
root       = active queue
_InReview  = built; waiting for independent review
_Done      = finished and proven
_Parked    = valid but not active
```

Status fields inside tickets are secondary. Folder location is truth.


## Owner routing

Use each ticket's `Owner:` field to dispatch work.

```txt
Codex  = real reasoning: contracts, schemas, gates, invariants, proof logic, authority decisions
Claude = writing/UI/UX/craft: copy, docs, motion, visual polish, language-heavy surfaces
Cursor = default executor: straightforward implementation, plumbing, integrations, mechanical edits, test/build fixes
```

Default to Cursor unless the hardest irreducible part is real reasoning (Codex) or writing/UI/UX/craft (Claude).

## Daily loop

1. Recompute `000-parallel-map.md` from folder state.
2. Pick the lowest-numbered dependency-safe wave.
3. Dispatch each safe ticket to its routed owner: Cursor / Codex / Claude.
4. Each implementer uses an isolated worktree/session and implements exactly one ticket.
5. Each implementer appends `## Execution receipt` proof to its ticket.
6. Each implementer moves completed work to `_InReview` and stops.
7. Reviewer agent audits proof against the ticket/spec.
8. Reviewer `+1` moves ticket to `_Done`.
9. Reviewer `-1`, `blocked`, or `fake-done` moves ticket back to root with exact fixes/blocker.
10. Recompute the map before launching the next wave.

## Implementer prompt template

```txt
You are building Otto.
Use the ticket as the source of truth.
Implement only this ticket.
Do not expand scope.
Do not fake connected state, receipts, memory, or readiness.
If blocked, stop and report the exact blocker.

Ticket:
[paste ticket]

Repo context:
[paste relevant paths / current status]

Return:
1. files changed
2. commands run
3. proof that each Done when item passes
4. remaining blockers, if any
5. suggested status: done/review/blocked
```

## In-ticket proof required for every ticket

The implementer must append `## Execution receipt` with:

```txt
- files changed
- what was implemented
- how it was tested
- screenshots/logs/examples if UI or runtime behavior changed
- exact blockers if not complete
- whether any Done when item is unmet
```

No in-ticket proof, no reviewer +1, no move to `_Done`.

## Speed rule

Fast does not mean broad.
Fast means:

```txt
small ticket
clear done test
no scope expansion
immediate proof
next ticket
```

## Parallelization rule

Parallelize to maximize accepted tickets per hour, but only when dependency, file, and authority boundaries are safe.

Use `000-parallel-map.md` as the current scheduling artifact.

Parallelize only when:

```txt
dependencies satisfied
different file/domain boundaries
different authority boundary
isolated worktree/session per implementer
independent reviewer for each ticket
clear merge order if shared app shell files may be touched
runtime/UI proof via Otto staging only — never live /Applications/otto.app
```

Safe to parallelize:

```txt
UI polish + docs
receipt surface + standards file examples
future ticket drafting + current implementation
```

Do not parallelize:

```txt
Letta readiness + chat adapter
receipt schema + receipt surface
curation contract + curation decisions
same schema/model/canon loader
same App/nav/surface registry without explicit merge order
anything that edits the same core model files
```

Serial means serial per dependency chain, not serial for the whole organization.

## Current critical path

```txt
001 Settings: Letta Readiness
002 Chat: Real Adapter Path
003 Chat: Empty/Error/Loading States
004 Receipt Contract
005 Receipts Surface
008 Standards: File-Backed Canon
010 Practices Contract
014 Curation: Proposal Contract
015 Curation Inbox
016 Curation Decisions
018 Next-Layer Readiness Gate
```

This is the fastest path to the magic moment.

## Magic moment

Do not call Otto ready until this works:

```txt
Run 1: Otto makes a mistake.
Sebastian rejects/corrects it.
Otto creates a proposal.
Sebastian accepts it.
Canon changes.
Run 2 behaves differently.
Receipt proves the change.
```

## Scope guard

Do not build these before ticket 018 is done:

```txt
Paperclip
Cognee
Stacks
voice
cloud
multi-user auth
plugin marketplace
beautiful generic dashboard
```

## Version rule

Versions are labels after the fact.
Tickets are how we build.

```txt
Ticket queue = operating model.
Roadmap = story.
Proof loop = product.
```


## Review agent prompt template

```txt
You are the Otto ticket reviewer.
Your only job is to audit the implementer's work against the ticket and canonical specs.

Read:
- 000-canonical.md
- 000-index.md
- the ticket file
- relevant repo files/tests/proof

Check every Done when item.
Reject fake readiness, fake receipts, mock connected state, missing tests, and scope creep.

Return exactly one verdict:

+1
-1
blocked

Then provide:
- evidence
- unmet Done when items
- exact fixes required
- whether the ticket may move to _Done
```
