# Receipt — Routines (Otto v0.1)

- **What changed:** `extension/routine.ts` swept to Otto; runtime `RUNTIME_HOME = ROUTINE_HOME ?? OTTO_HOME ?? VINNY_HOME ?? ~/.otto`. Routine specs renamed.
- **Demo:** `demo/out/otto-v01-routines.mp4`
- **Test command/output:** No automated test. `bun run typecheck` → exit 0. Routine specs conform to `packages/core/src/types.ts`.
- **Manual verification:** `cat routines/morning/routine.yaml` (steps reference charter/review/decision/follow-up; `requires_approval_to_activate: true`).
- **Known limitations:** Recurring schedule backend (Letta cron) not exercised here; one-off trials only. Demo is a re-enactment.
- **Approval status:** ☐ pending Sebastian.
