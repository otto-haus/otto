# merge-queue receipt — PR #906

**PR:** https://github.com/otto-haus/otto/pull/906  
**Title:** ci(deps): bump the github-actions-minor-and-patch group with 2 updates  
**Branch:** `dependabot/github_actions/github-actions-minor-and-patch-af2beed448`  
**Agent:** merge_prep babysit subagent  
**Date:** 2026-07-07

## Head OID

| Stage | OID |
|-------|-----|
| Before (babysit start) | `bc88313ceda0a3b4b9a680090044229b9d699aea` |
| After (audit fix pushed) | `e55ea6af8852097f12bb6510248ffa9312ccd670` |

## Rebase

- Fetched `origin/main` at latest
- PR branch was current with dependabot bump; **no rebase required**

## CI commands run (local)

| Command | Result |
|---------|--------|
| `bun install` | pass |
| `bun audit` | **pass** (No vulnerabilities found) after fix |
| `bun run typecheck` | pass |

## Fix applied

CI failed on `bun audit` (dompurify ≤3.4.10 via streamdown; undici 7.23–7.27 via electron toolchain). Same pattern as PR #891/#903. Added root `package.json` overrides and refreshed `bun.lock`:

```json
"dompurify": "^3.4.11",
"undici": ">=7.28.0"
```

Commit: `e55ea6a` — `fix(deps): override dompurify and undici for clean bun audit (#906 babysit)`

## Push status

- **Succeeded:** `git push origin HEAD:dependabot/github_actions/github-actions-minor-and-patch-af2beed448`
- Remote updated: `bc88313..e55ea6a`

## Blockers

| Blocker | Status |
|---------|--------|
| `bun audit` (checks job) | **resolved** locally; awaiting CI on `e55ea6a` |
| Merge | **not performed** (out of scope) |
| AGENT_LOOP schedules | **not armed** (out of scope) |

**Remaining:** CI green confirmation on pushed commit; human merge review.
