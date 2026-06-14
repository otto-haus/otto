# 138 — Ship Tier: Core Path Proof (Embedded + Chat + Culture CI)

Owner: Codex + Cursor
Implementer model: Composer 2.5 Fast
Priority: P0
Depends on: 136, 076, 137
Release bucket: v0.1 functional ship — **Ship tier works**

Label: Ship blocker

## Outcome

Every row marked **Ship** in `docs/v1/ship-tier-matrix.md` is proven on **staging** with disposable conversations — not unit tests alone.

Minimum bar for launch:

```txt
Download otto staging → onboarding → real chat turn → Culture CI demo (135) → every Ship sidebar pane usable
```

## Why this matters

Labs gating (**137**) does not excuse a broken core. Chat without embedded Letta bootstrap is not a functional product.

## Scope

### P0 — Runtime substrate

- Finish **076** acceptance on staging disposable profile:
  - Bundled `@letta-ai/letta-code` resolves without Letta.app
  - Bootstrap → `session.initialize()` → one real assistant turn
  - Receipt: `docs/receipts/staging/staging-076-bootstrap-proof-*.json`
- Onboarding smoke green with runtime (fix or document blocker if Letta unavailable in CI)

### P0 — Culture CI (Ship thesis)

- Run `docs/v1/demo-culture-ci.md` end-to-end on staging with `runtime_ready: true`
- Capture: screen recording or PNG sequence + receipt JSON
- Checks block visible in Chat on second “Done.” without proof

### P1 — Ship surface walkthrough

For each **Ship** row in matrix (file-backed + live):

- Charters, Standards, Practices, Routines — load without error
- Curation — propose from correction (**123/048**) + ratify (**126**)
- Receipts — list real files under `~/.otto` staging home
- Checks surface — seed checks listed
- Autonomy — policy readable
- Skills — skill index loads
- Tickets — compile + orchestrate smoke (no re-compile on existing)

### Reopen hygiene

- Move any Ship-tier ticket from `_Done/` back to `_InReview/` if matrix audit (**136**) flagged missing proof; re-close only after proof attached

## Non-goals

- Labs-tier features (**139**)
- Public push/tag (**140**)
- Fresh-Mac VM proof (nice-to-have; document if blocked)

## Done when

- [ ] `ship-tier-matrix.md` Ship column all **pass** with dated staging receipts linked
- [ ] **076** last verdict +1 with bootstrap turn receipt (not partial)
- [ ] **135** demo runbook executed; artifact in `docs/receipts/staging/`
- [ ] `otto-staging-onboarding-smoke.cjs` passes when Letta available OR matrix documents required env with Sebastian ack
- [ ] `otto-staging-rev8-proof.cjs` → `ok: true`
- [ ] `otto-staging-two-thread-smoke.cjs` passes (046 isolation)
- [ ] Reviewer +1: “default product (Labs off) core loop is falsifiable and works”

## Verification

```sh
cd /Users/seb/Code/otto
bun run verify:v0
bash scripts/release-gate.sh

OTTO_STAGING_REFRESH=1 bash apps/desktop/scripts/deploy-staging.sh

NODE_PATH=$HOME/.codex/admin/node_modules \
  OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
  node scripts/otto-staging-onboarding-smoke.cjs

NODE_PATH=$HOME/.codex/admin/node_modules \
  node scripts/otto-staging-rev8-proof.cjs

NODE_PATH=$HOME/.codex/admin/node_modules \
  node scripts/otto-staging-two-thread-smoke.cjs

NODE_PATH=$HOME/.codex/admin/node_modules \
  node scripts/otto-staging-076-bootstrap-proof.cjs

# Hygiene bundle (049, 053–058) — sidebar panes + ticket orchestrate + practices charter
NODE_PATH=$HOME/.codex/admin/node_modules \
  OTTO_RECEIPT_DIR=$PWD/docs/receipts/staging \
  node scripts/otto-staging-hygiene-proof.cjs

bash scripts/embedded-letta-smoke.sh   # when OTTO_EMBEDDED_APP points at staging .app
# follow docs/v1/demo-culture-ci.md
```

## Staging proof log (2026-06-14)

| Script | Result | Receipt |
|--------|--------|---------|
| `deploy-staging.sh` | pass | `/Applications/otto-staging.app`, CDP 9445, isolated profile |
| `otto-staging-hygiene-proof.cjs` | pass (`ok: true`) | `docs/receipts/staging/staging-hygiene-proof-20260614143512.json` |
| `release-gate.sh` + `verify:v0` | pass | 5/5, 186 unit tests |
| `otto-staging-onboarding-smoke.cjs` | not re-run this session | prior receipts or run before 063 sign-off |
| `otto-staging-rev8-proof.cjs` | not re-run this session | compile path covered in hygiene 049 |
| `otto-staging-two-thread-smoke.cjs` | not re-run this session | 046 unit tests green in verify:v0 |
| `demo-culture-ci.md` | not re-run this session | required before Shipped |

**Note:** Kill stray `otto-staging.app` instances not using `--remote-debugging-port=9445` before CDP scripts — they break nav selectors.

## Blocker log

Leave blank unless blocked.
