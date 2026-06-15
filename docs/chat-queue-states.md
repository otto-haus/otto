# Chat queue states

The Chat unsent-message queue keeps operator follow-ups durable while otto is busy or a send fails.

## States

| State | Storage | Operator sees | Actions |
| --- | --- | --- | --- |
| **queued** (waiting) | `otto.chat.queue.v3` | Compact strip above composer | Recall, View, Send now (if not next), Remove |
| **sending** (in flight) | `otto.chat.inflight.v1` | Hidden from strip; rehydrates on reload if stale | Wait; becomes failed or sent |
| **failed** | `otto.chat.queue.v3` | Warning strip + failed pill | Recall, Retry, Remove |
| **sent** | — | Row removed after runtime accepts send | — |
| **cancelled** | — | Row removed when operator clears or removes | — |

## Recall

**Recall** copies a queued row into the composer without deleting it.

1. Click the row preview or **Recall**.
2. Edit in the composer; attachment footer lines restore when present.
3. The row stays queued (highlighted) until you **Tab**/queue-send or **Remove** it.
4. Sending replaces the recalled row with the edited payload (no duplicate).

## Keyboard

- **Tab** in the composer queues/sends (existing Chat behavior).
- **Enter** continues composing (steer model — separate ticket).

## Proof

Manual recall check: `docs/receipts/issue-51-queue-recall-proof.md`.
