# Otto Ticket Canon

This folder is the operating system for building Otto.

## Canonical goal

```txt
Ship every active Otto ticket.
Move a ticket to _Done only when every Done when item is proven.
Keep future work in _Parked until explicitly activated.
```

## Folder state is truth

```txt
root       = active queue
_InReview  = built; waiting for independent review
_Done      = finished and proven
_Parked    = valid future work, not active now
```

Status text inside a ticket is secondary. The file's folder is canonical.

## Unit of work

```txt
One desired capability = one ticket.
One ticket = one build/review unit.
```

A good ticket is small enough for focused agent work and large enough to prove a capability.

## Build order

Work the lowest-numbered dependency-safe wave in root.

Serial means serial per dependency chain, not serial for the whole organization.
Parallel work is allowed when `000-parallel-map.md` shows no dependency, file/domain, or authority conflict.

Do not build parked work until it is moved back to root.

## Owner routing

`Owner:` chooses the implementer lane, not the reviewer.

```txt
Codex  = real reasoning: contracts, schemas, gates, invariants, proof logic, authority decisions
Claude = writing/UI/UX/craft: copy, docs, motion, visual polish, language-heavy surfaces
Cursor = default executor: straightforward implementation, plumbing, integrations, mechanical edits, test/build fixes
```

Default to Cursor unless the hardest irreducible part is Codex-grade reasoning or Claude-grade craft.

## Done rule

A ticket is done only when:

```txt
- every Done when item is satisfied
- implementer proof exists
- ticket moved through `_InReview`
- independent reviewer gives +1 against the ticket/spec
- no fake readiness, receipts, memory, adapter state, or connected state was used
- the ticket file is moved to _Done
```

No proof, no reviewer +1, no `_Done`.

## Review gate

The routed implementer may implement. The implementer may not certify their own ticket as done.

A review agent must check:

```txt
- the ticket's Outcome
- every Done when item
- relevant specs/canonical docs
- actual code behavior
- tests/logs/screenshots/proof
- absence of fake state or scope creep
```

Reviewer result must be one of:

```txt
+1        move to _Done allowed
-1        not done; exact fixes required
blocked   cannot verify; exact blocker required
```

If implementer and reviewer disagree, Sebastian arbitrates.

## Blocked rule

If blocked:

```txt
- leave the ticket in root
- write the exact blocker in the ticket
- do not skip ahead unless the next ticket is dependency-safe
```

## Product proof loop

Otto is real when this loop works:

```txt
A correction becomes a ratified rule.
The rule changes the next run.
The system can prove it.
```

Operationally:

```txt
real action → receipt → proposal/learning → curation → changed future behavior
```

## Authority rule

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


## Receipts rule

Every attempted ticket execution records proof inside the ticket file under `## Execution receipt`.

The implementer writes the execution receipt. The reviewer appends the verdict under `## Review`.


## In-review rule

Implementers move completed work to `_InReview`, not `_Done`.

Reviewers poll `_InReview`. A `+1` moves the ticket to `_Done`. A `-1`, `blocked`, or `fake-done` moves it back to root with exact fixes/blocker recorded.


## Proof location

No separate receipts folder. Proof travels with the ticket.

Implementer appends:

```txt
## Execution receipt
```

Reviewer appends:

```txt
## Review
```


## Staging runtime rule

Ticket implementation may edit code in any isolated worktree. **Runtime and UI proof must use Otto staging only.**

```txt
Never quit, replace, or smoke-test against /Applications/otto.app.
Use /Users/seb/.codex/admin/otto-staging/otto-staging.app for isolated smoke.
Use /Applications/otto-staging.app for deploy-staging builds.
```

Established by ticket 005 after live-app disruption during verification. Non-negotiable.

## Optional commit rule

Local commits may be useful after reviewer `+1`, but they are not automatic.

```txt
The implementer may not commit unless explicitly approved.
Reviewer may recommend a local commit after +1.
No push, tag, release, or remote change without Sebastian.
```
