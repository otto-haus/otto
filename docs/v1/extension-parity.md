# Extension CLI parity (Letta Code ↔ desktop)

Advanced operators may use **Letta Code CLI** with `extension/` commands instead of the embedded desktop shell. v0.1 bets on embedded one-app; this matrix keeps the two paths from diverging.

**Runtime home:** `OTTO_HOME` (default `~/.otto`). Charter uses separate `CHARTER_HOME` (default `~/.charter`).

**Autonomy contract:** `docs/v1/contracts/autonomy-policy.yaml` (ticket 017). Extension permission overlays gate one-way doors; desktop `PracticeRunner` + `AutonomyStore` gate external side effects on practice runs.

## Parity matrix

| Extension command | Extension file | Permission overlay | Desktop IPC | Receipt action | Receipt location |
| --- | --- | --- | --- | --- | --- |
| `/charter …` | `extension/charter.ts` | `charter-gates` (deploy, publish, push, merge, delete, send, secrets) | `otto:practices:run` slug `charter` | `practice.charter.run` | `$OTTO_HOME/receipts/` |
| `/review done` | `extension/review.ts` | — (prompt-only; desktop runs done_claim checks) | `otto:practices:run` slug `review` | `practice.review.done` | `$OTTO_HOME/receipts/` |
| `/review risk` | `extension/review.ts` | — | `otto:practices:run` slug `review` | `practice.review.risk` | `$OTTO_HOME/receipts/` |
| `/field-note capture` | `extension/field-note.ts` | — (never auto-send; autonomy floor blocks `send` in payload) | `otto:practices:run` slug `field-note` | `practice.field_note.capture` | `$OTTO_HOME/receipts/` + `$OTTO_HOME/field-notes/*.md` |
| `/routine …` | `extension/routine.ts` | `routine-gates` (letta cron, crontab, launchd, systemd timer) | `otto:practices:run` (future) / manual skill workflow | `practice.routine.*` (planned) | `$OTTO_HOME/receipts/` |

**Desktop receipts pane:** `otto:receipts:list` reads the same `$OTTO_HOME/receipts/` directory as `ReceiptStore`.

## Permission gates ↔ autonomy zones

| Gate class | Extension overlay | Autonomy zone (017) | Desktop enforcement |
| --- | --- | --- | --- |
| deploy / publish / package publish | `charter-gates` | red (`deploy`) | `AutonomyStore` on external invocation text |
| git push / force-push / merge PR | `charter-gates` | red (`merge`) | same |
| send (email, slack, discord, imessage) | `charter-gates` | red (`send`) | same |
| credential / secret file writes | `charter-gates` | red (`security`) | same |
| destructive git / db / infra | `charter-gates` | red (`delete`) | same |
| recurring schedule activation | `routine-gates` | red (`recurring`) | `requires_approval_to_activate` on routine specs |

Disable overlays: `CHARTER_GATES=off`, `ROUTINE_GATES=off`.

## Gaps (honest v1)

| Item | Status |
| --- | --- |
| Extension as onboarding default | Not supported — desktop embedded path only |
| `/ticket`, `/follow-up`, `/decision` extension commands | Spec only; no `extension/*.ts` yet |
| Routine practice run from desktop IPC | Manual / skill workflow; no `PracticeRunner` slug yet |
| Extension invoke → live Letta turn in CI | Opt-in; smoke uses `PracticeRunner` + shared `OTTO_HOME` |
| Marketplace / packaged extension distribution | Out of scope |
| Receipts pane UI proof in CI | Manual staging; automated smoke verifies receipt files |

## Verification

```sh
bun run typecheck
bun test scripts/extension-parity-smoke.test.ts
bun scripts/extension-parity-smoke.ts
```

Manual (staging, same `OTTO_HOME` as CLI session):

1. Run `/charter step` or desktop Practice run for charter.
2. Open Receipts pane — receipt with `practice.charter.run` appears.
3. Run `/review done` with mapped AC proof — receipt with `practice.review.done` appears.

Smoke uses an isolated temp `OTTO_HOME`; never `conversation=default`.
