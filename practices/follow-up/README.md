# Practice: Follow-up  ·  `status: draft`

**Purpose** — draft relationship/customer follow-ups with explicit approval gates.

Follow-up turns a follow-up candidate (often from a Field Note) into a ready-to-send
draft — and then **stops**. It never sends. Every draft produces an approval card; no
outbound action happens without explicit human approval. This mirrors Charter's
one-way-door gate, scoped to outbound communication.

> Draft spec. Not yet implemented as an extension. See `practice.yaml`.

## Invocation

```txt
/follow-up draft <context>
```

## Trigger

- a Field Note produced a follow-up candidate
- a relationship/customer touch is owed
- a thread needs a next step

## Inputs

- context (often handed off from a field note) · recipient · desired outcome

## Outputs / state

Durable under `follow-ups/`: draft, source context, recipient, risk notes, approval
card, and a no-send-without-approval gate.

## Guardrails (hard)

- **NO SEND WITHOUT APPROVAL.** Drafts only. The Practice never sends, posts, or
  publishes autonomously.
- Every draft renders an **approval card** before any outbound action.
- Cite the source context the draft is based on (no invented facts).

## Evidence standard

A draft tied to a real source/context, with recipient and risk notes, and an approval
card generated. The send action stays **blocked** until a human approves.

## Improvement loop

Track `sends_after_approval` vs `drafts_created` and `user_edits_required`. High edit
rates mean the draft template or context capture needs work.

## Templates

- `templates/follow-up.md`
