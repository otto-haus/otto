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

## Full 30s script

| Step | Automated | Manual runbook |
|------|-----------|----------------|
| Done claim → correction → ratify | Not captured | Operator steps 1–4 in runbook |
| Check compiles (132) | Unit tests pass | Staging ratify path |
| Second Done → block + receipt | **Captured (rev9)** | `135-culture-ci-block.png` via `check ticket 135-demo` |

## Unit verification (demo path buildable)

```sh
bun test ./packages/core/src/check.test.ts
bun test ./apps/desktop/electron/check-compiler.test.ts
bun test ./apps/desktop/electron/check-runner.test.ts
bun run verify:v0
```

## Honest verdict

Runbook + surface sequence + live `CheckBlockBanner` prove Culture CI is falsifiable on staging. Correction→ratify loop (steps 1–4) remains operator-manual; block moment is independently provable via `check ticket 135-demo` on a disposable conversation.
