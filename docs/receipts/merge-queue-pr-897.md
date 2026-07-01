# merge-queue receipt — PR #897

**PR:** https://github.com/otto-haus/otto/pull/897  
**Title:** ci(deps): bump actions/cache from 5.0.5 to 6.1.0  
**Branch:** `dependabot/github_actions/actions/cache-6.1.0`  
**Agent:** merge_prep babysit subagent  
**Date:** 2026-07-01

## Head OID

| Stage | OID |
|-------|-----|
| Before (dependabot commit) | `ee4a8d2fa85fc94296cf33cd0b0189b2b323dfc8` |
| After (audit fix pushed) | `c4925006855c322aedf727ae6df26d8dae84a030` |
| Final (receipt pushed) | `ebd5119f67bc3dcd5adee34308417abe6be85f82` |

## Rebase

- Fetched `origin/main` at `5869ad7ecdb6c4110f51e0fc4244e083e052e470`
- PR branch was already 1 commit ahead of main; **no rebase required**

## CI commands run (local)

| Command | Result |
|---------|--------|
| `bun install` | pass |
| `bun audit` | **pass** (No vulnerabilities found) after fix |
| `bun run typecheck` | pass |

## Fix applied

CI failed on `bun audit` (dompurify ≤3.4.10 via streamdown; undici 7.23–7.27 via electron toolchain). Added root `package.json` overrides and refreshed `bun.lock`:

```json
"dompurify": "^3.4.11",
"undici": ">=7.28.0"
```

Commit: `c492500` — `fix(deps): override dompurify and undici for clean bun audit`

## Push status

- **Succeeded:** `git push origin dependabot/github_actions/actions/cache-6.1.0`
- Remote updated: `ee4a8d2..7930837` (audit fix `c492500`, receipt `7930837`)

## Blockers

| Blocker | Status |
|---------|--------|
| `bun audit` (checks + scheduled-checks) | **resolved** — awaiting CI rerun |
| Merge | **not performed** (out of scope) |
| AGENT_LOOP schedules | **not armed** (out of scope) |

**Remaining:** wait for GitHub Actions on `c492500`; PR ready for human merge review once green.

## Notes

- Dependabot bump: `actions/cache` 5.0.5 → 6.1.0 (GitHub Actions workflow only)
- Audit vulnerabilities existed on main before this PR; overrides unblock the dependabot merge queue gate (same pattern as PRs #891, #892, #894)
