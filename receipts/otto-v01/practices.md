# Receipt — Practices (Otto v0.1)

- **What changed:** `@otto-haus/practices`; bin `vinny-practices` → `otto-practices`;
  `cli.ts` now `OTTO_ROOT ?? VINNY_OS_ROOT`; `validate.test.ts` made portable (resolves repo root, no hardcoded path).
- **Demo:** `demo/out/otto-v01-practices.mp4`
- **Test command/output:** `bun test` → **6 pass / 0 fail**. `bun packages/practices/src/cli.ts` →
  5 specs validate: `charter active ok`, `decision/field-note/follow-up/review draft ok`.
- **Manual verification:** `bun packages/practices/src/cli.ts` (real validator table); `cat practices/charter/practice.yaml`.
- **Known limitations:** decision/review/field-note/follow-up are draft specs that reuse Charter's primitives, not separately implemented.
- **Approval status:** ☐ pending Sebastian.
