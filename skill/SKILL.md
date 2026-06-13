---
name: charter
description: Charter — an operating contract system for autonomous agents. Use when the user invokes /charter or /goal, says they want to start/track/resume long-running work, gives vague intent to operationalize, or when you must own and update a durable charter contract with approval gates, ledger, and receipts. Object model Intent -> Charter -> State -> Receipt. The human owns charter legitimacy; you own operations.
---

# Charter

Charter turns messy intent into evidence-checked autonomous work.

```
Object model   Intent -> Charter -> State -> Receipt
Compiler       messy intent -> compact contract (charter.md + charter.yaml)
Runtime        charter.* / state.yaml / ledger.md / approvals / receipts / traces / notes
Loop           Scout -> Judge -> Worker   (+ Auditor proves/rejects done, Recorder keeps files current)
Gates          one-way doors require human approval
Substrate      Files = truth, Memory = lessons, UI = cockpit
```

## Core principle

```
The human owns charter legitimacy.
The agent owns charter operations.
```

You have better local context (repo state, blockers, prior decisions, tool/runtime
constraints, real acceptance criteria, implementation path). So you operationalize
vague intent into durable charters. The human decides whether the goal is legitimate
and approves one-way doors.

## Substrate rules (do not violate)

- **Files = truth.** Active charter state lives in files under the runtime root, NOT
  in Letta memory blocks. Never treat chat or memory as the source of truth for status.
- **Memory = lessons.** Write durable lessons learned to memory on completion, not
  live state.
- **UI = cockpit.** The command/status output is a view over the files.

## Runtime (Files = truth)

Canonical root: `$CHARTER_HOME/charters/` (default `~/.charter/charters/`, override
with `CHARTER_HOME`). This is intentionally OUTSIDE Letta memory.

```
charters/
  active.json              { "slug": "<active-slug>" } or { "slug": null }
  <slug>/
    charter.md             human contract (rendered)
    charter.yaml           machine contract — SOURCE OF TRUTH for AC ids, gates, plan ids
    state.yaml             mutable runtime state
    ledger.md              append-only timestamped history
    approvals/             first-class scoped, time-bound approval records (<id>.yaml)
    receipts/              proof artifacts (files, links, logs, screenshots)
    traces/                raw tool/exec traces
    notes/                 detailed companion notes (kept OUT of the contract)
```

`slug` = kebab-case of the objective, deduped.

### Two-faced contract — keep in sync (Recorder)
- `charter.yaml` is the **machine source of truth**: AC ids (`AC1`, `AC2`, ...),
  gates, plan step ids, status.
- `charter.md` is the **human render** of the same contract.
- On any contract edit, update both. The Auditor fails completion if AC ids in
  `charter.md` and `charter.yaml` disagree.

## Roles

- **Scout** — gather context, refresh plan, pick the next thin slice toward an AC.
- **Judge** — decide; check acceptance criteria + gates before acting.
- **Worker** — execute the slice (or delegate via a delegation packet).
- **Auditor** — prove or reject "done", AC-by-AC, against receipts. Never trusts
  assertions; only receipts.
- **Recorder** — after every step, keep `state.yaml`, `ledger.md`, and the two
  contract faces current.

## Anti-fake-progress rule (keeper)

- **No artifact, no progress.** Every `step` must produce a receipt or a block.
- **Two no-evidence loops force block/sharpen.** If `state.yaml: no_evidence_loops`
  reaches 2, stop looping; block or sharpen instead.
- **Done requires AC-by-AC proof mapping.** Completion lists each AC and the receipt
  that proves it.

## Subcommands

`/charter` (compat alias `/goal`). Prefer `/charter` in product language.

### propose / compile  (Compiler)
1. Read local context (cwd, repo, recent conversation, relevant memory).
2. Draft a **proposed** charter — do not activate. Produce both faces (charter.md +
   charter.yaml) with stable AC ids and plan step ids.
3. Sharpen beyond what the human would write: concrete deliverable, evidence-bound
   acceptance criteria, explicit non-goals, named one-way doors.
4. Ask exactly: `Approve this charter? (approve / edit / cancel)`. Persist nothing yet.

### approve
1. Create `charters/<slug>/` with charter.md, charter.yaml (status: active),
   state.yaml (current_phase: scout, no_evidence_loops: 0), ledger.md, and empty
   approvals/, receipts/, traces/, notes/.
2. Point `active.json` at the slug.
3. First ledger entry = activation (timestamp + objective + first next action).
4. Confirm; state first next action; suggest `/charter step`.

### status / resume
Answer in order, scannable:
- **Where are we?** phase + % plan done
- **What changed?** from ledger tail
- **What is blocked?**
- **What is next?**
- **What needs my approval?** open approval records + armed gates

`resume` then runs `step` repeatedly until a gate, a stop condition, or
`no_evidence_loops >= 2`, then asks.

### step  (atomic loop — the engine)
Run exactly one loop:
1. **Scout**: read state.yaml + charter.yaml; choose the next thin slice.
2. **Judge**: check ACs + gates.
3. **Worker**: execute the slice — or, if a one-way door is required, write a scoped
   approval record (see below) and BLOCK with a precise question + best guess.
4. **Receipt**: write a proof artifact under receipts/ mapped to its AC id.
   (No artifact => no progress.)
5. **Recorder**: update state.yaml (completed_steps, plan, next_action,
   receipt_paths), append ledger.md, keep contract faces in sync.

If the slice produced no artifact, increment `no_evidence_loops`; at 2, force a block
or sharpen.

### update  (operational — NO approval)
Update state.yaml + append ledger. Free to change: plan, completed steps, blockers,
next action, receipt links, risk notes, AC *clarifications*.

### receipt
Save/link proof under receipts/, map to AC id(s), add to state.yaml receipt_paths,
note in ledger.

### block
Record blocker in state.yaml + ledger. If it is a one-way door, also write an
approval record (below). Then ask ONE precise question with best-guess fix:
```
Blocked: <what you need decided>.
Best guess: <your proposed answer>.
Approve?
```

### audit  (Auditor, non-completing)
For each AC in charter.yaml, map to a receipt and mark pass/fail. Output the AC-by-AC
table + missing proofs. Do not change status.

### sharpen
Tighten plan / acceptance clarity / stop conditions / next action. Clarifications are
operational. Objective/scope/DoD/gate changes are legitimacy changes — ask first.
Keep contract faces in sync.

### split
Propose sub-charters; get approval before creating dirs.

### complete
Run the Auditor. Complete ONLY if every AC maps to a real receipt, no required work
remains, and a user-facing summary is prepared. If any AC lacks proof, do NOT
complete — report the gap. On success: set status=complete in charter.yaml +
state.yaml, append ledger, clear active.json, write a **lessons** note to memory,
output the completion summary.

### cancel
status=cancelled + reason, append ledger, clear active.json.

## Legitimacy vs operations

Operational (no approval): plan, completed steps, blockers, next action, receipts,
risk notes, AC clarifications, ledger, traces, step execution within scope.

Legitimacy (ask first): objective, scope expansion, acceptance criteria, approval
gates, one-way-door policy, definition of done, budget/time, external side effects.

## Charter Gates (one-way doors)

The `charter-gates` permission overlay forces an approval prompt — even in
unrestricted mode — on: send/post/publish, spend/payment, deploy, merge to protected
main / force-push, delete/destroy important data, credential/security changes,
customer/live-file access, external writes.

When a gate fires, do not bypass it. Write an **approval record** and ask.

### Approval records are first-class
Chat approval is not enough — persist it. `approvals/<id>.yaml`:
```yaml
id: <short-id>
requested_action: <exact action>
scope: <what it covers, narrowly>
evidence_required: <what proof must exist first / after>
requested_at: <iso8601>
expires_at: <iso8601>          # time-bound; re-ask after expiry
status: pending                # pending | approved | denied | expired
decided_by: <name>
decided_at: <iso8601>
```
Only act on an approval that is `approved` and not expired, and only within `scope`.

## Charter Loop (long runs)
For runs > ~30 min, operate Scout -> Judge -> Worker -> (Auditor/Recorder) and keep
receipts/traces as you go. Make local work durable/idempotent with logs and resume
points; prefer `caffeinate` / `nohup` for overnight since the Mac is the worker.

## Delegation
You may delegate Worker steps to subagents / Opus / Codex, but the charter stays
owned by you. Delegation packet must include: objective, constraints, relevant files,
acceptance criteria, approval gates (what the delegate must NOT do without asking),
expected output path, what not to do. See `templates/delegation-packet.md`.

## Product model

```
Intent -> Charter proposal -> human approval -> autonomous steps (receipt each)
       -> Auditor proves AC-by-AC -> human accepts done
```
