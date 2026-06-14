# Goal: Ship every active Otto ticket

## Charter

**Original request:** Ship every active ticket in
`/Users/seb/Library/CloudStorage/Dropbox/HQ/Otto Tickets`, using `000-canonical.md` as the
operating contract. Work the lowest-numbered active ticket first, implement only that ticket,
prove every "Done when" item, move the ticket to `_Done` only when proven, leave blocked tickets
in root with the exact blocker, do not touch `_Parked`.

**Interpreted outcome:** Each active root ticket (001–018) is either (a) implemented, proven
against every "Done when" item, independently reviewed **+1**, and moved to `_Done`; or (b) left in
root with an **exact written blocker**. `_Parked` is untouched.

**Input shape:** `existing_plan` — a precise operating contract + an ordered ticket queue.
Preserve and execute the contract; do not re-plan it.

**Goal oracle:** per ticket — every "Done when" item satisfied with real implementer proof
(tests / logs / screenshots / real behavior), routed through `_InReview`, and an **independent
reviewer +1** against the ticket + its spec, then the file physically in `_Done`. No proof, no +1,
no `_Done`.

### Operating contract (from `000-canonical.md`) — non-negotiable

- **Folder is truth:** root = active queue · `_InReview` = built/awaiting review · `_Done` = proven
  · `_Parked` = future, not active.
- **One ticket = one build/review unit.** Work the lowest-numbered root ticket whose dependencies
  are satisfied. Implement **only** that ticket — no scope creep.
- **Review gate:** Claude may implement but may **NOT** certify its own ticket. An **independent
  review agent** must check the Outcome, every Done-when, the spec, actual code behavior, and proof,
  and return `+1` / `-1` / `blocked`.
- **No fake state:** no faked readiness, receipts, memory, adapter, or connected state.
- **Blocked → leave in root**, write the exact blocker, do not skip ahead unless the next ticket is
  dependency-safe.
- **Do not touch `_Parked`** until explicitly told.

### Coordinates

- **Tickets dir:** `/Users/seb/Library/CloudStorage/Dropbox/HQ/Otto Tickets`
- **Contract:** `…/Otto Tickets/000-canonical.md` (+ `000-workflow.md`, `000-index.md`)
- **Implementation repo:** `/Users/seb/Code/otto/.letta/worktrees/otto-v01-integration`
  (Otto v1 desktop; tickets 001–018 map to `docs/otto-v1-surface-contracts.md`).
- **Active queue:** 001 settings-letta-readiness · 002 chat-real-adapter-path ·
  003 chat-empty-error-loading-states · 004 receipt-contract · 005 receipts-surface ·
  006 charter-contract · 007 charters-surface · 008 standards-file-backed-canon ·
  009 standards-surface · 010 practices-contract · 011 practices-surface · 012 routines-contract ·
  013 routines-surface · 014 curation-proposal-contract · 015 curation-inbox ·
  016 curation-decisions · 017 autonomy-policy · 018 next-layer-readiness-gate.

### Known issue to fold in (blocks any "real turn" Done-when — tickets 002 / 003)

The desktop chat connects (`session.initialize()` succeeds) but the first turn returns
`429 … agent-not-found`. **Root-caused (NOT a wrong server, NOT an Otto code bug):** the agent's
stored `llm_config` model handle is `openai-codex/gpt-5.5` with placeholder endpoint
`https://example.invalid/v1`, which does not exist in the local Letta server's model catalog — so
every turn fails provider binding and the server wraps it as the generic `429 agent-not-found`
(0 ms). All 28 local agents are affected; Otto's `send()`/`stream()` is correct and faithfully
relays the error.

**Fix is Letta-side** — rebind the agent to a real handle:
`PATCH http://127.0.0.1:51087/v1/agents/agent-local-d8e35a2a-a89f-45dd-b117-5eae5df8c8f2`
with `{"model":"chatgpt-plus-pro/gpt-5.5"}` (the valid codex/gpt-5.5 handle; configured providers =
`chatgpt-plus-pro`, `lc-gemini`), or `letta /model`. For a ticket whose Done-when needs a real
turn, this is a **blocker requiring that rebind (Sebastian's call — it mutates agent config)** —
record the exact blocker. Optional Otto-side UX hardening (does not fix the turn): in
`letta-runner.ts` validate `init.model` against `/v1/models/` and show "model not available on this
Letta server — reconnect in Settings" instead of a raw 429.

### Likely misfire to avoid

Marking a ticket Done on implementer say-so without the independent reviewer +1; faking
connected/receipt/readiness state; implementing more than one ticket; touching `_Parked`.

### Tranche

Ship the active queue 001 → 018 in order, each through the **implement → prove → independent review
→ `_Done`** loop, until every active ticket is in `_Done` or blocked-with-reason in root.

## Proof type

`review` + `test | demo | artifact` per each ticket's Done-when.

## Authority

`approved` — Sebastian set the contract. Missing input / live-backend / destructive blockers stop a
single ticket (leave in root with the exact blocker), not the whole goal; keep advancing
dependency-safe tickets.
