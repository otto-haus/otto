# Staging receipt — 135 Culture CI 30s demo

**Date:** 2026-06-14  
**Build:** `fff0152`  
**App:** `/Applications/otto-staging.app` only  
**Status:** **Partial** — unit + Checks surface captured; full block demo blocked on runtime init

## Deploy

```sh
cd /Users/seb/Code/otto
bash apps/desktop/scripts/deploy-staging.sh
```

Deploy succeeded (`staging_pid` on port 9445). Script is not `+x`; use `bash` explicitly.

## Unit verification (compiler + runner path)

```sh
bun test ./packages/core/src/check.test.ts \
  ./apps/desktop/electron/check-store.test.ts \
  ./apps/desktop/electron/check-runner.test.ts \
  ./apps/desktop/electron/check-compiler.test.ts
```

**10 pass / 0 fail** — `done_claim` block + receipt fields proven in tests.

## Staging captured this pass

| Item | Result |
|------|--------|
| Checks surface lists seed/compiled checks | **true** — `134-checks-surface.png` |
| Runtime ready for live block demo | **false** — `reason: not initialized` |
| Disposable conversation on this profile | **null** |
| End-to-end 30s demo script | **not run** |

## Reference (prior ready session)

When staging profile had runtime initialized:

```txt
conversation=local-conv-80   # disposable — not default
runtime_ready=true
artifact=docs/receipts/staging/staging-proof-20260614061449.json
```

## Blocked artifacts

- `135-culture-ci-block.png` — not captured (requires connected runtime + repeat done claim)
- Video (064) — not attempted

## Machine-readable

`docs/receipts/staging/135-culture-ci-demo.json`
