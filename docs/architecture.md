# Charter architecture (Otto core)

Charter is a local-first operating contract system for autonomous agents.

```
Object model   Intent -> Charter -> State -> Receipt
Substrate      Files = truth, Memory = lessons, UI = workspace
```

## Compiler
Messy intent -> compact contract.

The agent uses its superior local context (repo state, blockers, prior decisions,
tool/runtime constraints) to convert vague intent into a sharp, structured contract
in two faces:

- `charter.yaml` — machine source of truth (acceptance-criterion ids `AC1..`, gates,
  plan step ids, status).
- `charter.md` — the human render of the same contract.

The human approves, edits, or cancels — the human owns legitimacy.

## Runtime
Durable state for long runs, OUTSIDE Letta memory (default `~/.charter/charters/`):

```
charters/<slug>/
  charter.md     human contract
  charter.yaml   machine contract (source of truth)
  state.yaml     mutable run state
  ledger.md      append-only timestamped log
  approvals/     scoped, time-bound approval records
  receipts/      proof artifacts
  traces/        raw tool/exec traces
  notes/         detailed companion notes
```

`active.json` points at the current charter for fast re-entry.

## Loop + roles
The atomic unit is `/charter step`: read state -> choose slice -> execute/block ->
receipt -> update state.

- **Scout** — gather context, refresh plan, pick the next thin slice.
- **Judge** — decide; check acceptance criteria + gates before acting.
- **Worker** — execute (or delegate via a delegation packet).
- **Auditor** — prove or reject "done", AC-by-AC, against receipts. Trusts receipts,
  not assertions.
- **Recorder** — keep state.yaml, ledger.md, and both contract faces current.

## Anti-fake-progress
- No artifact, no progress (each step yields a receipt or a block).
- Two no-evidence loops force a block or sharpen.
- Done requires AC-by-AC proof mapping.

## Gates
One-way doors require human approval. A permission overlay forces an approval prompt —
even in unrestricted mode — on irreversible / external / high-stakes actions. Each
approval is persisted as a scoped, time-bound record under `approvals/`. See
[`gates.md`](gates.md).

## Principle

```
The human owns charter legitimacy.
The agent owns charter operations.
```
