# Staging receipt — 135 Culture CI 30s demo

**Date:** 2026-06-14  
**Build:** `fff0152`  
**App:** `/Applications/otto-staging.app` only  
**Status:** **Pass** — unit path + surface sequence + live block banner (rev9/rev10)

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

## Staging captured

| Item | Result |
|------|--------|
| Checks surface lists seed/compiled checks | **true** — `135-culture-ci-demo/01-checks-surface.png` |
| Surface sequence (Curation, Standards, Chat) | **true** — `135-culture-ci-demo/*.png` |
| CheckBlockBanner block moment | **true** — `135-culture-ci-block.png` |
| Disposable conversation | **true** — `local-conv-c272e597-0931-4205-8887-5e6073306b26` (not `default`) |
| Runtime ready | **true** — `staging-rev7-proof-20260614070123.json` |
| Full correction→ratify loop on video | **optional** — operator-manual per runbook |

## Block proof (rev9)

```txt
conversation=local-conv-c272e597-0931-4205-8887-5e6073306b26
command=check ticket 135-demo
check_id=completion-requires-receipts
block_message=Not done: missing mapped proof.
proof=staging-rev7-proof-20260614070123.json
screenshot=docs/receipts/staging/135-culture-ci-block.png
```

## Not in scope this pass

- Video (064) — screenshot sequence satisfies Done-when

## Machine-readable

`docs/receipts/staging/135-culture-ci-demo.json`
