# Issue #132 — Release packaging (ticket 140)

**Date:** 2026-06-15 · **Branch:** `issue-132-release-packaging` · **GitHub:** [#132](https://github.com/otto-haus/otto/issues/132)

## Scope closed in this pass

- Claims audit independent **+1** (`CLAIMS_AUDIT.md` review section)
- RELEASE_CHECKLIST links this receipt + **139** UI wedge receipt
- README / RELEASE_CHECKLIST / `ship-tier-matrix.md` Ship-Labs-Cut boundary unchanged on main — verified still aligned

## Still open (honest)

- **138** Ship core-path staging proof — partial; see RELEASE_CHECKLIST Ship table + ticket `138-ship-tier-core-path-proof.md`
- Sebastian sign-off rows (**142**) — NOT PUSHED banner remains
- Full `bun test` suite: 8 pre-existing failures in permission round-trip + runtime-common mapping (same on `main` at 53b8cb0)

## Verification

```sh
cd /Users/seb/Code/otto/.worktrees/p0-issue-132
bun install
bun run typecheck                                    # pass
bun test apps/desktop/src/surface-tiers.test.ts      # 6/6 pass

# Claims boundary grep
rg -i "discord bot|cloud sync|always.on|paperclip" README.md RELEASE_CHECKLIST.md
# → only negations / Cut / Labs labels (no shipped claims)

# Staging proof bundle (linked, not re-run)
# 139: docs/receipts/staging/124-126-123-139-ui-wedge-20260614.md
# 138: planning/hq-tickets/138-ship-tier-core-path-proof.md + hygiene receipt staging-hygiene-proof-20260614143512.json
```

## Cross-links

| Artifact | Path |
|----------|------|
| Ship tier matrix | `docs/v1/ship-tier-matrix.md` |
| Labs UX | `docs/v1/labs.md` |
| Claims audit | `CLAIMS_AUDIT.md` |
| Sebastian gate | `docs/receipts/staging/063-sebastian-gate-packet-v03-20260614.md` |
