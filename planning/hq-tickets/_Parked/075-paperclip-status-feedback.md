# 075 — Paperclip: Status Feedback (Review Requested, Not Done)

Owner: Codex
Priority: P3
Depends on: 022, 051
Release bucket: vNext adapters

**Unpark when:** Door-gated task creation (022) and automated review gate (051) exist.

## Boundary

Paperclip completion means **“review requested”** in otto — never auto-Done. AC-by-AC proof and reviewer +1 still required.

## Outcome

When Paperclip reports task/run completion, otto records a **review signal** and surfaces it on the linked otto ticket — without mutating Done or canon.

## Scope

- Import completion events (read-only poll or webhook → adapter, same seam as 021)
- Match via stored `ottoTicketId ↔ paperclipTaskId` mapping from 022
- Otto ticket state: optional `review_requested` / banner — **not** `done`
- Emit Curation proposal or Receipt: “Paperclip reports complete — verify AC”
- No automatic ticket close, no automatic charter complete

## Non-goals

- Two-way status sync that marks otto Done
- Paperclip as reviewer (+1 still human/agent review lane in otto)

## Done when

- [ ] Paperclip complete → otto shows review requested + receipt
- [ ] Otto ticket stays not-Done until 051 gate satisfied
- [ ] Reviewer +1

## Blocker log

Leave blank unless blocked.
