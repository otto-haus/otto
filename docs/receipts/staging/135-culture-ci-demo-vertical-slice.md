# Staging receipt — 135 Culture CI demo vertical slice

Date: 2026-06-14  
Runbook: `docs/v1/demo-culture-ci.md`  
Staging app: `/Applications/otto-staging.app`  
Proof JSON: `ticket-proof-20260614063142.json`

## Automated capture (surfaces)

Sequence under `135-culture-ci-demo/`:

1. `01-checks-surface.png` — Checks surface (product noun)
2. `02-curation-surface.png` — Curation (proposal path)
3. `03-standards-surface.png` — Standards (compile source)
4. `04-chat-ready-for-block-demo.png` — Chat ready for block demo

## Full 30s script (manual)

Steps 1–7 in `docs/v1/demo-culture-ci.md` require connected runtime + disposable conversation. Automated capture did **not** trigger `CheckBlockBanner` — label recording accordingly.

| Step | Automated | Manual runbook |
|------|-----------|----------------|
| Done claim → correction → ratify | Not captured | Required for block shot |
| Check compiles (132) | Unit tests pass | Staging ratify path |
| Second Done → block + receipt | **Not in auto capture** | `135-culture-ci-block.png` target |

## Unit verification (demo path buildable)

```sh
bun test ./packages/core/src/check.test.ts
bun test ./apps/desktop/electron/check-compiler.test.ts
bun test ./apps/desktop/electron/check-runner.test.ts
bun run verify:v0
```

## Honest verdict

Runbook + surface screenshots prove Culture CI **surfaces exist** and Checks is the product noun. Falsifiable block/receipt loop is documented and unit-tested; live block banner screenshot remains manual follow-up when staging runtime is ready.
