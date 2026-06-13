# Vinny OS Desktop integration

The Desktop cockpit is a **view over Practices and their state** (Files = truth,
UI = cockpit). It does not own Practice logic; it surfaces and controls it.

## Desktop should show

- **active Practices** — what's enabled, with status (draft / active / deprecated)
- **available invocations** — the slash commands each Practice exposes
- **recent Practice runs** — with outcome and links to produced artifacts/receipts
- **pending Practice proposals** — mined Practices awaiting approval
- **Practice metrics** — usage and quality signals (see [`metrics.md`](metrics.md))
- **approval controls** — approve / defer / reject proposals; approve gated actions

## Invocation surfaces

Practices should be invokable from:

- **chat** — type the slash command
- **command palette** — searchable list of Practices + invocations
- **contextual buttons** — surfaced where the workflow is relevant (e.g. "Capture
  field note" on a note, "Record decision" on a decision thread)

## Approval UX (product-critical)

- Gated actions (external side effects, one-way doors, permission expansion) render an
  **approval card** that must be acted on before the action proceeds.
- Never default to a global "yolo" / auto-approve.
- A Practice run that hits a gate shows as **blocked**, not failed, until resolved.

## Run records

Each Practice run should be inspectable from Desktop: inputs given, invocation used,
artifacts/state produced (paths/links), gate decisions (approved / denied / pending),
outcome (success / blocked / aborted), and timestamps. This mirrors Charter's
receipts/traces model — runs are observable, state is durable, approvals are
first-class.
