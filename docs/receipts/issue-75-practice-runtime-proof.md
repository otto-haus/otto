# Issue #75 — Practice runtime (charter / review / field-note)

GitHub: [otto-haus/otto#75](https://github.com/otto-haus/otto/issues/75)  
Local ticket: `053-practice-runtime-charter-review-field-note`

## Done when (v0.1)

| Criterion | Path | Proof |
|-----------|------|-------|
| Charter `/charter` equivalent creates receipt linked to practice id | Desktop **Run** → `PracticeRunner.run({ slug: 'charter' })` | `practice-runner.test.ts` charter test; staging `otto.practices.run` |
| Review receipt suitable for 051 gate | `CheckRunner.evaluateDoneClaim()` in `runReview` | `practice-runner.test.ts` review blocked/pass tests |
| Field note artifact + receipt | `~/.otto/field-notes/<id>.md` + receipt evidence | `practice-runner.test.ts` field-note test; staging field-note run |
| Validator passes all practice specs | `packages/practices` CLI | `bun packages/practices/src/cli.ts` (5 specs ok) |

## Automated verification

```sh
bun run typecheck
bun test apps/desktop/electron/practice-runner.test.ts
bun packages/practices/src/cli.ts
bun run verify:v0
```

## Staging (non-default conversation; never `/Applications/otto.app`)

Prior charter-only proof: `docs/receipts/staging/staging-hygiene-proof-20260614143512.json` (`tickets.053.ok: true`).

Extended hygiene script now runs **charter + field-note** via CDP on otto-staging.app (read-only attach; does not install or mutate the app bundle):

```sh
NODE_PATH=$HOME/.codex/admin/node_modules \
  OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
  node scripts/otto-staging-hygiene-proof.cjs
```

## Honest limits (accepted v0.1 deferrals)

- Letta slash commands remain prompt launchers; durable receipt requires desktop Run (or future transport hook).
- Charter runtime records invocation proof only — does not execute the full charter skill loop.
- Approval floor uses keyword heuristics + `AutonomyStore`, not full YAML `approval_required_for` parse.
