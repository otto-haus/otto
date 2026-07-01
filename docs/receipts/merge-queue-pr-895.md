# merge-queue receipt — PR #895

**PR:** https://github.com/otto-haus/otto/pull/895  
**Title:** unified shipping loop orchestrator  
**Branch:** `cursor/unified-shipping-loop-orchestrator-559e`  
**Agent:** merge_prep babysit subagent (unified shipping loop)  
**Date:** 2026-07-01

## Head OID

| Stage | OID |
|-------|-----|
| Before fix (remote PR tip) | `6504d671eef72e25ba4444a199b215d5cdfc7366` |
| After fix (pushed) | `729576b8bea573d8a5c9a11b35517b98d2a2b9af` |
| Final branch tip (receipt commit) | `3cb89d572bf9b8813badb6041048a695251ff4c4` |

## Rebase

- Fetched `origin/main` at `5869ad7ecdb6c4110f51e0fc4244e083e052e470`
- PR branch was 1 commit ahead of main; **no rebase required**

## CI failure investigation

Both failing checks (`checks`, `scheduled-checks`) stopped at **`dependency audit`** (`bun audit`).

Advisories (same pattern as PRs #891, #892, #894):

- `dompurify <=3.4.10` via `@otto-haus/desktop › streamdown` (moderate)
- `undici >=7.23.0 <7.28.0` via `@electron/get` / electron toolchain (3 high, 3 moderate, 2 low)

## Fix applied (PR branch only)

Commit `729576b` on `cursor/unified-shipping-loop-orchestrator-559e`:

- Root `package.json` overrides merged with existing `esbuild`: `dompurify ^3.4.11`, `undici >=7.28.0`
- Regenerated `bun.lock`

## CI commands run locally

| Command | Result |
|---------|--------|
| `bun install` | pass |
| `bun audit` | pass (No vulnerabilities found) |
| `bun run typecheck` | pass |

## Push status

- **Succeeded:** `git push origin cursor/unified-shipping-loop-orchestrator-559e`
- Remote updated: `6504d67..729576b` (audit fix), then `729576b..3b981ca` (receipt)

## Blockers

| Blocker | Status |
|---------|--------|
| `bun audit` (checks + scheduled-checks) | **resolved locally** — awaiting remote CI |
| Merge | **not performed** (out of scope) |
| PR close | **not performed** (out of scope) |

**Remaining:** remote CI confirmation on `729576b`; human merge review.

## Notes

- Same override pattern as merge-queue receipts for PRs #891, #892, #894
- Audit drift is systemic on `main`; this PR carries a minimal override fix to unblock the merge queue gate
